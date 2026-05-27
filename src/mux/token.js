const jwt = require('jsonwebtoken');
const config = require('../config');

const TOKEN_TTL_SECONDS = 2 * 60 * 60; // 2 часа — аудио длится ~1ч, запас на задержку старта

function getPrivateKeyPem() {
  const raw = config.mux.signingPrivateKey;
  if (!raw) throw new Error('MUX_SIGNING_PRIVATE_KEY не задан');
  // Ключ хранится в env как base64-строка в одну строку
  return Buffer.from(raw, 'base64').toString('utf8');
}

function generateMuxPlaybackToken(playbackId) {
  const keyId = config.mux.signingKeyId;
  if (!keyId) throw new Error('MUX_SIGNING_KEY_ID не задан');
  if (!playbackId) throw new Error('playbackId не передан');

  const privateKey = getPrivateKeyPem();

  const token = jwt.sign(
    { sub: playbackId, aud: 'v' },
    privateKey,
    { algorithm: 'RS256', expiresIn: TOKEN_TTL_SECONDS, keyid: keyId }
  );

  console.log('[mux] playback token generated for playbackId=' + playbackId.slice(0, 8) + '...');
  return token;
}

module.exports = { generateMuxPlaybackToken };
