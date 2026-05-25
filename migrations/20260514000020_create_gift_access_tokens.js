// Миграция 020 — таблица gift_access_tokens (раздел 18, docs/TZ_v4.md)
// Одноразовые подарочные ссылки. Активирует первый пользователь (раздел 16.3).
exports.up = async (knex) => {
  await knex.schema.createTable('gift_access_tokens', (table) => {
    table.bigIncrements('id').primary();
    table.text('token').notNullable().unique();
    table.bigInteger('created_by_admin_id').notNullable();
    table.specificType('gift_access_type', 'gift_access_type_enum').notNullable();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.specificType('status', 'gift_token_status_enum').notNullable().defaultTo('active');
    // activated_by_user_id: nullable — заполняется только после активации
    table.bigInteger('activated_by_user_id').nullable().references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('activated_at', { useTz: true });
    table.text('admin_comment');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['token', 'status']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('gift_access_tokens');
};
