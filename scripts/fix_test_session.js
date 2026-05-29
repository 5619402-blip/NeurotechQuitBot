// Хирургический сброс тестового состояния пользователя.
// Только UPDATE/INSERT — ничего не удаляет. Историю не трогает.
// Таблицы: procedure_sessions, users, access_rights.
// НЕ трогает: player_tokens, protocol_progress, payments, reminders, followups.
const db = require('../src/db/connection');

const TELEGRAM_ID = 7185030567;

function sep(title) {
  console.log('\n' + '─'.repeat(50));
  console.log('  ' + title);
  console.log('─'.repeat(50));
}

async function run() {
  // ── 0. Найти пользователя ─────────────────────────
  sep('0. ПОИСК ПОЛЬЗОВАТЕЛЯ');
  const user = await db('users').where({ telegram_id: TELEGRAM_ID }).first();
  if (!user) {
    console.log('  Пользователь не найден. Скрипт остановлен.');
    return;
  }
  console.log('  id=' + user.id + '  telegram_id=' + user.telegram_id);
  console.log('  user_status (до):                     ' + user.user_status);
  console.log('  has_active_unfinished_procedure (до):  ' + user.has_active_unfinished_procedure);

  const userId = user.id;
  const now = new Date();

  // ── 1. Закрыть все открытые сессии ───────────────
  sep('1. PROCEDURE_SESSIONS — прерывание started-сессий');
  const openSessions = await db('procedure_sessions')
    .where({ user_id: userId, session_status: 'started' })
    .select('id', 'session_status');

  if (!openSessions.length) {
    console.log('  Открытых сессий нет — ничего не меняем.');
  } else {
    console.log('  Найдено открытых сессий: ' + openSessions.length);
    openSessions.forEach(s => console.log('    id=' + s.id + '  status=' + s.session_status));

    const updated = await db('procedure_sessions')
      .where({ user_id: userId, session_status: 'started' })
      .update({
        session_status: 'interrupted',
        interrupted_at: now,
        is_counted_as_completed: false,
        exit_reason: 'test_reset',
      });

    console.log('  Обновлено строк: ' + updated);
    console.log('  → session_status = interrupted');
    console.log('  → interrupted_at = ' + now.toISOString());
    console.log('  → is_counted_as_completed = false');
    console.log('  → exit_reason = test_reset');
  }

  // ── 2. Сбросить флаги пользователя ───────────────
  sep('2. USERS — сброс флагов');
  await db('users')
    .where({ id: userId })
    .update({
      has_active_unfinished_procedure: false,
      user_status: 'waiting_next_procedure',
    });
  console.log('  → has_active_unfinished_procedure = false');
  console.log('  → user_status = waiting_next_procedure');

  // ── 3. Выдать тестовый доступ ─────────────────────
  sep('3. ACCESS_RIGHTS — тестовый доступ');
  const existing = await db('access_rights').where({ user_id: userId }).first();

  if (existing) {
    console.log('  Запись найдена: id=' + existing.id);
    console.log('  access_status (до):                   ' + existing.access_status);
    console.log('  access_type (до):                     ' + existing.access_type);
    console.log('  paid_main_procedures_count (до):      ' + existing.paid_main_procedures_count);
    console.log('  used_main_procedures_count (до):      ' + existing.used_main_procedures_count);

    await db('access_rights')
      .where({ id: existing.id })
      .update({
        access_status: 'active',
        access_type: 'single_procedure',
        paid_main_procedures_count: 1,
        used_main_procedures_count: 0,
        updated_at: now,
      });

    console.log('  → access_status = active');
    console.log('  → access_type = single_procedure');
    console.log('  → paid_main_procedures_count = 1');
    console.log('  → used_main_procedures_count = 0');
  } else {
    console.log('  Записи нет — создаём новую.');
    const [inserted] = await db('access_rights')
      .insert({
        user_id: userId,
        access_type: 'single_procedure',
        access_status: 'active',
        paid_main_procedures_count: 1,
        used_main_procedures_count: 0,
        available_alpha_sessions_count: null,
        used_alpha_sessions_count: 0,
        upgrade_available: false,
        created_at: now,
        updated_at: now,
      })
      .returning('id');
    console.log('  → Создана запись id=' + (inserted?.id ?? inserted));
    console.log('  → access_type = single_procedure');
    console.log('  → access_status = active');
    console.log('  → paid_main_procedures_count = 1');
    console.log('  → used_main_procedures_count = 0');
  }

  // ── Итог ──────────────────────────────────────────
  sep('ИТОГ');
  const after = await db('users').where({ id: userId }).first();
  console.log('  user_status:                        ' + after.user_status);
  console.log('  has_active_unfinished_procedure:    ' + after.has_active_unfinished_procedure);
  console.log('');
  console.log('  Готово. Теперь можно запустить процедуру через бота.');
}

run()
  .catch(err => console.error('[fix_test_session] error:', err.message))
  .finally(() => db.destroy());
