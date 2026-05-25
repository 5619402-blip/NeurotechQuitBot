// Миграция 008 — таблица payments (раздел 18, docs/TZ_v4.md)
exports.up = async (knex) => {
  await knex.schema.createTable('payments', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.text('tariff_type').notNullable();
    table.decimal('amount', 10, 2).notNullable();
    table.text('currency').notNullable().defaultTo('RUB');
    table.text('payment_provider');
    table.specificType('payment_status', 'payment_status_enum').notNullable().defaultTo('pending');
    table.text('provider_payment_id');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('paid_at', { useTz: true });
    table.timestamp('failed_at', { useTz: true });
    table.text('failure_reason');

    table.index('user_id');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('payments');
};
