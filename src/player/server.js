const express = require('express');
const config = require('../config');
const { getTokenForLaunch, markTokenUsed } = require('../db/playerTokens');
const { getAdminPreviewToken, incrementAdminPreviewUseCount } = require('../db/adminPreviewTokens');
const { getMuxPlaybackId } = require('../mux/playbackIds');
const { generateMuxPlaybackToken } = require('../mux/token');
const { signSession, verifySession } = require('./signature');
const { completeFromPlayer, interruptFromPlayer } = require('../bot/procedureCompletion');
const publicUrl = require('../tunnel/publicUrl');

// Инстанс бота, передаётся из index.js — нужен, чтобы после callback от плеера
// самим прислать пользователю следующий экран в Telegram.
let botRef = null;

const GRACE_MS = 10_000; // окно кэша redirect для повторного запроса одного токена
const redirectCache   = new Map(); // token → { url, expiresAt }
const pendingRequests = new Map(); // token → Promise<string> (in-flight)

const LINK_UNAVAILABLE_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>NeuroTech Quit</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #0f0f0f;
      color: #e8e8e8;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 24px;
      text-align: center;
    }
    h1 { font-size: 1.1rem; font-weight: 600; color: #fff; margin-bottom: 12px; }
    p { font-size: 0.9rem; color: #888; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>NeuroTech Quit</h1>
  <p>Ссылка недоступна.<br>Вернитесь в Telegram-бот, чтобы продолжить.</p>
</body>
</html>`;

async function launchHandler(req, res) {
  const { token } = req.params;

  if (!token) {
    return res.status(400).send(LINK_UNAVAILABLE_HTML);
  }

  // 1. Кэш недавнего redirect: повторный запрос того же токена → тот же URL
  const cached = redirectCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    console.log('[launch] cache redirect:', token.slice(0, 8));
    return res.redirect(302, cached.url);
  }

  // 2. In-flight: параллельный запрос того же токена → ждём результат первого
  const inflight = pendingRequests.get(token);
  if (inflight) {
    console.log('[launch] await inflight:', token.slice(0, 8));
    try {
      const url = await inflight;
      return res.redirect(302, url);
    } catch {
      console.log('[launch] inflight blocked:', token.slice(0, 8));
      return res.status(403).send(LINK_UNAVAILABLE_HTML);
    }
  }

  // 3. Обработка запроса
  let settle;
  const processing = new Promise((resolve, reject) => { settle = { resolve, reject }; });
  pendingRequests.set(token, processing);

  try {
    const row = await getTokenForLaunch(token);

    // Токен одноразовый, TTL 5 минут (решение владельца — безопасность):
    // блокируем отозванные, истёкшие, уже использованные и токены неактивных сессий.
    if (!row || row.is_revoked || row.used_at || new Date(row.expires_at) < new Date()) {
      console.log('[launch] blocked (invalid/expired):', token.slice(0, 8));
      settle.reject(new Error('blocked'));
      pendingRequests.delete(token);
      return res.status(403).send(LINK_UNAVAILABLE_HTML);
    }

    if (row.session_status !== 'started') {
      console.log('[launch] blocked (session not started):', token.slice(0, 8));
      settle.reject(new Error('blocked'));
      pendingRequests.delete(token);
      return res.status(403).send(LINK_UNAVAILABLE_HTML);
    }

    // Атомарно забираем одноразовый токен; при гонке побеждает первый запрос
    const claimed = await markTokenUsed(token);
    if (!claimed) {
      console.log('[launch] race blocked:', token.slice(0, 8));
      settle.reject(new Error('race blocked'));
      pendingRequests.delete(token);
      return res.status(403).send(LINK_UNAVAILABLE_HTML);
    }

    let playbackId;
    let muxToken;
    try {
      playbackId = getMuxPlaybackId(row.procedure_type);
      muxToken = generateMuxPlaybackToken(playbackId);
    } catch (err) {
      console.error('[launch] Mux token error:', err.message);
      settle.reject(err);
      pendingRequests.delete(token);
      return res.status(500).send(LINK_UNAVAILABLE_HTML);
    }

    const vercelBaseRaw = config.vercelPlayerBaseUrl;
    if (!vercelBaseRaw) {
      console.error('[launch] VERCEL_PLAYER_BASE_URL не задан');
      settle.reject(new Error('no vercel url'));
      pendingRequests.delete(token);
      return res.status(500).send(LINK_UNAVAILABLE_HTML);
    }
    const vercelBase = vercelBaseRaw.replace(/\/player\/?$/, '').replace(/\/$/, '');

    // sessionId + подпись + адрес callback: плеер сообщит боту о завершении/выходе.
    // Подпись HMAC — подделать завершение чужой сессии нельзя.
    let redirectUrl = `${vercelBase}/player?procedure=${row.procedure_type}&playbackId=${playbackId}&token=${muxToken}`;
    const cbBase = publicUrl.get();
    if (row.session_id && cbBase) {
      redirectUrl += `&sessionId=${row.session_id}&sig=${signSession(row.session_id)}&cb=${encodeURIComponent(cbBase)}`;
    }
    redirectCache.set(token, { url: redirectUrl, expiresAt: Date.now() + GRACE_MS });
    settle.resolve(redirectUrl);
    pendingRequests.delete(token);
    console.log('[launch] redirect ok:', token.slice(0, 8));
    return res.redirect(302, redirectUrl);

  } catch (err) {
    console.error('[launch] unexpected error:', err.message);
    settle.reject(err);
    pendingRequests.delete(token);
    return res.status(500).send(LINK_UNAVAILABLE_HTML);
  }
}

async function adminPreviewHandler(req, res) {
  const { token } = req.params;
  if (!token) return res.status(400).send(LINK_UNAVAILABLE_HTML);

  let row;
  try {
    row = await getAdminPreviewToken(token);
  } catch (err) {
    console.error('[admin-preview] DB error:', err.message);
    return res.status(500).send(LINK_UNAVAILABLE_HTML);
  }

  if (!row) {
    console.log('[admin-preview] not found:', token.slice(0, 8));
    return res.status(404).send(LINK_UNAVAILABLE_HTML);
  }
  if (row.is_revoked) {
    console.log('[admin-preview] revoked:', token.slice(0, 8));
    return res.status(403).send(LINK_UNAVAILABLE_HTML);
  }
  if (new Date(row.expires_at) < new Date()) {
    console.log('[admin-preview] expired:', token.slice(0, 8));
    return res.status(403).send(LINK_UNAVAILABLE_HTML);
  }
  if (row.use_count >= row.max_uses) {
    console.log('[admin-preview] max uses reached:', token.slice(0, 8));
    return res.status(403).send(LINK_UNAVAILABLE_HTML);
  }

  let playbackId;
  let muxToken;
  try {
    playbackId = getMuxPlaybackId(row.procedure_type);
    muxToken = generateMuxPlaybackToken(playbackId);
  } catch (err) {
    console.error('[admin-preview] Mux error:', err.message);
    return res.status(500).send(LINK_UNAVAILABLE_HTML);
  }

  const vercelBaseRaw = config.vercelPlayerBaseUrl;
  if (!vercelBaseRaw) {
    console.error('[admin-preview] VERCEL_PLAYER_BASE_URL не задан');
    return res.status(500).send(LINK_UNAVAILABLE_HTML);
  }
  const vercelBase = vercelBaseRaw.replace(/\/player\/?$/, '').replace(/\/$/, '');

  try {
    await incrementAdminPreviewUseCount(row.id);
  } catch (err) {
    console.error('[admin-preview] incrementUseCount error:', err.message);
  }

  const redirectUrl = `${vercelBase}/player?procedure=${row.procedure_type}&playbackId=${playbackId}&token=${muxToken}`;
  console.log('[admin-preview] redirect ok:', token.slice(0, 8), '| uses:', row.use_count + 1, '/', row.max_uses);
  return res.redirect(302, redirectUrl);
}

// Legacy-маршрут /player удалён (23.07): прямые presigned-ссылки на файл
// были дырой в защите аудио. Единственный путь — /launch/<token> → Mux-плеер.

// Callback от плеера: дослушал аудио → event=completed, «Экстренно выйти» → event=interrupted.
// Тело — JSON строкой (text/plain, чтобы браузер слал без CORS preflight).
// Проверка подписи обязательна; бухгалтерия идемпотентна (повторный callback безвреден).
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

async function sessionCallbackHandler(req, res) {
  setCorsHeaders(res);

  let data;
  try {
    data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(400).json({ ok: false });
  }

  const sessionId = parseInt(data?.sessionId, 10);
  const { sig, event } = data || {};

  if (!Number.isInteger(sessionId) || !verifySession(sessionId, sig)) {
    console.log('[callback] bad signature, sessionId=', data?.sessionId);
    return res.status(403).json({ ok: false });
  }
  if (!botRef) {
    console.error('[callback] bot instance не передан в startPlayerServer');
    return res.status(503).json({ ok: false });
  }

  try {
    let result;
    if (event === 'completed') {
      result = await completeFromPlayer(botRef, sessionId);
    } else if (event === 'interrupted') {
      result = await interruptFromPlayer(botRef, sessionId);
    } else {
      return res.status(400).json({ ok: false });
    }
    console.log('[callback]', event, 'session=', sessionId, '→', result.ok ? 'ok' : result.reason);
    // Даже если сессия уже не 'started' (повтор/тест-кнопка успела раньше) — отвечаем ok.
    return res.json({ ok: true });
  } catch (err) {
    console.error('[callback] error:', err.message);
    return res.status(500).json({ ok: false });
  }
}

function startPlayerServer(bot) {
  botRef = bot || null;
  const app = express();
  const port = parseInt(process.env.PLAYER_PORT || '3000', 10);

  app.get('/launch/:token', launchHandler);
  app.get('/admin-preview/:token', adminPreviewHandler);

  app.options('/session-callback', (req, res) => {
    setCorsHeaders(res);
    res.sendStatus(204);
  });
  app.post('/session-callback', express.text({ type: '*/*', limit: '10kb' }), sessionCallbackHandler);

  app.listen(port, () => {
    console.log(`Player server запущен на порту ${port}`);
  });
}

module.exports = { startPlayerServer };
