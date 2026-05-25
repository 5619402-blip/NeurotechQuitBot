// Миграция 014 — таблица next_day_followups (раздел 18, docs/TZ_v4.md)
// Отправляется через 24 часа от completed_at процедуры (раздел 12.1).
// scheduled_at и sent_at обязательны по ТЗ.
exports.up = async (knex) => {
  await knex.schema.createTable('next_day_followups', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.bigInteger('procedure_session_id').notNullable().references('id').inTable('procedure_sessions').onDelete('CASCADE');
    table.timestamp('scheduled_at', { useTz: true }).notNullable();
    table.timestamp('sent_at', { useTz: true });
    table.text('smoked_after_procedure');
    table.text('current_craving');
    table.text('easier_to_abstain');
    table.text('strongest_trigger');
    table.text('noticed_change');
    table.specificType('wants_to_continue', 'wants_to_continue_enum');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['user_id', 'scheduled_at']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('next_day_followups');
};
