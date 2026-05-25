// Миграция 015 — таблица seven_day_followups (раздел 18, docs/TZ_v4.md)
// Создаётся при ответе «Я уже не курю». trigger_source указывает источник (раздел 12.3).
exports.up = async (knex) => {
  await knex.schema.createTable('seven_day_followups', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    // trigger_source: 'after_procedure_not_smoking' | 'next_day_not_smoking' |
    //                 'final_check_not_smoking' | 'manual_admin'
    table.text('trigger_source').notNullable();
    table.timestamp('scheduled_at', { useTz: true }).notNullable();
    table.timestamp('sent_at', { useTz: true });
    table.text('smoked_last_7_days');
    table.text('current_craving');
    table.text('changes_noticed');
    table.boolean('needs_support');
    table.specificType('result_status', 'result_status_enum');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['user_id', 'scheduled_at']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('seven_day_followups');
};
