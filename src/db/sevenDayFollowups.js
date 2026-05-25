const db = require('./connection');

async function createSevenDayFollowup(userId) {
  try {
    const existing = await db('seven_day_followups')
      .where({ user_id: userId })
      .whereNull('sent_at')
      .first();
    if (existing) return existing;

    const scheduledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const [row] = await db('seven_day_followups')
      .insert({
        user_id: userId,
        trigger_source: 'after_procedure_not_smoking',
        scheduled_at: scheduledAt,
        followup_status: 'scheduled',
      })
      .returning('*');
    return row;
  } catch (err) {
    console.error('[db] createSevenDayFollowup:', err.message);
    return null;
  }
}

async function getSevenDayFollowupById(id) {
  try {
    return await db('seven_day_followups').where({ id }).first() ?? null;
  } catch (err) {
    console.error('[db] getSevenDayFollowupById:', err.message);
    return null;
  }
}

async function getDueSevenDayFollowups() {
  try {
    return await db('seven_day_followups')
      .where({ followup_status: 'scheduled' })
      .where('scheduled_at', '<=', db.fn.now())
      .select('*');
  } catch (err) {
    console.error('[db] getDueSevenDayFollowups:', err.message);
    return [];
  }
}

async function markSevenDayFollowupSent(id) {
  try {
    await db('seven_day_followups')
      .where({ id })
      .update({ followup_status: 'sent', sent_at: db.fn.now() });
  } catch (err) {
    console.error('[db] markSevenDayFollowupSent:', err.message);
  }
}

async function saveSevenDayFollowupAnswer(id, field, value) {
  try {
    await db('seven_day_followups').where({ id }).update({ [field]: value });
  } catch (err) {
    console.error('[db] saveSevenDayFollowupAnswer:', err.message);
  }
}

async function markSevenDayFollowupCompleted(id, resultStatus) {
  try {
    await db('seven_day_followups')
      .where({ id })
      .update({ followup_status: 'completed', result_status: resultStatus });
  } catch (err) {
    console.error('[db] markSevenDayFollowupCompleted:', err.message);
  }
}

async function cancelSevenDayFollowup(id) {
  try {
    await db('seven_day_followups').where({ id }).update({ followup_status: 'cancelled' });
  } catch (err) {
    console.error('[db] cancelSevenDayFollowup:', err.message);
  }
}

module.exports = {
  createSevenDayFollowup,
  getSevenDayFollowupById,
  getDueSevenDayFollowups,
  markSevenDayFollowupSent,
  saveSevenDayFollowupAnswer,
  markSevenDayFollowupCompleted,
  cancelSevenDayFollowup,
};
