const cron = require('node-cron');
const { runRemindersCron } = require('./reminders');
const { runNextDayFollowupCron } = require('./nextDayFollowup');
const { runSevenDayFollowupCron } = require('./sevenDayFollowup');
const { runAbandonedSessionsCron } = require('./abandonedSessions');

function startCron(bot) {
  cron.schedule('*/2 * * * *', () => {
    console.log('[cron] tick reminders');
    runRemindersCron(bot);
  });
  cron.schedule('*/5 * * * *', () => runNextDayFollowupCron(bot));
  cron.schedule('0 * * * *',   () => runSevenDayFollowupCron(bot));
  cron.schedule('*/10 * * * *', () => runAbandonedSessionsCron());
  console.log('[cron] started');
}

module.exports = { startCron };
