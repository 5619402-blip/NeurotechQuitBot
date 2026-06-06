// READ-ONLY QA diagnostic script for user 7185030567.
// No UPDATE / INSERT / DELETE — safe to run at any time.

const db = require('../src/db/connection');

const TELEGRAM_ID = 7185030567;

// Reference protocol sequence (0-indexed steps)
const PROTOCOL_SEQUENCE = [
  { procedure_type: 'anti_tobacco',     reminder_type: 'next_procedure_24h', next_type: 'quick_lever' },
  { procedure_type: 'quick_lever',      reminder_type: 'next_procedure_48h', next_type: 'anti_tobacco' },
  { procedure_type: 'anti_tobacco',     reminder_type: 'next_procedure_48h', next_type: 'short_quick_lever' },
  { procedure_type: 'short_quick_lever', reminder_type: 'next_procedure_48h', next_type: 'short_anti_tobacco' },
  { procedure_type: 'short_anti_tobacco', reminder_type: null,               next_type: null },
];

// Expected next_procedure_type after N steps completed (current_step_number = N)
const STEP_NEXT_MAP = {
  1: 'quick_lever',
  2: 'anti_tobacco',
  3: 'short_quick_lever',
  4: 'short_anti_tobacco',
  5: null, // protocol completed
};

let passed = 0;
let warned = 0;
let failed = 0;

function ok(msg)   { console.log('✅ ' + msg); passed++; }
function warn(msg) { console.log('⚠️  ' + msg); warned++; }
function fail(msg) { console.log('❌ ' + msg); failed++; }

async function run() {
  console.log('=== QA DIAGNOSTIC: user ' + TELEGRAM_ID + ' ===\n');

  // ─── [1] USER ────────────────────────────────────────────────────────────────
  console.log('[1] USER');

  const user = await db('users').where({ telegram_id: TELEGRAM_ID }).first();
  if (!user) {
    fail('user not found: telegram_id=' + TELEGRAM_ID);
    return printSummary();
  }
  ok('user found: id=' + user.id + ' telegram_id=' + user.telegram_id);

  const BLOCKED_STATUSES = ['blocked', 'not_smoking', 'protocol_paused'];
  if (BLOCKED_STATUSES.includes(user.user_status)) {
    warn('user_status: ' + user.user_status + ' (flow may be paused)');
  } else {
    ok('user_status: ' + user.user_status);
  }

  const ar = await db('access_rights').where({ user_id: user.id }).first();
  if (!ar) {
    fail('access_rights not found');
    return printSummary();
  }
  if (ar.access_type === 'full_access') {
    ok('access_type: full_access');
  } else {
    fail('access_type: ' + ar.access_type + ' — expected full_access');
  }
  console.log();

  // ─── [2] PROTOCOL PROGRESS ───────────────────────────────────────────────────
  console.log('[2] PROTOCOL PROGRESS');

  const progress = await db('protocol_progress').where({ user_id: user.id }).first();
  if (!progress) {
    fail('protocol_progress not found');
    return printSummary();
  }
  ok('protocol_progress found: step=' + progress.current_step_number +
    ' next=' + progress.next_procedure_type +
    ' last_completed=' + (progress.last_completed_procedure_type || 'null'));

  const step = progress.current_step_number;
  if (step === 5) {
    if (progress.main_protocol_completed) {
      ok('main_protocol_completed: true');
    } else {
      warn('current_step_number=5 but main_protocol_completed not set');
    }
  } else if (STEP_NEXT_MAP[step] !== undefined) {
    const expectedNext = STEP_NEXT_MAP[step];
    if (progress.next_procedure_type === expectedNext) {
      ok('next_procedure_type: ' + progress.next_procedure_type + ' — correct for step ' + step);
    } else {
      fail('next_procedure_type: got ' + progress.next_procedure_type +
        ' — expected ' + expectedNext + ' for step ' + step);
    }
  } else {
    warn('current_step_number=' + step + ' is outside reference map (0–5)');
  }

  if (progress.next_procedure_unlocks_at) {
    const unlockMs = typeof progress.next_procedure_unlocks_at === 'number'
      ? progress.next_procedure_unlocks_at
      : new Date(progress.next_procedure_unlocks_at).valueOf();
    const unlockDate = new Date(unlockMs);
    if (unlockDate > new Date()) {
      ok('next_procedure_unlocks_at: ' + unlockDate.toISOString() + ' (timer active)');
    } else {
      ok('next_procedure_unlocks_at: ' + unlockDate.toISOString() + ' (expired — procedure unlocked)');
    }
  } else if (step < 5) {
    warn('next_procedure_unlocks_at: NULL — timer not set');
  }
  console.log();

  // ─── [3] PROCEDURE SESSIONS ──────────────────────────────────────────────────
  console.log('[3] PROCEDURE SESSIONS');

  const completedSessions = await db('procedure_sessions as ps')
    .join('procedures as p', 'p.id', 'ps.procedure_id')
    .where('ps.user_id', user.id)
    .where('ps.session_status', 'completed')
    .where('ps.is_counted_as_completed', 1)
    .whereNot('p.procedure_type', 'alpha')
    .select('ps.id', 'ps.procedure_id', 'p.procedure_type', 'ps.completed_at')
    .orderBy('ps.id', 'asc');

  const expectedSteps = Math.min(step, PROTOCOL_SEQUENCE.length);

  for (let i = 0; i < expectedSteps; i++) {
    const ref = PROTOCOL_SEQUENCE[i];
    const session = completedSessions[i];
    const stepLabel = 'step ' + (i + 1);
    if (!session) {
      fail(stepLabel + ': expected ' + ref.procedure_type + ' completed — session not found');
    } else if (session.procedure_type !== ref.procedure_type) {
      fail(stepLabel + ': expected ' + ref.procedure_type +
        ' — got ' + session.procedure_type + ' (session_id=' + session.id + ')');
    } else {
      ok(stepLabel + ': ' + session.procedure_type + ' completed (session_id=' + session.id + ')');
    }
  }

  if (completedSessions.length > expectedSteps) {
    warn('extra completed sessions: count=' + completedSessions.length +
      ' expected=' + expectedSteps + ' — possible duplicate or test artifact');
  }
  console.log();

  // ─── [4] REMINDERS ───────────────────────────────────────────────────────────
  console.log('[4] REMINDERS');

  for (let i = 0; i < Math.min(completedSessions.length, PROTOCOL_SEQUENCE.length); i++) {
    const ref = PROTOCOL_SEQUENCE[i];
    if (!ref.reminder_type) continue; // step 5 (short_anti_tobacco) — no reminder expected

    const session = completedSessions[i];
    if (!session) continue;

    const nextSession = completedSessions[i + 1] || null;
    const reminder = await db('reminders')
      .where({ related_session_id: session.id })
      .orderBy('id', 'desc')
      .first();

    const label = 'reminder step ' + (i + 1) +
      ' (' + ref.reminder_type + ' → ' + ref.next_type +
      ', related_session_id=' + session.id + ')';

    if (!reminder) {
      if (!nextSession) {
        fail(label + ': not found — reminder was never created, next session missing');
      } else {
        warn(label + ': not found — but next session exists (session_id=' + nextSession.id + '), flow continued');
      }
      continue;
    }

    // Check reminder_type correctness
    if (reminder.reminder_type !== ref.reminder_type) {
      fail(label + ': wrong reminder_type=' + reminder.reminder_type +
        ' — expected ' + ref.reminder_type + ' (reminder_id=' + reminder.id + ')');
    }

    // Check status
    if (reminder.reminder_status === 'sent') {
      ok(label + ': sent (reminder_id=' + reminder.id + ' sent_at=' + reminder.sent_at + ')');
    } else if (reminder.reminder_status === 'scheduled') {
      const schedMs = typeof reminder.scheduled_at === 'number'
        ? reminder.scheduled_at
        : new Date(reminder.scheduled_at).valueOf();
      ok(label + ': scheduled at ' + new Date(schedMs).toISOString() + ' (reminder_id=' + reminder.id + ')');
    } else if (reminder.reminder_status === 'cancelled') {
      if (nextSession) {
        ok(label + ': cancelled — OK, next session exists (session_id=' + nextSession.id + ')');
      } else {
        fail(label + ': cancelled — FAIL, next session (' + ref.next_type +
          ') missing — reminder cancelled prematurely (reminder_id=' + reminder.id + ')');
      }
    } else if (reminder.reminder_status === 'expired') {
      if (nextSession) {
        warn(label + ': expired — but next session exists, flow continued (reminder_id=' + reminder.id + ')');
      } else {
        fail(label + ': expired — next session (' + ref.next_type +
          ') missing — user may be stuck (reminder_id=' + reminder.id + ')');
      }
    } else if (reminder.reminder_status === 'completed') {
      if (nextSession) {
        ok(label + ': completed — user responded, next session exists (reminder_id=' + reminder.id + ')');
      } else {
        warn(label + ': completed — user responded but next session missing (reminder_id=' + reminder.id + ')');
      }
    } else {
      warn(label + ': unexpected status=' + reminder.reminder_status + ' (reminder_id=' + reminder.id + ')');
    }
  }
  console.log();

  // ─── [5] ACCESS RIGHTS COUNT ─────────────────────────────────────────────────
  console.log('[5] ACCESS RIGHTS COUNT');

  const sessionCount = completedSessions.length;
  if (ar.used_main_procedures_count === sessionCount) {
    ok('used_main_procedures_count=' + ar.used_main_procedures_count +
      ' matches completed counted sessions=' + sessionCount);
  } else {
    warn('used_main_procedures_count=' + ar.used_main_procedures_count +
      ' vs completed counted sessions=' + sessionCount +
      ' — display in «Мой доступ» may show wrong count');
  }
  console.log();

  // ─── [6] ACTIVE SESSIONS ─────────────────────────────────────────────────────
  console.log('[6] ACTIVE SESSIONS');

  const startedSessions = await db('procedure_sessions as ps')
    .join('procedures as p', 'p.id', 'ps.procedure_id')
    .where('ps.user_id', user.id)
    .where('ps.session_status', 'started')
    .select('ps.id', 'p.procedure_type', 'ps.started_at');

  if (startedSessions.length === 0) {
    ok('no started sessions');
  } else {
    for (const s of startedSessions) {
      fail('started session found: id=' + s.id +
        ' procedure_type=' + s.procedure_type + ' started_at=' + s.started_at +
        ' — user may be stuck mid-session');
    }
  }
  console.log();

  // ─── [7] PLAYER TOKENS ───────────────────────────────────────────────────────
  console.log('[7] PLAYER TOKENS');

  for (const session of completedSessions) {
    const token = await db('player_tokens')
      .where({ procedure_session_id: session.id })
      .orderBy('id', 'desc')
      .first();
    if (token) {
      ok('player_token session_id=' + session.id +
        ' (' + session.procedure_type + '): found' +
        (token.used_at ? ' used_at=' + token.used_at : ' not used yet'));
    } else {
      warn('player_token session_id=' + session.id +
        ' (' + session.procedure_type + '): not found (may have expired or been cleaned up)');
    }
  }
  console.log();

  printSummary();
}

function printSummary() {
  console.log('=== SUMMARY ===');
  console.log('✅ passed: ' + passed);
  console.log('⚠️  warned: ' + warned);
  console.log('❌ failed: ' + failed);
  if (failed === 0 && warned === 0) {
    console.log('\nScenario state: CLEAN');
  } else if (failed === 0) {
    console.log('\nScenario state: OK with ' + warned + ' warning(s)');
  } else {
    console.log('\nScenario state: DIVERGED — ' + failed + ' check(s) failed');
  }
}

run()
  .catch((err) => console.error('Script error:', err.message))
  .finally(() => db.destroy());
