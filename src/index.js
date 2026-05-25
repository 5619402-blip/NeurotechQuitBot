require('dotenv').config();
const { bot } = require('./bot/bot');
const config = require('./config');
const { startCron } = require('./cron');
const { startPlayerServer } = require('./player/server');

startPlayerServer();

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
