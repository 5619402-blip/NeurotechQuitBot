// Миграция 021 — таблица events (раздел 18, docs/TZ_v4.md)
// Аналитические события. user_id nullable: допускает системные события без пользователя.
exports.up = async (knex) => {
  await knex.schema.createTable('events', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.text('event_name').notNullable();
    table.jsonb('event_payload').notNullable().defaultTo('{}');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['user_id', 'event_name']);
    table.index('created_at');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('events');
};
