// УНИВЕРСАЛЬНЫЙ сброс пользователя по telegram_id.
//
// Полный сброс (удаляет запись users):
//   node scripts/reset_user.js <telegram_id> --confirm
//
// Мягкий сброс (запись users остаётся, поля сбрасываются до нового пользователя —
// как reset_admin; admin_preview_tokens и gift_access_tokens не трогаются):
//   node scripts/reset_user.js <telegram_id> --confirm --keep-user
//
// Примеры:
//   node scripts/reset_user.js 312561696 --confirm
//   node scripts/reset_user.js 7185030567 --confirm --keep-user
require('dotenv').config();
const db = require('../src/db/connection');

// Порядок важен: сначала таблицы, ссылающиеся на procedure_sessions
const TABLES = [
  'player_tokens',           // FK → procedure_sessions
  'post_procedure_answers',  // FK → procedure_sessions
  'procedure_sessions',      // FK → users
  'protocol_progress',
  'access_rights',           // FK → payments — удаляем до payments
  'payments',
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

function printUsage() {
  console.log('');
  console.log('  Использование:');
  console.log('');
  console.log('    node scripts/reset_user.js <telegram_id> --confirm              полный сброс (users удаляется)');
  console.log('    node scripts/reset_user.js <telegram_id> --confirm --keep-user  мягкий сброс (users остаётся, статус new)');
  console.log('');
  console.log('  Внимание: операция необратима.');
  console.log('');
}

async function run() {
  const args = process.argv.slice(2);
  const telegramId = args.find(a => /^\d+$/.test(a));
  const confirmed = args.includes('--confirm');
  const keepUser = args.includes('--keep-user');

  if (!telegramId) {
    console.log('\n  Не указан telegram_id.');
    printUsage();
    return;
  }
  if (!confirmed) {
    console.log('\n  Нет флага --confirm. Ничего не сделано.');
    printUsage();
    return;
  }

  const user = await db('users').where({ telegram_id: telegramId }).first();
  if (!user) {
    console.log('[reset] Пользователь ' + telegramId + ' не найден. Ничего не удалено.');
    return;
  }

  const uid = user.id;
  console.log('[reset] Найден: telegram_id=' + telegramId + ' users.id=' + uid +
    ' | режим: ' + (keepUser ? 'мягкий (--keep-user)' : 'полный'));
  console.log('[reset] Запуск транзакции...');

  const counts = {};

  await db.transaction(async (trx) => {
    if (!keepUser) {
      // gift_access_tokens — не удалять, только вернуть ссылку в active
      counts['gift_access_tokens (nulled)'] = await trx('gift_access_tokens')
        .where({ activated_by_user_id: uid })
        .update({ activated_by_user_id: null, status: 'active' });
    }

    for (const table of TABLES) {
      counts[table] = await trx(table).where({ user_id: uid }).del();
    }

    if (keepUser) {
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
    } else {
      counts['users (deleted)'] = await trx('users').where({ id: uid }).del();
    }
  });

  console.log('[reset] Транзакция завершена успешно.\n');
  console.log('  Удалено / обновлено по таблицам:');
  for (const [t, c] of Object.entries(counts)) {
    console.log('  ' + String(t).padEnd(42) + c);
  }
  console.log('\n[reset] Пользователь ' + telegramId + ' сброшен (' +
    (keepUser ? 'мягко, users.id=' + uid + ' сохранён' : 'полностью') + ').');
}

run()
  .catch(e => console.error('[reset] ERROR:', e.message))
  .finally(() => db.destroy());
