const db = require('./connection');

async function getProcedureByType(procedureType) {
  try {
    const row = await db('procedures').where({ procedure_type: procedureType }).first();
    return row ?? null;
  } catch (err) {
    console.error('[db] getProcedureByType:', err.message);
    return null;
  }
}

async function getProcedureById(procedureId) {
  try {
    const row = await db('procedures').where({ id: procedureId }).first();
    return row ?? null;
  } catch (err) {
    console.error('[db] getProcedureById:', err.message);
    return null;
  }
}

async function createSession(userId, procedureId, procedureNumber) {
  try {
    const [session] = await db('procedure_sessions')
      .insert({
        user_id: userId,
        procedure_id: procedureId,
        procedure_number: procedureNumber,
        session_status: 'started',
        started_at: db.fn.now(),
        is_counted_as_completed: false,
      })
      .returning('*');
    return session;
  } catch (err) {
    console.error('[db] createSession:', err.message);
    return null;
  }
}

async function getSessionById(sessionId) {
  try {
    const row = await db('procedure_sessions').where({ id: sessionId }).first();
    return row ?? null;
  } catch (err) {
    console.error('[db] getSessionById:', err.message);
    return null;
  }
}

async function completeSession(sessionId) {
  try {
    await db('procedure_sessions').where({ id: sessionId }).update({
      session_status: 'completed',
      completed_at: db.fn.now(),
      is_counted_as_completed: true,
    });
  } catch (err) {
    console.error('[db] completeSession:', err.message);
  }
}

async function interruptSession(sessionId) {
  try {
    await db('procedure_sessions').where({ id: sessionId }).update({
      session_status: 'interrupted',
      interrupted_at: db.fn.now(),
      is_counted_as_completed: false,
    });
  } catch (err) {
    console.error('[db] interruptSession:', err.message);
  }
}

async function getStartedSessionForUser(userId) {
  try {
    const row = await db('procedure_sessions')
      .where({ user_id: userId, session_status: 'started' })
      .orderBy('started_at', 'desc')
      .first();
    return row ?? null;
  } catch (err) {
    console.error('[db] getStartedSessionForUser:', err.message);
    return null;
  }
}

async function hasCompletedSessionForProcedure(userId, procedureId, afterSessionId) {
  try {
    let query = db('procedure_sessions')
      .where({ user_id: userId, procedure_id: procedureId, session_status: 'completed' });
    if (afterSessionId) {
      query = query.where('id', '>', afterSessionId);
    }
    const row = await query.first();
    return !!row;
  } catch (err) {
    console.error('[db] hasCompletedSessionForProcedure:', err.message);
    return false;
  }
}

// Все начатые сессии — для крона брошенных процедур
async function getAllStartedSessions() {
  try {
    return await db('procedure_sessions')
      .where({ session_status: 'started' })
      .select('id', 'user_id', 'procedure_id', 'started_at');
  } catch (err) {
    console.error('[db] getAllStartedSessions:', err.message);
    return [];
  }
}

// Длительность активного аудио процедуры (секунды) или null
async function getAudioDurationSeconds(procedureId) {
  try {
    const row = await db('audio_files')
      .where({ procedure_id: procedureId, is_active: true })
      .select('duration_seconds')
      .first();
    return row?.duration_seconds ?? null;
  } catch (err) {
    console.error('[db] getAudioDurationSeconds:', err.message);
    return null;
  }
}

// Пометить сессию брошенной (ТЗ: started без callback дольше duration+30мин).
// Атомарно: только если всё ещё 'started'.
async function abandonSession(id) {
  try {
    const updated = await db('procedure_sessions')
      .where({ id, session_status: 'started' })
      .update({
        session_status: 'abandoned',
        is_counted_as_completed: false,
        exit_reason: 'timeout',
      });
    return updated > 0;
  } catch (err) {
    console.error('[db] abandonSession:', err.message);
    return false;
  }
}

module.exports = {
  getProcedureByType,
  getProcedureById,
  createSession,
  getSessionById,
  completeSession,
  interruptSession,
  getStartedSessionForUser,
  hasCompletedSessionForProcedure,
  getAllStartedSessions,
  getAudioDurationSeconds,
  abandonSession,
};
