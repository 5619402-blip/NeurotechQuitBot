// Миграция 019 — таблица support_requests (раздел 18, docs/TZ_v4.md)
// Заглушка поддержки: сохраняет обращение и отправляет в админ-чат (раздел 14).
exports.up = async (knex) => {
  await knex.schema.createTable('support_requests', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('current_screen');
    table.text('access_type');
    table.text('message_text').notNullable();
    table.specificType('support_status', 'support_status_enum').notNullable().defaultTo('new');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('resolved_at', { useTz: true });

    table.index(['support_status']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('support_requests');
};
