const {
  getDueSevenDayFollowups,
  markSevenDayFollowupSent,
  cancelSevenDayFollowup,
} = require('../db/sevenDayFollowups');
const { getUserById } = require('../db/users');
const { getSdfQ1Data } = require('../bot/screens/sevenDayFollowupQ');

let isRunning = false;

async function runSevenDayFollowupCron(bot) {
  if (isRunning) return;
  isRunning = true;
  try {
    const followups = await getDueSevenDayFollowups();
    for (const followup of followups) {
      try {
        const user = await getUserById(followup.user_id);
        if (!user) {
          await cancelSevenDayFollowup(followup.id);
          continue;
        }

        const { text, keyboard } = getSdfQ1Data(followup.id);
        await bot.telegram.sendMessage(user.telegram_id, text, keyboard);
        await markSevenDayFollowupSent(followup.id);
      } catch (err) {
        console.error(`[cron:sdf] Error on followup ${followup.id}:`, err.message);
        const blocked = err.description && (
          err.description.includes('bot was blocked') ||
          err.description.includes('user is deactivated')
        );
        if (blocked) await cancelSevenDayFollowup(followup.id);
      }
    }
  } catch (err) {
    console.error('[cron:sdf] Unexpected error:', err.message);
  } finally {
    isRunning = false;
  }
}

module.exports = { runSevenDayFollowupCron };
