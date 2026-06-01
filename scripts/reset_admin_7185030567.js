// RESET пользовательского состояния админа 7185030567.
// Запуск только с флагом: node scripts/reset_admin_7185030567.js --confirm-reset-admin-7185030567
//
// Что делает: удаляет пользовательские данные и сбрасывает поля users до 'new'.
// Что НЕ трогает: users row, users.id, telegram_id, admin_preview_tokens, gift_access_tokens, ADMIN_TELEGRAM_IDS.
require('dotenv').config();
const db = require('../src/db/connection');

const TELEGRAM_ID = '7185030567';
const CONFIRM_FLAG = '--confirm-reset-admin-7185030567';

// Порядок важен: сначала таблицы, ссылающиеся на procedure_sessions
const TABLES = [
  'player_tokens',           // FK → procedure_sessions (CASCADE)
  'post_procedure_answers',  // FK → procedure_sessions (CASCADE)
  'procedure_sessions',      // FK → users (RESTRICT)
  'protocol_progress',
  'access_rights',           // FK → payments (SET NULL) — удаляем до payments
  'payments',                // FK → users (RESTRICT)
  'diagnostics',
  'draft_answers',
  'user_consents',
  'reminders',
  'next_day_followups',
  'seven_day_followups',
  'user_reviews',
  'support_requests',
  'events',
];

async function run() {
  if (!process.argv.includes(CONFIRM_FLAG)) {
    console.log('');
    console.log('  Скрипт не запущен.');
    console.log('  Для сброса передайте флаг подтверждения:');
    console.log('');
    console.log('    node scripts/reset_admin_7185030567.js --confirm-reset-admin-7185030567');
    console.log('');
    console.log('  Внимание: операция необратима.');
    console.log('  Пользовательские данные 7185030567 будут удалены.');
    console.log('  users row, admin_preview_tokens и gift_access_tokens НЕ затрагиваются.');
    return;
  }

  const user = await db('users').where({ telegram_id: TELEGRAM_ID }).first();
  if (!user) {
    console.log('[reset] Пользователь ' + TELEGRAM_ID + ' не найден. Ничего не изменено.');
    return;
  }

  const uid = user.id;
  console.log('[reset] Найден: telegram_id=' + TELEGRAM_ID + ' users.id=' + uid);
  console.log('[reset] Запуск транзакции...');

  const counts = {};

  await db.transaction(async (trx) => {
    // Удалить пользовательские связанные записи
    for (const table of TABLES) {
      const count = await trx(table).where({ user_id: uid }).del();
      counts[table] = count;
    }

    // Сбросить поля users до состояния нового пользователя (row не удаляется)
    counts['users (updated)'] = await trx('users').where({ id: uid }).update({
      user_status: 'new',
      access_type: 'none',
      access_status: 'inactive',
      current_screen: null,
      rules_video_watched_at: null,
      has_active_unfinished_procedure: false,
      completed_procedures_count: 0,
      next_procedure_id: null,
      pause_reason: null,
      paused_at: null,
    });
  });

  console.log('[reset] Транзакция завершена успешно.\n');
  console.log('  Удалено / обновлено по таблицам:');
  for (const [t, c] of Object.entries(counts)) {
    console.log('  ' + String(t).padEnd(42) + c);
  }
  console.log('\n[reset] Пользователь ' + TELEGRAM_ID + ' сброшен до состояния нового.');
  console.log('[reset] users.id=' + uid + ' сохранён. admin_preview_tokens и gift_access_tokens не тронуты.');
}

run().catch(e => console.error('[reset] ERROR:', e.message)).finally(() => db.destroy());
