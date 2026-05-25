exports.up = (knex) =>
  knex.schema.table('users', (t) => {
    t.timestamp('rules_video_watched_at', { useTz: true }).nullable();
  });

exports.down = (knex) =>
  knex.schema.table('users', (t) => {
    t.dropColumn('rules_video_watched_at');
  });
