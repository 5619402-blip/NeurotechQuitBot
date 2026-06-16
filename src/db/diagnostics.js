const db = require('./connection');

const SCREEN_ID = 'diagnostic';

async function saveDraftAnswer(telegramId, field, value) {
  try {
    const user = await db('users').where({ telegram_id: telegramId }).select('id').first();
    if (!user) return;
    const existing = await db('draft_answers')
      .where({ user_id: user.id, screen_id: SCREEN_ID })
      .select('answers_json')
      .first();
    const raw = existing?.answers_json;
    const current = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {};
    const updated = JSON.stringify({ ...current, [field]: String(value) });
    await db('draft_answers')
      .insert({
        user_id: user.id,
        screen_id: SCREEN_ID,
        answers_json: updated,
        updated_at: new Date().toISOString(),
      })
      .onConflict(['user_id', 'screen_id'])
      .merge({ answers_json: updated, updated_at: new Date().toISOString() });
    console.log(`[diag] draft: user=${telegramId} ${field}=${value}`);
  } catch (err) {
    console.error('[db] saveDraftAnswer:', err.message);
  }
}

async function getDraftAnswer(telegramId, field) {
  try {
    const user = await db('users').where({ telegram_id: telegramId }).select('id').first();
    if (!user) return null;
    const row = await db('draft_answers')
      .where({ user_id: user.id, screen_id: SCREEN_ID })
      .select('answers_json')
      .first();
    if (!row?.answers_json) return null;
    const parsed = typeof row.answers_json === 'string'
      ? JSON.parse(row.answers_json)
      : row.answers_json;
    return parsed[field] ?? null;
  } catch (err) {
    console.error('[db] getDraftAnswer:', err.message);
    return null;
  }
}

async function getAllDraftAnswers(telegramId) {
  try {
    const user = await db('users').where({ telegram_id: telegramId }).select('id').first();
    if (!user) return null;
    const row = await db('draft_answers')
      .where({ user_id: user.id, screen_id: SCREEN_ID })
      .select('answers_json')
      .first();
    if (!row?.answers_json) return null;
    const raw = row.answers_json;
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (err) {
    console.error('[db] getAllDraftAnswers:', err.message);
    return null;
  }
}

async function createDiagnosticRecord(userId, userName, answers) {
  try {
    const motivRaw = answers.motivation_level;
    const motivLevel = motivRaw != null ? parseInt(motivRaw, 10) : null;
    // tried_to_quit_before: выводится из quit_attempts — 'none' означает не пробовал
    const triedBefore = answers.quit_attempts != null
      ? answers.quit_attempts !== 'none'
      : null;
    await db('diagnostics').insert({
      user_id: userId,
      user_name: userName || null,
      age_group: null,
      nicotine_type: null,
      smoking_years_group: answers.smoking_duration ?? null,
      tried_to_quit_before: triedBefore,
      quit_attempts_count: answers.quit_attempts ?? null,
      longest_quit_period: answers.max_quit_duration ?? null,
      motivation_level: (motivLevel != null && !isNaN(motivLevel)) ? motivLevel : null,
      motivation_source: answers.motivation_source ?? null,
      diagnostic_status: 'completed',
      completed_at: db.fn.now(),
    });
  } catch (err) {
    console.error('[db] createDiagnosticRecord:', err.message);
  }
}

module.exports = { saveDraftAnswer, getDraftAnswer, getAllDraftAnswers, createDiagnosticRecord };
