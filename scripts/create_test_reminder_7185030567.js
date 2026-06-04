// ТЕСТОВЫЙ СКРИПТ — только для пользователя 7185030567.
// Делает два изменения в БД:
//   1. UPDATE protocol_progress SET next_procedure_unlocks_at = NOW()+2min
//   2. INSERT reminder (quick_lever, scheduled через 2 мин) или UPDATE existing scheduled/sent reminder
// Не трогает других пользователей. Не делает seed/reset/migration.

const db = require('../src/db/connection');

const TELEGRAM_ID = 7185030567;
const CONFIRM_FLAG = '--confirm-create-test-reminder-7185030567';

async function run() {
  if (!process.argv.includes(CONFIRM_FLAG)) {
    console.log('Скрипт не выполнен — требуется подтверждение.');
    console.log('Для создания тестового reminder запусти:');
    console.log('  node scripts/create_test_reminder_7185030567.js ' + CONFIRM_FLAG);
    return;
  }

  // 1. Найти пользователя
  const user = await db('users').where({ telegram_id: TELEGRAM_ID }).first();
  if (!user?.id) {
    console.error('Пользователь не найден. Остановлено.');
    return;
  }
  console.log('user.id:', user.id, '| telegram_id:', user.telegram_id);

  // 2. Проверить protocol_progress
  const progress = await db('protocol_progress').where({ user_id: user.id }).first();
  if (!progress) {
    console.error('protocol_progress не найден. Остановлено.');
    return;
  }
  if (progress.current_step_number !== 1 || progress.next_procedure_type !== 'quick_lever') {
    console.error(
      `Неожиданное состояние: step=${progress.current_step_number}, next=${progress.next_procedure_type}`
    );
    console.error('Ожидалось: step=1, next=quick_lever. Остановлено.');
    return;
  }

  // 3. Найти последнюю completed anti_tobacco сессию
  const lastSession = await db('procedure_sessions as ps')
    .join('procedures as p', 'p.id', 'ps.procedure_id')
    .where('ps.user_id', user.id)
    .where('ps.session_status', 'completed')
    .where('ps.is_counted_as_completed', 1)
    .where('p.procedure_type', 'anti_tobacco')
    .select('ps.id', 'ps.procedure_id', 'p.procedure_type')
    .orderBy('ps.id', 'desc')
    .first();

  if (!lastSession) {
    console.error('Последняя completed anti_tobacco сессия не найдена. Остановлено.');
    return;
  }
  console.log('lastSession.id:', lastSession.id, '| procedure_type:', lastSession.procedure_type);

  // 4. Найти процедуру quick_lever
  const quickLever = await db('procedures').where({ procedure_type: 'quick_lever' }).first();
  if (!quickLever) {
    console.error('Процедура quick_lever не найдена в таблице procedures. Остановлено.');
    return;
  }

  // 5. Вычислить testTime (+2 минуты)
  const testTime = new Date(Date.now() + 2 * 60 * 1000);
  console.log('testTime:', testTime.toISOString());

  // 6. Транзакция: обновить progress + upsert reminder
  let reminderId;
  let reminderAction;

  await db.transaction(async (trx) => {
    await trx('protocol_progress')
      .where({ user_id: user.id })
      .update({ next_procedure_unlocks_at: testTime, updated_at: trx.fn.now() });

    const existing = await trx('reminders')
      .where({ related_session_id: lastSession.id })
      .whereIn('reminder_status', ['scheduled', 'sent'])
      .first();

    if (existing) {
      await trx('reminders')
        .where({ id: existing.id })
        .update({ scheduled_at: testTime, reminder_status: 'scheduled', sent_at: null });
      reminderId = existing.id;
      reminderAction = 'updated (existing)';
    } else {
      await trx('reminders').insert({
        user_id: user.id,
        procedure_id: quickLever.id,
        related_session_id: lastSession.id,
        reminder_type: 'next_procedure_24h',
        scheduled_at: testTime,
        reminder_count: 0,
        reminder_status: 'scheduled',
      });
      const inserted = await trx('reminders')
        .where({ user_id: user.id, related_session_id: lastSession.id })
        .orderBy('id', 'desc')
        .first();
      reminderId = inserted.id;
      reminderAction = 'created (new)';
    }
  });

  // 7. Финальный отчёт
  console.log('\n=== ТЕСТ ГОТОВ ===');
  console.log('user_id:             ', user.id);
  console.log('session_id:          ', lastSession.id);
  console.log('next_procedure_type: ', progress.next_procedure_type);
  console.log('scheduled_at:        ', testTime.toISOString());
  console.log('reminder_id:         ', reminderId);
  console.log('reminder_status:     ', 'scheduled (' + reminderAction + ')');
  console.log('\nCron отправит уведомление через ~2 минуты.');
}

run()
  .catch((err) => console.error('Ошибка:', err.message))
  .finally(() => db.destroy());
