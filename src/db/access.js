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

const STEP_INTERVALS_AFTER_MS = {
  0: 24 * 60 * 60 * 1000,
  1: 48 * 60 * 60 * 1000,
  2: 48 * 60 * 60 * 1000,
  3: 48 * 60 * 60 * 1000,
  4: null,
};

function getStepIntervalAfterMs(completedStep) {
  const interval = STEP_INTERVALS_AFTER_MS[completedStep];
  return (interval === undefined) ? null : interval;
}

async function setMainProtocolCompleted(userId) {
  try {
    await db('protocol_progress')
      .where({ user_id: userId })
      .update({ main_protocol_completed: true, updated_at: db.fn.now() });
  } catch (err) {
    console.error('[db] setMainProtocolCompleted:', err.message);
  }
}

async function upsertProtocolProgress(userId, completedType, currentStepNumber, unlockAt = null) {
  try {
    const newStep = currentStepNumber + 1;
    const newNextType = getNextProcedureType(newStep);
    const row = {
      user_id: userId,
      current_step_number: newStep,
      next_procedure_type: newNextType,
      last_completed_procedure_type: completedType,
      next_procedure_unlocks_at: unlockAt,
      updated_at: db.fn.now(),
    };
    await db('protocol_progress')
      .insert(row)
      .onConflict('user_id')
      .merge({
        current_step_number: newStep,
        next_procedure_type: newNextType,
        last_completed_procedure_type: completedType,
        next_procedure_unlocks_at: unlockAt,
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
  setMainProtocolCompleted,
  getNextProcedureType,
  getStepIntervalAfterMs,
};
