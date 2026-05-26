require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

// TEMP DIAGNOSTIC — удалить после проверки env на Bothost
console.log('[ENV KEYS]', Object.keys(process.env).filter(k =>
  !k.includes('TOKEN') &&
  !k.includes('KEY') &&
  !k.includes('SECRET') &&
  !k.includes('PASSWORD')
).sort());
// END TEMP DIAGNOSTIC

const { bot } = require('./bot/bot');
const config = require('./config');
const { startCron } = require('./cron');
const { startPlayerServer } = require('./player/server');
const { startTunnel } = require('./tunnel/cloudflared');

startPlayerServer();
startTunnel().catch(err => console.error('[cloudflared] error:', err.message));

bot.launch().then(() => {
  console.log('NeuroTech Quit Bot запущен');
  if (config.cronEnabled) {
    startCron(bot);
  } else {
    console.log('Cron-задачи отключены');
  }
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
