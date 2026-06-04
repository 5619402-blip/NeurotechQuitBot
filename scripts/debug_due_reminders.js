// READ ONLY — отладка getDueReminders. Никаких INSERT/UPDATE/DELETE.

const db = require('../src/db/connection');

async function main() {
  const now = Date.now();
  console.log('=== ТЕКУЩЕЕ ВРЕМЯ ===');
  console.log('Date.now():  ', now);
  console.log('ISO:         ', new Date(now).toISOString());

  // Все scheduled reminders — сырые данные
  const allScheduled = await db('reminders')
    .where({ reminder_status: 'scheduled' })
    .select('*');

  console.log('\n=== ВСЕ SCHEDULED REMINDERS (raw) ===');
  if (!allScheduled.length) {
    console.log('(нет scheduled reminder\'ов)');
  }
  for (const r of allScheduled) {
    const sat = r.scheduled_at;
    const satType = typeof sat;
    const isDue = sat <= now;
    console.log(`  id=${r.id}`);
    console.log(`    scheduled_at value:  ${sat}`);
    console.log(`    scheduled_at typeof: ${satType}`);
    console.log(`    Date.now():          ${now}`);
    console.log(`    scheduled_at <= now: ${isDue}`);
    console.log(`    reminder_type:       ${r.reminder_type}`);
    console.log(`    reminder_status:     ${r.reminder_status}`);
    console.log(`    procedure_id:        ${r.procedure_id}`);
    console.log(`    related_session_id:  ${r.related_session_id}`);
    console.log(`    reminder_count:      ${r.reminder_count}`);
  }

  // getDueReminders через Knex WHERE
  const due = await db('reminders')
    .where({ reminder_status: 'scheduled' })
    .where('scheduled_at', '<=', now)
    .select('*');

  console.log('\n=== getDueReminders() РЕЗУЛЬТАТ ===');
  console.log('Найдено:', due.length);
  if (due.length === 0) {
    console.log('ПУСТО — cron не обработает ни одного reminder в этом тике');
    console.log('Вероятная причина: scheduled_at хранится не как integer (ms)');
  } else {
    for (const r of due) {
      console.log(`  id=${r.id}  scheduled_at=${r.scheduled_at}  type=${r.reminder_type}`);
    }
  }

  // Дополнительная проверка: сравнение через ISO-строку (как работало раньше)
  console.log('\n=== СРАВНЕНИЕ ЧЕРЕЗ db.fn.now() (старый вариант) ===');
  const dueOld = await db('reminders')
    .where({ reminder_status: 'scheduled' })
    .where('scheduled_at', '<=', db.fn.now())
    .select('id', 'scheduled_at');
  console.log('Найдено через db.fn.now():', dueOld.length);
  for (const r of dueOld) {
    console.log(`  id=${r.id}  scheduled_at=${r.scheduled_at}`);
  }
}

main()
  .catch(err => console.error('Ошибка:', err.message))
  .finally(() => db.destroy());
