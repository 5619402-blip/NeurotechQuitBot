// Миграция 010 — таблица procedure_sessions (раздел 18, docs/TZ_v4.md)
// session_status управляется через callback от плеера (раздел 8.4).
exports.up = async (knex) => {
  await knex.schema.createTable('procedure_sessions', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.bigInteger('procedure_id').notNullable().references('id').inTable('procedures').onDelete('RESTRICT');
    table.integer('procedure_number');
    table.specificType('session_status', 'session_status_enum').notNullable().defaultTo('created');
    table.timestamp('started_at', { useTz: true });
    table.timestamp('completed_at', { useTz: true });
    table.timestamp('interrupted_at', { useTz: true });
    // audio_position_seconds — только аналитика, не используется для перемотки (раздел 8.1)
    table.integer('audio_position_seconds');
    table.boolean('is_counted_as_completed').notNullable().defaultTo(false);
    table.text('exit_reason');

    table.index('user_id');
    table.index(['user_id', 'session_status']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('procedure_sessions');
};
