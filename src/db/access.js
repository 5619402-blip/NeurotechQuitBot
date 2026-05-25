const db = require('./connection');

async function getAccessRights(userId) {
  try {
    const row = await db('access_rights').where({ user_id: userId }).first();
    return row ?? null;
  } catch (err) {
    console.error('[db] getAccessRights:', err.message);
    return null;
  }
}

async function getProtocolProgress(userId) {
  try {
    const row = await db('protocol_progress').where({ user_id: userId }).first();
    return row ?? null;
  } catch (err) {
    console.error('[db] getProtocolProgress:', err.message);
    return null;
  }
}

async function incrementUsedMain(userId) {
  try {
    await db('access_rights')
      .where({ user_id: userId })
      .increment('used_main_procedures_count', 1);
  } catch (err) {
    console.error('[db] incrementUsedMain:', err.message);
  }
}

async function incrementUsedAlpha(userId) {
  try {
    await db('access_rights')
      .where({ user_id: userId })
      .increment('used_alpha_sessions_count', 1);
  } catch (err) {
    console.error('[db] incrementUsedAlpha:', err.message);
  }
}

async function upsertProtocolProgress(userId, completedType, currentStepNumber) {
  try {
    const newStep = currentStepNumber + 1;
    const newNextType = newStep % 2 === 0 ? 'anti_tobacco' : 'quick_lever';
    await db('protocol_progress')
      .insert({
        user_id: userId,
        current_step_number: newStep,
        next_procedure_type: newNextType,
        last_completed_procedure_type: completedType,
        updated_at: db.fn.now(),
      })
      .onConflict('user_id')
      .merge({
        current_step_number: newStep,
        next_procedure_type: newNextType,
        last_completed_procedure_type: completedType,
        updated_at: db.fn.now(),
      });
  } catch (err) {
    console.error('[db] upsertProtocolProgress:', err.message);
  }
}

module.exports = {
  getAccessRights,
  getProtocolProgress,
  incrementUsedMain,
  incrementUsedAlpha,
  upsertProtocolProgress,
};
