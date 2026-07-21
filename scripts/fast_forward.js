// УНИВЕРСАЛЬНОЕ ускорение таймера по telegram_id.
// Сдвигает completed_at последней засчитанной процедуры на 72 часа назад
// и обнуляет next_procedure_unlocks_at в protocol_progress —
// следующая процедура становится доступна немедленно.
//
// Ничего не удаляет. Не трогает: users row, payments, access_rights,
// diagnostics, draft_answers, player_tokens, user_consents, reminders,
// followups, gift_access_tokens.
//
// Запуск:
//   node scripts/fast_forward.js <telegram_id> --confirm
//
// Пример:
//   node scripts/fast_forward.js 312561696 --confirm
require('dotenv').config();
const db = require('../src/db/connection');

function printUsage() {
  console.log('');
  console.log('  Использование:');
  console.log('');
  console.log('    node scripts/fast_forward.js <telegram_id> --confirm');
  console.log('');
  console.log('  Что делает:');
  console.log('  — находит последнюю засчитанную завершённую процедуру пользователя');
  console.log('  — сдвигает её completed_at на 72 часа назад от текущего времени');
  console.log('  — обнуляет next_procedure_unlocks_at в protocol_progress');
  console.log('  — следующая процедура становится доступна немедленно');
  console.log('');
}

async function run() {
  const args = process.argv.slice(2);
  const telegramId = args.find(a => /^\d+$/.test(a));
  const confirmed = args.includes('--confirm');

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

  // 1. Найти пользователя
  const user = await db('users').where({ telegram_id: telegramId }).first();
  if (!user?.id) {
    console.log('[fast-forward] Пользователь ' + telegramId + ' не найден. Остановлено.');
    return;
  }
  console.log('[fast-forward] user.id=' + user.id + ' | telegram_id=' + user.telegram_id);

  // 2. Найти последнюю засчитанную завершённую процедуру
  const lastSession = await db('procedure_sessions as ps')
    .join('procedures as p', 'p.id', 'ps.procedure_id')
    .where('ps.user_id', user.id)
    .where('ps.session_status', 'completed')
    .where('ps.is_counted_as_completed', true)
    .select('ps.id', 'ps.completed_at', 'p.procedure_type')
    .orderBy('ps.completed_at', 'desc')
    .first();

  if (!lastSession) {
    console.log('[fast-forward] Нет завершённых засчитанных процедур. Остановлено.');
    return;
  }

  // 3. protocol_progress для отчёта и обновления
  const progress = await db('protocol_progress').where({ user_id: user.id }).first();

  // 4. Новое время: 72 часа назад
  const newCompletedAt = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  console.log('\n─── ДО ───────────────────────────────────────────');
  console.log('  session_id:               ', lastSession.id);
  console.log('  procedure_type:           ', lastSession.procedure_type);
  console.log('  completed_at (старый):    ', lastSession.completed_at);
  console.log('  next_procedure_type:      ', progress?.next_procedure_type ?? '(нет записи)');
  console.log('  next_procedure_unlocks_at:', progress?.next_procedure_unlocks_at ?? 'null');

  // 5. Транзакция
  await db.transaction(async (trx) => {
    await trx('procedure_sessions')
      .where({ id: lastSession.id })
      .update({ completed_at: newCompletedAt });

    if (progress) {
      await trx('protocol_progress')
        .where({ user_id: user.id })
        .update({ next_procedure_unlocks_at: null, updated_at: nowIso });
    }
  });

  console.log('\n─── ПОСЛЕ ────────────────────────────────────────');
  console.log('  completed_at (новый):     ', newCompletedAt);
  console.log('  next_procedure_unlocks_at:', 'null → процедура разблокирована немедленно');
  console.log('\n[fast-forward] Готово. Можно открывать бот — следующая процедура доступна.');
}

run()
  .catch(err => console.error('[fast-forward] Ошибка:', err.message))
  .finally(() => db.destroy());
