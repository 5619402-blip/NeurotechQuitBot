const express = require('express');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getPlayerToken } = require('../db/playerTokens');

const PRESIGN_TTL = 600; // 10 минут

function buildS3Client() {
  return new S3Client({
    region: 'ru-central1',
    endpoint: 'https://storage.yandexcloud.net',
    credentials: {
      accessKeyId: process.env.YC_ACCESS_KEY,
      secretAccessKey: process.env.YC_SECRET_KEY,
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

    function fmt(s) {
      if (!isFinite(s)) return '–:––';
      const m = Math.floor(s / 60);
      const sec = Math.floor(s % 60);
      return m + ':' + String(sec).padStart(2, '0');
    }

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

  const bucket = process.env.STORAGE_BUCKET;
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

  app.get('/player', playerHandler);

  app.listen(port, () => {
    console.log(`Player server запущен на порту ${port}`);
  });
}

module.exports = { startPlayerServer };
