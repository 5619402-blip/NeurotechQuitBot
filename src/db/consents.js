const db = require('./connection');

async function saveConsent(userId, telegramId, version, source) {
  await db('user_consents').insert({
    user_id: userId,
    telegram_id: telegramId,
    consent_version: version,
    source: source ?? null,
    accepted_at: db.fn.now(),
  });
  console.log(`[consent] saved: user=${telegramId} version=${version}`);
}

module.exports = { saveConsent };
