// Миграция 016 — таблица reminders (раздел 18, docs/TZ_v4.md)
// Одна строка = серия из до 3 напоминаний. scheduled_at мутирует после каждой отправки (раздел 12.2).
exports.up = async (knex) => {
  await knex.schema.createTable('reminders', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.bigInteger('procedure_id').nullable().references('id').inTable('procedures').onDelete('SET NULL');
    table.bigInteger('related_session_id').nullable().references('id').inTable('procedure_sessions').onDelete('SET NULL');
    table.specificType('reminder_type', 'reminder_type_enum').notNullable();
    // scheduled_at обновляется после каждой отправки: содержит время следующей попытки
    table.timestamp('scheduled_at', { useTz: true }).notNullable();
    table.timestamp('sent_at', { useTz: true });
    table.integer('reminder_count').notNullable().defaultTo(0);
    table.specificType('reminder_status', 'reminder_status_enum').notNullable().defaultTo('scheduled');
    table.text('user_response');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['user_id', 'reminder_status', 'scheduled_at']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('reminders');
};
