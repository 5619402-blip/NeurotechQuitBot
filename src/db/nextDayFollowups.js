const db = require('./connection');

async function createNextDayFollowup(userId, sessionId) {
  try {
    const existing = await db('next_day_followups')
      .where({ procedure_session_id: sessionId })
      .first();
    if (existing) return existing;

    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const [row] = await db('next_day_followups')
      .insert({
        user_id: userId,
        procedure_session_id: sessionId,
        scheduled_at: scheduledAt,
        followup_status: 'scheduled',
      })
      .returning('*');
    return row;
  } catch (err) {
    console.error('[db] createNextDayFollowup:', err.message);
    return null;
  }
}

async function getNextDayFollowupById(id) {
  try {
    return await db('next_day_followups').where({ id }).first() ?? null;
  } catch (err) {
    console.error('[db] getNextDayFollowupById:', err.message);
    return null;
  }
}

async function getDueNextDayFollowups() {
  try {
    // scheduled_at хранится как ms-число; CURRENT_TIMESTAMP (строка) сравнивался бы неверно
    return await db('next_day_followups')
      .where({ followup_status: 'scheduled' })
      .where('scheduled_at', '<=', Date.now())
      .select('*');
  } catch (err) {
    console.error('[db] getDueNextDayFollowups:', err.message);
    return [];
  }
}

async function markNextDayFollowupSent(id) {
  try {
    await db('next_day_followups')
      .where({ id })
      .update({ followup_status: 'sent', sent_at: db.fn.now() });
  } catch (err) {
    console.error('[db] markNextDayFollowupSent:', err.message);
  }
}

async function saveNextDayFollowupAnswer(id, field, value) {
  try {
    await db('next_day_followups').where({ id }).update({ [field]: value });
  } catch (err) {
    console.error('[db] saveNextDayFollowupAnswer:', err.message);
  }
}

async function markNextDayFollowupCompleted(id, wantsToContinue) {
  try {
    await db('next_day_followups')
      .where({ id })
      .update({ followup_status: 'completed', wants_to_continue: wantsToContinue });
  } catch (err) {
    console.error('[db] markNextDayFollowupCompleted:', err.message);
  }
}

async function cancelNextDayFollowup(id) {
  try {
    await db('next_day_followups').where({ id }).update({ followup_status: 'cancelled' });
  } catch (err) {
    console.error('[db] cancelNextDayFollowup:', err.message);
  }
}

module.exports = {
  createNextDayFollowup,
  getNextDayFollowupById,
  getDueNextDayFollowups,
  markNextDayFollowupSent,
  saveNextDayFollowupAnswer,
  markNextDayFollowupCompleted,
  cancelNextDayFollowup,
};
