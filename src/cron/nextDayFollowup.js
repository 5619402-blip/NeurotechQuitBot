const {
  getDueNextDayFollowups,
  markNextDayFollowupSent,
  cancelNextDayFollowup,
} = require('../db/nextDayFollowups');
const { getUserById } = require('../db/users');
const { getSessionById } = require('../db/sessions');
const { getNdfQ1Data } = require('../bot/screens/nextDayFollowupQ');

let isRunning = false;

async function runNextDayFollowupCron(bot) {
  if (isRunning) return;
  isRunning = true;
  try {
    const followups = await getDueNextDayFollowups();
    for (const followup of followups) {
      try {
        const [user, session] = await Promise.all([
          getUserById(followup.user_id),
          getSessionById(followup.procedure_session_id),
        ]);

        if (!user) {
          await cancelNextDayFollowup(followup.id);
          continue;
        }

        if (
          user.user_status === 'not_smoking' ||
          user.user_status === 'protocol_paused' ||
          !session ||
          session.session_status !== 'completed'
        ) {
          await cancelNextDayFollowup(followup.id);
          continue;
        }

        const { text, keyboard } = getNdfQ1Data(followup.id);
        await bot.telegram.sendMessage(user.telegram_id, text, keyboard);
        await markNextDayFollowupSent(followup.id);
      } catch (err) {
        console.error(`[cron:ndf] Error on followup ${followup.id}:`, err.message);
        const blocked = err.description && (
          err.description.includes('bot was blocked') ||
          err.description.includes('user is deactivated')
        );
        if (blocked) await cancelNextDayFollowup(followup.id);
      }
    }
  } catch (err) {
    console.error('[cron:ndf] Unexpected error:', err.message);
  } finally {
    isRunning = false;
  }
}

module.exports = { runNextDayFollowupCron };
