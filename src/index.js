require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });

const { bot } = require('./bot/bot');
const config = require('./config');
const { startCron } = require('./cron');
const { startPlayerServer } = require('./player/server');
const { startTunnel } = require('./tunnel/cloudflared');
const publicUrl = require('./tunnel/publicUrl');

async function main() {
  startPlayerServer(bot);

  console.log('[startup] calling bot.launch()');
  bot.launch()
    .then(() => console.log('[startup] bot.launch() ok'))
    .catch(err => console.error('[startup] bot.launch() error:', err.message));

  // Команды в меню Telegram (кнопка «/» у клиента)
  bot.telegram.setMyCommands([
    { command: 'start', description: 'Перезапустить бота' },
  ]).catch(err => console.error('[startup] setMyCommands:', err.message));

  if (config.cronEnabled) {
    console.log('[startup] cronEnabled=true, starting cron');
    startCron(bot);
  } else {
    console.log('[startup] cron disabled (CRON_ENABLED=false)');
  }

  try {
    const tunnelUrl = await startTunnel();
    publicUrl.set(tunnelUrl);
    console.log('[main] tunnel ready:', tunnelUrl);
  } catch (err) {
    console.error('[main] tunnel error:', err.message);
    console.error('[main] bot and cron continue without tunnel');
  }
}

main().catch(err => {
  console.error('[main] fatal:', err.message);
  process.exit(1);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
