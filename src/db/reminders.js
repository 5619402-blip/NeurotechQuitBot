const db = require('./connection');

async function createReminder(userId, procedureId, relatedSessionId) {
  try {
    const existing = await db('reminders')
      .where({ related_session_id: relatedSessionId, reminder_type: 'next_procedure_48h' })
      .first();
    if (existing) return existing;

    const scheduledAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const [row] = await db('reminders')
      .insert({
        user_id: userId,
        procedure_id: procedureId,
        related_session_id: relatedSessionId,
        reminder_type: 'next_procedure_48h',
        scheduled_at: scheduledAt,
        reminder_count: 0,
        reminder_status: 'scheduled',
      })
      .returning('*');
    return row;
  } catch (err) {
    console.error('[db] createReminder:', err.message);
    return null;
  }
}

async function getReminderById(id) {
  try {
    return await db('reminders').where({ id }).first() ?? null;
  } catch (err) {
    console.error('[db] getReminderById:', err.message);
    return null;
  }
}

async function getDueReminders() {
  try {
    return await db('reminders')
      .where({ reminder_status: 'scheduled' })
      .where('scheduled_at', '<=', db.fn.now())
      .select('*');
  } catch (err) {
    console.error('[db] getDueReminders:', err.message);
    return [];
  }
}

async function getSentRemindersForReschedule() {
  try {
    return await db('reminders')
      .where({ reminder_status: 'sent' })
      .whereNull('user_response')
      .whereRaw("sent_at + interval '24 hours' <= now()")
      .select('*');
  } catch (err) {
    console.error('[db] getSentRemindersForReschedule:', err.message);
    return [];
  }
}

async function markReminderSent(id) {
  try {
    await db('reminders')
      .where({ id })
      .update({
        sent_at: db.fn.now(),
        reminder_count: db.raw('reminder_count + 1'),
        reminder_status: 'sent',
      });
  } catch (err) {
    console.error('[db] markReminderSent:', err.message);
  }
}

async function cancelReminder(id) {
  try {
    await db('reminders').where({ id }).update({ reminder_status: 'cancelled' });
  } catch (err) {
    console.error('[db] cancelReminder:', err.message);
  }
}

async function rescheduleReminder(id, sentAt) {
  try {
    const nextScheduledAt = new Date(new Date(sentAt).getTime() + 24 * 60 * 60 * 1000);
    await db('reminders').where({ id }).update({
      scheduled_at: nextScheduledAt,
      reminder_status: 'scheduled',
    });
  } catch (err) {
    console.error('[db] rescheduleReminder:', err.message);
  }
}

async function expireReminder(id) {
  try {
    await db('reminders').where({ id }).update({ reminder_status: 'expired' });
  } catch (err) {
    console.error('[db] expireReminder:', err.message);
  }
}

async function setReminderUserResponse(id, response) {
  try {
    await db('reminders').where({ id }).update({
      user_response: response,
      reminder_status: 'completed',
    });
  } catch (err) {
    console.error('[db] setReminderUserResponse:', err.message);
  }
}

module.exports = {
  createReminder,
  getReminderById,
  getDueReminders,
  getSentRemindersForReschedule,
  markReminderSent,
  cancelReminder,
  rescheduleReminder,
  expireReminder,
  setReminderUserResponse,
};
