// Миграция 005 — таблица diagnostics (раздел 18, docs/TZ_v4.md)
// Одна запись на сессию диагностики. Повторная диагностика создаёт новую строку (раздел 13.1).
exports.up = async (knex) => {
  await knex.schema.createTable('diagnostics', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('user_name');
    table.text('age_group');
    table.text('nicotine_type');
    table.text('smoking_years_group');
    table.boolean('tried_to_quit_before');
    table.text('quit_attempts_count');
    table.text('longest_quit_period');
    table.integer('motivation_level');
    table.text('motivation_source');
    table.specificType('diagnostic_status', 'diagnostic_status_enum').notNullable().defaultTo('started');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('completed_at', { useTz: true });

    table.index('user_id');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('diagnostics');
};
