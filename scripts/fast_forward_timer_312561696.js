// ТЕСТОВЫЙ СКРИПТ — только для пользователя 312561696.
// Сдвигает completed_at последней засчитанной процедуры на 72 часа назад
// и обнуляет next_procedure_unlocks_at в protocol_progress.
// Работает после любой из 5 процедур протокола.
//
// Не трогает: users row, payments, access_rights, diagnostics, draft_answers,
// player_tokens, user_consents, reminders, followups, gift_access_tokens.
//
// Запуск: node scripts/fast_forward_timer_312561696.js --confirm-fast-forward-312561696
require('dotenv').config();
const db = require('../src/db/connection');

const TELEGRAM_ID = '312561696';
const CONFIRM_FLAG = '--confirm-fast-forward-312561696';

async function run() {
  if (!process.argv.includes(CONFIRM_FLAG)) {
    console.log('');
    console.log('  Скрипт не запущен.');
    console.log('  Для ускорения таймера передайте флаг подтверждения:');
    console.log('');
    console.log('    node scripts/fast_forward_timer_312561696.js --confirm-fast-forward-312561696');
    console.log('');
    console.log('  Что делает:');
    console.log('  — находит последнюю засчитанную завершённую процедуру пользователя 312561696');
    console.log('  — сдвигает её completed_at на 72 часа назад от текущего времени');
    console.log('  — обнуляет next_procedure_unlocks_at в protocol_progress');
    console.log('  — следующая процедура становится доступна немедленно');
    console.log('');
    console.log('  Ничего не удаляет. Работает строго для telegram_id=312561696.');
    return;
  }

  // 1. Найти пользователя
  const user = await db('users').where({ telegram_id: TELEGRAM_ID }).first();
  if (!user?.id) {
    console.log('[fast-forward] Пользователь ' + TELEGRAM_ID + ' не найден. Остановлено.');
    return;
  }
  console.log('[fast-forward] user.id=' + user.id + ' | telegram_id=' + user.telegram_id);

  // 2. Найти последнюю засчитанную завершённую процедуру
  const lastSession = await db('procedure_sessions as ps')
    .join('procedures as p', 'p.id', 'ps.procedure_id')
    .where('ps.user_id', user.id)
    .where('ps.session_status', 'completed')
    .where('ps.is_counted_as_completed', 1)
    .select(
      'ps.id',
      'ps.completed_at',
      'p.procedure_type'
    )
    .orderBy('ps.completed_at', 'desc')
    .first();

  if (!lastSession) {
    console.log('[fast-forward] Нет завершённых засчитанных процедур. Остановлено.');
    return;
  }

  // 3. Получить protocol_progress для отчёта и обновления
  const progress = await db('protocol_progress').where({ user_id: user.id }).first();

  // 4. Новое время: 72 часа назад от сейчас
  const newCompletedAt = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();
  const nowIso = new Date().toISOString();

  // Отчёт ДО
  console.log('\n─── ДО ───────────────────────────────────────────');
  console.log('  user.id:                  ', user.id);
  console.log('  telegram_id:              ', user.telegram_id);
  console.log('  session_id:               ', lastSession.id);
  console.log('  procedure_type:           ', lastSession.procedure_type);
  console.log('  completed_at (старый):    ', lastSession.completed_at);
  console.log('  next_procedure_type:      ', progress?.next_procedure_type ?? '(нет записи)');
  console.log('  next_procedure_unlocks_at:', progress?.next_procedure_unlocks_at ?? 'null');

  // 5. Транзакция
  await db.transaction(async (trx) => {
    // Сдвинуть completed_at на 72 часа назад
    await trx('procedure_sessions')
      .where({ id: lastSession.id })
      .update({ completed_at: newCompletedAt });

    // Обнулить next_procedure_unlocks_at и обновить updated_at в protocol_progress
    if (progress) {
      await trx('protocol_progress')
        .where({ user_id: user.id })
        .update({
          next_procedure_unlocks_at: null,
          updated_at: nowIso,
        });
    }
  });

  // Отчёт ПОСЛЕ
  console.log('\n─── ПОСЛЕ ────────────────────────────────────────');
  console.log('  user.id:                  ', user.id);
  console.log('  telegram_id:              ', user.telegram_id);
  console.log('  session_id:               ', lastSession.id);
  console.log('  procedure_type:           ', lastSession.procedure_type);
  console.log('  completed_at (новый):     ', newCompletedAt);
  console.log('  next_procedure_type:      ', progress?.next_procedure_type ?? '(нет записи)');
  console.log('  next_procedure_unlocks_at:', 'null → процедура разблокирована немедленно');
  console.log('\n[fast-forward] Готово. Можно открывать бот — следующая процедура доступна.');
}

run()
  .catch((err) => console.error('[fast-forward] Ошибка:', err.message))
  .finally(() => db.destroy());
