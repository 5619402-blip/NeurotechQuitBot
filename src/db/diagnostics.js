const db = require('./connection');

const SCREEN_ID = 'diagnostic';

async function saveDraftAnswer(telegramId, field, value) {
  try {
    const user = await db('users').where({ telegram_id: telegramId }).select('id').first();
    if (!user) return;
    await db.raw(
      `INSERT INTO draft_answers (user_id, screen_id, answers_json, updated_at)
       VALUES (?, ?, jsonb_build_object(?::text, ?::text), NOW())
       ON CONFLICT (user_id, screen_id) DO UPDATE SET
         answers_json = draft_answers.answers_json || jsonb_build_object(?::text, ?::text),
         updated_at = NOW()`,
      [user.id, SCREEN_ID, field, String(value), field, String(value)]
    );
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
      .select(db.raw(`answers_json->>? AS val`, [field]))
      .first();
    return row?.val ?? null;
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
    return row?.answers_json ?? null;
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
