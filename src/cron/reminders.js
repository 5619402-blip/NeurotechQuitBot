const {
  getDueReminders,
  getSentRemindersForReschedule,
  markReminderSent,
  cancelReminder,
  rescheduleReminder,
  expireReminder,
} = require('../db/reminders');
const { getUserById, setPaused } = require('../db/users');
const { getProcedureById, hasCompletedSessionForProcedure } = require('../db/sessions');
const { buildReminderText, buildReminderKeyboard } = require('../bot/screens/reminderMessage');

let isRunning = false;

async function runRemindersCron(bot) {
  if (isRunning) return;
  isRunning = true;
  console.log('[cron] run reminders');
  try {
    await _sendDueReminders(bot);
    await _rescheduleOrExpire();
  } catch (err) {
    console.error('[cron:reminders] Unexpected error:', err.message);
  } finally {
    isRunning = false;
  }
}

async function _sendDueReminders(bot) {
  const reminders = await getDueReminders();
  for (const reminder of reminders) {
    try {
      const user = await getUserById(reminder.user_id);
      if (!user) {
        await cancelReminder(reminder.id);
        continue;
      }

      const procedureAlreadyDone = reminder.procedure_id
        ? await hasCompletedSessionForProcedure(reminder.user_id, reminder.procedure_id, reminder.related_session_id)
        : false;

      if (
        procedureAlreadyDone ||
        user.user_status === 'protocol_paused' ||
        user.user_status === 'not_smoking' ||
        reminder.reminder_count >= 3
      ) {
        await cancelReminder(reminder.id);
        continue;
      }

      const procedure = reminder.procedure_id
        ? await getProcedureById(reminder.procedure_id)
        : null;
      const procedureType = procedure?.procedure_type ?? null;

      await bot.telegram.sendMessage(
        user.telegram_id,
        buildReminderText(procedureType),
        buildReminderKeyboard(reminder.id)
      );
      await markReminderSent(reminder.id);
    } catch (err) {
      console.error(`[cron:reminders] Error on reminder ${reminder.id}:`, err.message);
      const blocked = err.description && (
        err.description.includes('bot was blocked') ||
        err.description.includes('user is deactivated')
      );
      if (blocked) await cancelReminder(reminder.id);
    }
  }
}

async function _rescheduleOrExpire() {
  const reminders = await getSentRemindersForReschedule();
  for (const reminder of reminders) {
    try {
      if (reminder.reminder_count < 3) {
        await rescheduleReminder(reminder.id, reminder.sent_at);
      } else {
        await expireReminder(reminder.id);
        const user = await getUserById(reminder.user_id);
        if (user) await setPaused(user.id, 'reminder_expired');
      }
    } catch (err) {
      console.error(`[cron:reminders] Reschedule error on reminder ${reminder.id}:`, err.message);
    }
  }
}

module.exports = { runRemindersCron };
