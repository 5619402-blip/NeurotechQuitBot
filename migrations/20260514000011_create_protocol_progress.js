// Миграция 011 — таблица protocol_progress (раздел 18, docs/TZ_v4.md)
// Одна строка на пользователя. current_step_number управляет чередованием процедур (раздел 9.2).
exports.up = async (knex) => {
  await knex.schema.createTable('protocol_progress', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().unique().references('id').inTable('users').onDelete('CASCADE');
    table.integer('current_step_number').notNullable().defaultTo(0);
    table.specificType('next_procedure_type', 'procedure_type_enum');
    table.boolean('main_protocol_completed').notNullable().defaultTo(false);
    table.specificType('last_completed_procedure_type', 'procedure_type_enum');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('protocol_progress');
};
