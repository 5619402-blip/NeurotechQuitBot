const db = require('./connection');

async function upsertPostProcedureAnswer(userId, sessionId, key, value) {
  try {
    const existing = await db('post_procedure_answers')
      .where({ user_id: userId, procedure_session_id: sessionId })
      .first();

    if (existing) {
      await db.raw(
        `UPDATE post_procedure_answers
         SET answers_json = COALESCE(answers_json, '{}'::jsonb) || ?::jsonb
         WHERE user_id = ? AND procedure_session_id = ?`,
        [JSON.stringify({ [key]: value }), userId, sessionId]
      );
    } else {
      await db('post_procedure_answers').insert({
        user_id: userId,
        procedure_session_id: sessionId,
        answers_json: JSON.stringify({ [key]: value }),
      });
    }
  } catch (err) {
    console.error('[db] upsertPostProcedureAnswer:', err.message);
  }
}

async function getPostProcedureAnswers(userId, sessionId) {
  try {
    const row = await db('post_procedure_answers')
      .where({ user_id: userId, procedure_session_id: sessionId })
      .first();
    return row?.answers_json ?? {};
  } catch (err) {
    console.error('[db] getPostProcedureAnswers:', err.message);
    return {};
  }
}

module.exports = { upsertPostProcedureAnswer, getPostProcedureAnswers };
