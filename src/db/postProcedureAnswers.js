const db = require('./connection');

function parseAnswersJson(raw) {
  if (!raw) return {};
  if (typeof raw === 'string') return JSON.parse(raw);
  return raw;
}

async function upsertPostProcedureAnswer(userId, sessionId, key, value) {
  try {
    const existing = await db('post_procedure_answers')
      .where({ user_id: userId, procedure_session_id: sessionId })
      .first();

    if (existing) {
      const prev = parseAnswersJson(existing.answers_json);
      await db('post_procedure_answers')
        .where({ user_id: userId, procedure_session_id: sessionId })
        .update({ answers_json: JSON.stringify({ ...prev, [key]: value }) });
    } else {
      await db('post_procedure_answers').insert({
        user_id: userId,
        procedure_session_id: sessionId,
        answers_json: JSON.stringify({ [key]: value }),
      });
    }
  } catch (err) {
    console.error('[db] savePostProcedureAnswer failed (userId=%s, sessionId=%s, key=%s):', userId, sessionId, key, err.message);
  }
}

async function getPostProcedureAnswers(userId, sessionId) {
  try {
    const row = await db('post_procedure_answers')
      .where({ user_id: userId, procedure_session_id: sessionId })
      .first();
    return parseAnswersJson(row?.answers_json);
  } catch (err) {
    console.error('[db] getPostProcedureAnswers:', err.message);
    return {};
  }
}

module.exports = { upsertPostProcedureAnswer, getPostProcedureAnswers };
