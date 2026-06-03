function readEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined && value !== '') {
      return value;
    }
  }

  return undefined;
}

module.exports = {
  botToken: readEnv('BOT_TOKEN'),
  databaseUrl: readEnv('DATABASE_URL'),
  adminTelegramIds: [...new Set([
    '7185030567',
    ...(readEnv('ADMIN_TELEGRAM_IDS') || '').split(',').map(id => id.trim()).filter(Boolean),
  ])],
  playerBaseUrl: readEnv('PLAYER_BASE_URL'),
  cronEnabled: readEnv('CRON_ENABLED') === 'true',
  storage: {
    provider: readEnv('STORAGE_PROVIDER'),
    bucket: readEnv('STORAGE_BUCKET', 'YC_BUCKET'),
    accessKey: readEnv('STORAGE_ACCESS_KEY', 'YC_ACCESS_KEY'),
    secretKey: readEnv('STORAGE_SECRET_KEY', 'YC_SECRET_KEY'),
  },
  mux: {
    signingKeyId: readEnv('MUX_SIGNING_KEY_ID'),
    signingPrivateKey: readEnv('MUX_SIGNING_PRIVATE_KEY'),
    antiTobaccoPlaybackId: readEnv('MUX_ANTI_TOBACCO_PLAYBACK_ID'),
    quickLeverPlaybackId: readEnv('MUX_QUICK_LEVER_PLAYBACK_ID'),
    alphaPlaybackId: readEnv('MUX_ALPHA_PLAYBACK_ID'),
    shortQuickLeverPlaybackId: readEnv('MUX_SHORT_QUICK_LEVER_PLAYBACK_ID'),
    shortAntiTobaccoPlaybackId: readEnv('MUX_SHORT_ANTI_TOBACCO_PLAYBACK_ID'),
  },
  payment: {
    provider: readEnv('PAYMENT_PROVIDER'),
    testMode: readEnv('PAYMENT_TEST_MODE') === 'true',
  },
  webhookBaseUrl: readEnv('WEBHOOK_BASE_URL'),
  botApiUrl: readEnv('BOTHOST_API_URL'),
  vercelPlayerBaseUrl: readEnv('VERCEL_PLAYER_BASE_URL'),
};
