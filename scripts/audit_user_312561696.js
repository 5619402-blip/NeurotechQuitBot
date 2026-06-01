// READ-ONLY аудит пользователя 312561696. Только SELECT — никаких INSERT/UPDATE/DELETE.
require('dotenv').config();
const db = require('../src/db/connection');
const TELEGRAM_ID = '312561696';

function sep(t) { console.log('\n' + '─'.repeat(50) + '\n  ' + t + '\n' + '─'.repeat(50)); }
function row(l, v) { console.log('  ' + String(l).padEnd(36) + (v === null || v === undefined ? 'NULL' : v)); }

async function run() {
  sep('1. USERS');
  const user = await db('users').where({ telegram_id: TELEGRAM_ID }).first();
  if (!user) {
    console.log('  Пользователь НЕ НАЙДЕН. Сброс не нужен.');
    return;
  }
  row('id', user.id);
  row('telegram_id', user.telegram_id);
  row('first_name', user.first_name);
  row('username', user.username);
  row('user_status', user.user_status);
  row('access_type', user.access_type);
  row('access_status', user.access_status);
  row('current_screen', user.current_screen);
  row('has_active_unfinished_procedure', user.has_active_unfinished_procedure);
  row('completed_procedures_count', user.completed_procedures_count);
  row('next_procedure_id', user.next_procedure_id);
  row('pause_reason', user.pause_reason);
  row('paused_at', user.paused_at);
  row('created_at', user.created_at);
  row('last_activity_at', user.last_activity_at);
  const uid = user.id;

  sep('2. ACCESS_RIGHTS');
  const acc = await db('access_rights').where({ user_id: uid }).orderBy('created_at', 'desc');
  if (!acc.length) { console.log('  Записей нет.'); }
  else acc.forEach((a, i) => {
    console.log('  [' + i + '] id=' + a.id + ' type=' + a.access_type + ' status=' + a.access_status);
    row('    paid_main_count', a.paid_main_procedures_count);
    row('    used_main_count', a.used_main_procedures_count);
    row('    available_alpha', a.available_alpha_sessions_count);
    row('    used_alpha', a.used_alpha_sessions_count);
    row('    payment_id', a.payment_id);
    row('    created_at', a.created_at);
  });

  sep('3. PAYMENTS');
  const pays = await db('payments').where({ user_id: uid }).orderBy('created_at', 'desc');
  if (!pays.length) { console.log('  Записей нет.'); }
  else pays.forEach((p, i) => {
    console.log('  [' + i + '] id=' + p.id + ' status=' + p.payment_status + ' amount=' + p.amount + ' ' + p.currency);
    row('    tariff_type', p.tariff_type);
    row('    created_at', p.created_at);
  });

  sep('4. PROTOCOL_PROGRESS');
  const pp = await db('protocol_progress').where({ user_id: uid }).first();
  if (!pp) { console.log('  Записи нет.'); }
  else {
    row('current_step_number', pp.current_step_number);
    row('next_procedure_type', pp.next_procedure_type);
    row('last_completed_procedure_type', pp.last_completed_procedure_type);
    row('main_protocol_completed', pp.main_protocol_completed);
    row('updated_at', pp.updated_at);
  }

  sep('5. PROCEDURE_SESSIONS (все)');
  const sess = await db('procedure_sessions as ps')
    .join('procedures as p', 'p.id', 'ps.procedure_id')
    .where('ps.user_id', uid)
    .select(
      'ps.id', 'ps.session_status', 'ps.procedure_number',
      'ps.started_at', 'ps.completed_at', 'ps.interrupted_at',
      'ps.is_counted_as_completed', 'ps.exit_reason', 'p.procedure_type'
    )
    .orderBy('ps.id', 'desc');
  if (!sess.length) { console.log('  Сессий нет.'); }
  else sess.forEach((s, i) => {
    console.log('  [' + i + '] id=' + s.id + ' type=' + s.procedure_type + ' #' + s.procedure_number + ' status=' + s.session_status);
    row('    is_counted_as_completed', s.is_counted_as_completed);
    row('    started_at', s.started_at);
    row('    completed_at', s.completed_at);
    row('    exit_reason', s.exit_reason);
  });

  sep('6. PLAYER_TOKENS (все)');
  const tokens = await db('player_tokens').where({ user_id: uid }).orderBy('created_at', 'desc');
  if (!tokens.length) { console.log('  Токенов нет.'); }
  else tokens.forEach((t, i) => {
    console.log('  [' + i + '] id=' + t.id + ' session_id=' + t.procedure_session_id);
    row('    token (prefix)', t.token ? t.token.slice(0, 8) + '...' : 'NULL');
    row('    created_at', t.created_at);
    row('    expires_at', t.expires_at);
    row('    used_at', t.used_at);
    row('    is_revoked', t.is_revoked);
  });

  sep('7. DIAGNOSTICS');
  const diag = await db('diagnostics').where({ user_id: uid }).orderBy('created_at', 'desc');
  if (!diag.length) { console.log('  Записей нет.'); }
  else diag.forEach((d, i) => {
    console.log('  [' + i + '] id=' + d.id + ' status=' + d.diagnostic_status);
    row('    nicotine_type', d.nicotine_type);
    row('    motivation_level', d.motivation_level);
    row('    motivation_source', d.motivation_source);
    row('    created_at', d.created_at);
    row('    completed_at', d.completed_at);
  });

  sep('8. DRAFT_ANSWERS');
  const drafts = await db('draft_answers').where({ user_id: uid });
  if (!drafts.length) { console.log('  Записей нет.'); }
  else drafts.forEach(d => console.log('  screen_id=' + d.screen_id + ' updated_at=' + d.updated_at));

  sep('9. USER_CONSENTS');
  const cons = await db('user_consents').where({ user_id: uid });
  console.log('  Записей: ' + cons.length);
  cons.forEach(c => row('  consent_version', c.consent_version));

  sep('10. REMINDERS');
  const rem = await db('reminders').where({ user_id: uid });
  if (!rem.length) { console.log('  Записей нет.'); }
  else rem.forEach((r, i) => {
    console.log('  [' + i + '] type=' + r.reminder_type + ' status=' + r.reminder_status + ' scheduled_at=' + r.scheduled_at);
  });

  sep('11. NEXT_DAY_FOLLOWUPS');
  const ndf = await db('next_day_followups').where({ user_id: uid });
  console.log('  Записей: ' + ndf.length);

  sep('12. SEVEN_DAY_FOLLOWUPS');
  const sdf = await db('seven_day_followups').where({ user_id: uid });
  console.log('  Записей: ' + sdf.length);

  sep('13. POST_PROCEDURE_ANSWERS');
  const ppa = await db('post_procedure_answers').where({ user_id: uid });
  console.log('  Записей: ' + ppa.length);

  sep('14. USER_REVIEWS');
  const ur = await db('user_reviews').where({ user_id: uid });
  console.log('  Записей: ' + ur.length);

  sep('15. SUPPORT_REQUESTS');
  const sr = await db('support_requests').where({ user_id: uid });
  console.log('  Записей: ' + sr.length);

  sep('16. EVENTS');
  const ev = await db('events').where({ user_id: uid });
  console.log('  Записей: ' + ev.length);

  sep('17. GIFT_ACCESS_TOKENS (activated_by)');
  const gift = await db('gift_access_tokens').where({ activated_by_user_id: uid });
  if (!gift.length) { console.log('  Не активировал ни одного gift-токена.'); }
  else gift.forEach((g, i) => {
    console.log('  [' + i + '] id=' + g.id + ' token=' + g.token.slice(0, 8) + '...');
    row('    gift_access_type', g.gift_access_type);
    row('    status', g.status);
    row('    activated_at', g.activated_at);
    row('    expires_at', g.expires_at);
  });

  sep('ИТОГ — сводка по таблицам');
  const summary = {
    access_rights: acc.length,
    payments: pays.length,
    protocol_progress: pp ? 1 : 0,
    procedure_sessions: sess.length,
    player_tokens: tokens.length,
    diagnostics: diag.length,
    draft_answers: drafts.length,
    user_consents: cons.length,
    reminders: rem.length,
    next_day_followups: ndf.length,
    seven_day_followups: sdf.length,
    post_procedure_answers: ppa.length,
    user_reviews: ur.length,
    support_requests: sr.length,
    events: ev.length,
    'gift_access_tokens (activated_by)': gift.length,
  };
  let total = 0;
  for (const [t, c] of Object.entries(summary)) {
    console.log('  ' + String(t).padEnd(42) + c + ' записей');
    total += c;
  }
  console.log('\n  Итого связанных записей: ' + total + ' + 1 строка users');
}

run().catch(e => console.error('ERROR:', e.message)).finally(() => db.destroy());
