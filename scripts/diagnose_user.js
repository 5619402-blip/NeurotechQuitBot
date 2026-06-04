// READ-ONLY диагностика пользователя. Только SELECT — никаких INSERT/UPDATE/DELETE.
const db = require('../src/db/connection');

const TELEGRAM_ID = 7185030567;

function sep(title) {
  console.log('\n' + '─'.repeat(50));
  console.log('  ' + title);
  console.log('─'.repeat(50));
}

function row(label, value) {
  const v = value === null || value === undefined ? 'NULL' : value;
  console.log('  ' + String(label).padEnd(36) + v);
}

async function run() {
  // ── 1. users ──────────────────────────────────────
  sep('1. USERS');
  const user = await db('users').where({ telegram_id: TELEGRAM_ID }).first();
  if (!user) {
    console.log('  Пользователь не найден. Дальнейший аудит невозможен.');
    return;
  }
  row('id', user.id);
  row('telegram_id', user.telegram_id);
  row('first_name', user.first_name);
  row('user_status', user.user_status);
  row('access_type', user.access_type);
  row('access_status', user.access_status);
  row('has_active_unfinished_procedure', user.has_active_unfinished_procedure);
  row('completed_procedures_count', user.completed_procedures_count);
  row('next_procedure_id', user.next_procedure_id);
  row('current_screen', user.current_screen);
  row('last_activity_at', user.last_activity_at);

  const userId = user.id;

  // ── 2. access_rights ──────────────────────────────
  sep('2. ACCESS_RIGHTS');
  const accRows = await db('access_rights').where({ user_id: userId }).orderBy('created_at', 'desc');
  if (!accRows.length) {
    console.log('  Записей нет.');
  } else {
    accRows.forEach((a, i) => {
      console.log(`  [${i}] id=${a.id}`);
      row('    access_type', a.access_type);
      row('    access_status', a.access_status);
      row('    paid_main_procedures_count', a.paid_main_procedures_count);
      row('    used_main_procedures_count', a.used_main_procedures_count);
      row('    available_alpha_sessions_count', a.available_alpha_sessions_count);
      row('    used_alpha_sessions_count', a.used_alpha_sessions_count);
      row('    upgrade_available', a.upgrade_available);
      row('    created_at', a.created_at);
    });
  }

  // ── 3. protocol_progress ──────────────────────────
  sep('3. PROTOCOL_PROGRESS');
  const pp = await db('protocol_progress').where({ user_id: userId }).first();
  if (!pp) {
    console.log('  Записи нет.');
  } else {
    row('current_step_number', pp.current_step_number);
    row('next_procedure_type', pp.next_procedure_type);
    row('last_completed_procedure_type', pp.last_completed_procedure_type);
    row('main_protocol_completed', pp.main_protocol_completed);
    row('updated_at', pp.updated_at);
  }

  // ── 4. reminders ─────────────────────────────────
  sep('4. REMINDERS');
  const reminders = await db('reminders')
    .where({ user_id: userId })
    .orderBy('id', 'desc');

  if (!reminders.length) {
    console.log('  Напоминаний нет.');
  } else {
    reminders.forEach((r, i) => {
      console.log(`  [${i}] id=${r.id}`);
      row('    reminder_type', r.reminder_type);
      row('    reminder_status', r.reminder_status);
      row('    procedure_id', r.procedure_id);
      row('    related_session_id', r.related_session_id);
      row('    scheduled_at', r.scheduled_at);
      row('    sent_at', r.sent_at);
      row('    reminder_count', r.reminder_count);
      row('    created_at', r.created_at);
      row('    updated_at', r.updated_at);
    });
  }

  // ── 5. procedure_sessions ─────────────────────────
  sep('5. PROCEDURE_SESSIONS (последние 5)');
  const sessions = await db('procedure_sessions as ps')
    .join('procedures as p', 'p.id', 'ps.procedure_id')
    .where('ps.user_id', userId)
    .select(
      'ps.id', 'ps.session_status', 'ps.procedure_number',
      'ps.started_at', 'ps.completed_at', 'ps.interrupted_at',
      'ps.is_counted_as_completed', 'ps.exit_reason',
      'p.procedure_type'
    )
    .orderBy('ps.id', 'desc')
    .limit(5);

  if (!sessions.length) {
    console.log('  Сессий нет.');
  } else {
    sessions.forEach((s, i) => {
      console.log(`  [${i}] id=${s.id}  procedure_type=${s.procedure_type}  #${s.procedure_number}`);
      row('    session_status', s.session_status);
      row('    is_counted_as_completed', s.is_counted_as_completed);
      row('    started_at', s.started_at);
      row('    completed_at', s.completed_at);
      row('    interrupted_at', s.interrupted_at);
      row('    exit_reason', s.exit_reason);
    });
  }

  // ── 6. player_tokens ──────────────────────────────
  sep('6. PLAYER_TOKENS (последние 5)');
  const tokens = await db('player_tokens')
    .where({ user_id: userId })
    .orderBy('created_at', 'desc')
    .limit(5);

  if (!tokens.length) {
    console.log('  Токенов нет.');
  } else {
    tokens.forEach((t, i) => {
      console.log(`  [${i}] id=${t.id}  session_id=${t.procedure_session_id}`);
      row('    token (prefix)', t.token ? t.token.slice(0, 8) + '...' : 'NULL');
      row('    created_at', t.created_at);
      row('    expires_at', t.expires_at);
      row('    used_at', t.used_at);
      row('    is_revoked', t.is_revoked);
    });
  }

  sep('ИТОГ');
  const hasAccess = accRows.some(a => a.access_status === 'active' && a.used_main_procedures_count < a.paid_main_procedures_count);
  const activeSessions = sessions.filter(s => s.session_status === 'started');
  console.log('  user_status:                        ' + user.user_status);
  console.log('  has_active_unfinished_procedure:    ' + user.has_active_unfinished_procedure);
  console.log('  есть активный доступ для процедуры: ' + hasAccess);
  console.log('  открытых сессий (status=started):   ' + activeSessions.length);
  if (activeSessions.length) {
    activeSessions.forEach(s => console.log('    → session_id=' + s.id + ' type=' + s.procedure_type));
  }
}

run()
  .catch(err => console.error('[diagnose] error:', err.message))
  .finally(() => db.destroy());
