// RESET тестового пользователя 312561696.
// Запуск только с флагом: node scripts/reset_user_312561696.js --confirm-reset-312561696
require('dotenv').config();
const db = require('../src/db/connection');

const TELEGRAM_ID = '312561696';
const CONFIRM_FLAG = '--confirm-reset-312561696';

const TABLES = [
  'user_consents',
  'access_rights',
  'payments',
  'player_tokens',
  'post_procedure_answers',
  'procedure_sessions',
  'protocol_progress',
  'draft_answers',
  'diagnostics',
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
    console.log('    node scripts/reset_user_312561696.js --confirm-reset-312561696');
    console.log('');
    console.log('  Внимание: операция необратима. Все данные пользователя 312561696 будут удалены.');
    return;
  }

  const user = await db('users').where({ telegram_id: TELEGRAM_ID }).first();
  if (!user) {
    console.log('[reset] Пользователь ' + TELEGRAM_ID + ' не найден. Ничего не удалено.');
    return;
  }

  const uid = user.id;
  console.log('[reset] Найден: telegram_id=' + TELEGRAM_ID + ' users.id=' + uid);
  console.log('[reset] Запуск транзакции...');

  const counts = {};

  await db.transaction(async (trx) => {
    // gift_access_tokens — не удалять, только обнулить ссылку
    const giftCount = await trx('gift_access_tokens')
      .where({ activated_by_user_id: uid })
      .update({ activated_by_user_id: null, status: 'active' });
    counts['gift_access_tokens (nulled)'] = giftCount;

    // удалить связанные записи
    for (const table of TABLES) {
      const count = await trx(table).where({ user_id: uid }).del();
      counts[table] = count;
    }

    // удалить пользователя последним
    const userCount = await trx('users').where({ id: uid }).del();
    counts['users'] = userCount;
  });

  console.log('[reset] Транзакция завершена успешно.\n');
  console.log('  Удалено / обновлено по таблицам:');
  for (const [t, c] of Object.entries(counts)) {
    console.log('  ' + String(t).padEnd(42) + c);
  }
  console.log('\n[reset] Пользователь ' + TELEGRAM_ID + ' полностью сброшен.');
}

run().catch(e => console.error('[reset] ERROR:', e.message)).finally(() => db.destroy());
