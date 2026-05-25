const cron = require('node-cron');
const { runRemindersCron } = require('./reminders');
const { runNextDayFollowupCron } = require('./nextDayFollowup');
const { runSevenDayFollowupCron } = require('./sevenDayFollowup');

function startCron(bot) {
  cron.schedule('*/2 * * * *', () => runRemindersCron(bot));
  cron.schedule('*/5 * * * *', () => runNextDayFollowupCron(bot));
  cron.schedule('0 * * * *',   () => runSevenDayFollowupCron(bot));
  console.log('Cron-задачи запущены');
}

module.exports = { startCron };
