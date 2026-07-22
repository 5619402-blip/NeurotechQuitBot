const crypto = require('crypto');
const config = require('../config');

// Подпись для callback-адреса плеера: HMAC от sessionId на секрете бота.
// Плеер не может подделать завершение чужой сессии — подпись знает только сервер.
function signSession(sessionId) {
  return crypto
    .createHmac('sha256', String(config.botToken))
    .update(String(sessionId))
    .digest('hex')
    .slice(0, 32);
}

function verifySession(sessionId, sig) {
  if (!sig || typeof sig !== 'string') return false;
  const expected = signSession(sessionId);
  try {
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

module.exports = { signSession, verifySession };
