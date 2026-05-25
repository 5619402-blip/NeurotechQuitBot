// Миграция 009 — таблица access_rights (раздел 18, docs/TZ_v4.md)
// payment_id nullable: при подарочном доступе оплаты нет (раздел 16.2).
// available_alpha_sessions_count nullable: NULL = безлимитно (full_access, раздел 9.1).
exports.up = async (knex) => {
  await knex.schema.createTable('access_rights', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.bigInteger('payment_id').nullable().references('id').inTable('payments').onDelete('SET NULL');
    table.specificType('access_type', 'access_type_enum').notNullable().defaultTo('none');
    table.specificType('access_status', 'access_status_enum').notNullable().defaultTo('inactive');
    table.integer('paid_main_procedures_count').notNullable().defaultTo(0);
    table.integer('used_main_procedures_count').notNullable().defaultTo(0);
    table.integer('available_alpha_sessions_count').nullable();
    table.integer('used_alpha_sessions_count').notNullable().defaultTo(0);
    table.boolean('upgrade_available').notNullable().defaultTo(false);
    table.decimal('upgrade_amount', 10, 2);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('user_id');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('access_rights');
};
