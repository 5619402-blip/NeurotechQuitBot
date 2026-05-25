// Миграция 007 — таблица user_consents (раздел 18, docs/TZ_v4.md)
// Согласие обязательно до оплаты и прохождения процедуры (раздел 5.8).
exports.up = async (knex) => {
  await knex.schema.createTable('user_consents', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('consent_version').notNullable();
    table.timestamp('accepted_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    // source: откуда пришло согласие — 'main_flow', 'gift_flow' и т.д.
    table.text('source');
    // telegram_id дублируется согласно ТЗ раздел 18
    table.bigInteger('telegram_id').notNullable();

    table.index('user_id');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('user_consents');
};
