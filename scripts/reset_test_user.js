const db = require('../src/db/connection');

const TELEGRAM_ID = 7185030567;

const TABLES = [
  'player_tokens',
  'post_procedure_answers',
  'procedure_sessions',
  'access_rights',
  'payments',
  'protocol_progress',
  'draft_answers',
  'user_consents',
  'diagnostics',
  'reminders',
  'next_day_followups',
  'seven_day_followups',
  'user_reviews',
  'support_requests',
  'events',
];

async function run() {
  const user = await db('users').where({ telegram_id: TELEGRAM_ID }).first();

  if (!user) {
    console.log('[reset] not found');
    return;
  }

  const id = user.id;
  console.log('[reset] found user id=' + id);

  for (const table of TABLES) {
    const count = await db(table).where({ user_id: id }).del();
    console.log('[reset] ' + table + ' deleted ' + count);
  }

  await db('users').where({ id }).del();
  console.log('[reset] done');
}

run()
  .catch(err => console.error('[reset] error:', err.message))
  .finally(() => db.destroy());
