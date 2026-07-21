const express = require('express');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const config = require('../config');
const { getPlayerToken, getTokenForLaunch, markTokenUsed } = require('../db/playerTokens');
const { getAdminPreviewToken, incrementAdminPreviewUseCount } = require('../db/adminPreviewTokens');
const { getMuxPlaybackId } = require('../mux/playbackIds');
const { generateMuxPlaybackToken } = require('../mux/token');

const PRESIGN_TTL = 600; // 10 минут
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

function buildS3Client() {
  return new S3Client({
    region: 'ru-central1',
    endpoint: 'https://storage.yandexcloud.net',
    credentials: {
      accessKeyId: config.storage.accessKey,
      secretAccessKey: config.storage.secretKey,
    },
  });
}

function buildPlayerHtml(signedUrl) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>NeuroTech — Процедура</title>
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
    }
    .card {
      width: 100%;
      max-width: 420px;
      background: #1a1a1a;
      border-radius: 16px;
      padding: 32px 24px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      box-shadow: 0 4px 32px rgba(0,0,0,0.5);
    }
    h1 { font-size: 1.1rem; font-weight: 600; text-align: center; color: #fff; }
    p.hint {
      font-size: 0.85rem;
      text-align: center;
      color: #888;
      line-height: 1.6;
    }
    .time-display {
      text-align: center;
      font-size: 1.4rem;
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.05em;
      color: #ccc;
    }
    .btn {
      width: 100%;
      padding: 16px;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .btn-play  { background: #4a9eff; color: #fff; }
    .btn-play:hover  { background: #3a8eef; }
    .btn-pause { background: #333; color: #aaa; }
    .btn-pause:hover { background: #3a3a3a; }
  </style>
</head>
<body>
  <div class="card">
    <h1>NeuroTech Quit — Антиникотин</h1>
    <p class="hint">Наденьте наушники, займите удобное положение.<br>Нажмите «Начать» и проходите процедуру без остановок.</p>

    <audio id="audio" src="${signedUrl}" preload="metadata"></audio>

    <div class="time-display" id="timeDisplay">0:00 / –:––</div>

    <button class="btn btn-play" id="toggleBtn" onclick="togglePlay()">Начать</button>

    <p class="hint" id="statusHint">Не закрывайте страницу до окончания процедуры.</p>
  </div>

  <script>
    const audio = document.getElementById('audio');
    const btn   = document.getElementById('toggleBtn');
    const disp  = document.getElementById('timeDisplay');
    const hint  = document.getElementById('statusHint');

    let maxAllowedTime = 0;

    // Запрет перемотки
    audio.addEventListener('seeking', () => {
      if (audio.currentTime > maxAllowedTime + 1.5) {
        audio.currentTime = maxAllowedTime;
      }
    });

    // Запрет изменения скорости
    audio.addEventListener('ratechange', () => {
      if (audio.playbackRate !== 1) audio.playbackRate = 1;
    });

    // Обновление разрешённой позиции во время воспроизведения
    audio.addEventListener('timeupdate', () => {
      if (!audio.paused) {
        maxAllowedTime = audio.currentTime;
      }
      const dur = isFinite(audio.duration) ? fmt(audio.duration) : '–:––';
      disp.textContent = fmt(audio.currentTime) + ' / ' + dur;
    });

    audio.addEventListener('loadedmetadata', () => {
      const dur = isFinite(audio.duration) ? fmt(audio.duration) : '–:––';
      disp.textContent = '0:00 / ' + dur;
    });

    audio.addEventListener('ended', () => {
      btn.textContent = 'Готово';
      btn.className = 'btn btn-pause';
      btn.onclick = null;
      hint.textContent = 'Процедура завершена. Вернитесь в Telegram.';
    });

    function fmt(s) {
      if (!isFinite(s)) return '–:––';
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return m + ':' + String(sec).padStart(2, '0');
    }

    function togglePlay() {
      if (audio.paused) {
        audio.play().then(() => {
          btn.textContent = 'Пауза';
          btn.className = 'btn btn-pause';
        }).catch(() => {});
      } else {
        audio.pause();
        btn.textContent = 'Продолжить';
        btn.className = 'btn btn-play';
      }
    }
  </script>
</body>
</html>`;
}

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

    const redirectUrl = `${vercelBase}/player?procedure=${row.procedure_type}&playbackId=${playbackId}&token=${muxToken}`;
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

async function playerHandler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send('Bad Request: token required');
  }

  const row = await getPlayerToken(token);
  if (!row) {
    return res.status(404).send('Not Found: invalid token');
  }

  if (row.is_revoked) {
    return res.status(403).send('Forbidden: token revoked');
  }

  if (new Date(row.expires_at) < new Date()) {
    return res.status(410).send('Gone: token expired');
  }

  if (row.session_status !== 'started') {
    return res.status(403).send('Forbidden: session not active');
  }

  const bucket = config.storage.bucket;
  if (!bucket) {
    console.error('[player] STORAGE_BUCKET не задан');
    return res.status(500).send('Server Error');
  }

  let signedUrl;
  try {
    const s3 = buildS3Client();
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: row.storage_path,
    });
    signedUrl = await getSignedUrl(s3, command, { expiresIn: PRESIGN_TTL });
  } catch (err) {
    console.error('[player] ошибка генерации URL:', err.message);
    return res.status(500).send('Server Error');
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.send(buildPlayerHtml(signedUrl));
}

function startPlayerServer() {
  const app = express();
  const port = parseInt(process.env.PLAYER_PORT || '3000', 10);

  app.get('/launch/:token', launchHandler);
  app.get('/admin-preview/:token', adminPreviewHandler);
  app.get('/player', playerHandler);

  app.listen(port, () => {
    console.log(`Player server запущен на порту ${port}`);
  });
}

module.exports = { startPlayerServer };
