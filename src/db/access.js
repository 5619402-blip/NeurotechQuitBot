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

const PROTOCOL_STEPS = {
  0: 'anti_tobacco',
  1: 'quick_lever',
  2: 'anti_tobacco',
  3: 'short_quick_lever',
  4: 'short_anti_tobacco',
};

function getNextProcedureType(step) {
  return PROTOCOL_STEPS[step] ?? 'anti_tobacco';
}

async function upsertProtocolProgress(userId, completedType, currentStepNumber) {
  try {
    const newStep = currentStepNumber + 1;
    const newNextType = getNextProcedureType(newStep);
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
  getNextProcedureType,
};
