// Миграция 003 — таблица users (раздел 18, docs/TZ_v4.md)
exports.up = async (knex) => {
  await knex.schema.createTable('users', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('telegram_id').notNullable().unique();
    table.text('username');
    table.text('first_name');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('last_activity_at', { useTz: true });
    table.text('current_screen');
    table.specificType('user_status', 'user_status_enum').notNullable().defaultTo('new');
    table.specificType('access_type', 'access_type_enum').notNullable().defaultTo('none');
    table.specificType('access_status', 'access_status_enum').notNullable().defaultTo('inactive');
    table.bigInteger('next_procedure_id').references('id').inTable('procedures').onDelete('SET NULL');
    table.integer('completed_procedures_count').notNullable().defaultTo(0);
    table.boolean('has_active_unfinished_procedure').notNullable().defaultTo(false);
    table.boolean('maturity_mode_enabled').notNullable().defaultTo(false);
    table.text('pause_reason');
    table.timestamp('paused_at', { useTz: true });

    table.index('telegram_id');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('users');
};
