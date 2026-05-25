module.exports = {
  botToken: process.env.BOT_TOKEN,
  databaseUrl: process.env.DATABASE_URL,
  adminTelegramIds: (process.env.ADMIN_TELEGRAM_IDS || '').split(',').map(id => id.trim()).filter(Boolean),
  playerBaseUrl: process.env.PLAYER_BASE_URL,
  cronEnabled: process.env.CRON_ENABLED === 'true',
  storage: {
    provider: process.env.STORAGE_PROVIDER,
    bucket: process.env.STORAGE_BUCKET,
    accessKey: process.env.STORAGE_ACCESS_KEY,
    secretKey: process.env.STORAGE_SECRET_KEY,
  },
  payment: {
    provider: process.env.PAYMENT_PROVIDER,
    testMode: process.env.PAYMENT_TEST_MODE === 'true',
  },
  webhookBaseUrl: process.env.WEBHOOK_BASE_URL,
};
