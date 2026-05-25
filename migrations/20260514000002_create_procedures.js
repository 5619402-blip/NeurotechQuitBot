// Миграция 002 — таблица procedures (раздел 18, docs/TZ_v4.md)
// Создаётся до users, так как users.next_procedure_id ссылается на procedures.id
exports.up = async (knex) => {
  await knex.schema.createTable('procedures', (table) => {
    table.bigIncrements('id').primary();
    table.text('procedure_name').notNullable();
    table.specificType('procedure_type', 'procedure_type_enum').notNullable();
    table.integer('sort_order').notNullable().defaultTo(0);
    table.boolean('is_main_protocol').notNullable().defaultTo(true);
    table.boolean('is_active').notNullable().defaultTo(true);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('procedures');
};
