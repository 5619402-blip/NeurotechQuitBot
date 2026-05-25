// Миграция 012 — таблица player_tokens (раздел 18, docs/TZ_v4.md)
// TTL токена — 2 часа (раздел 8). Просроченный токен не удаляется, а is_revoked / expires_at проверяется при использовании.
exports.up = async (knex) => {
  await knex.schema.createTable('player_tokens', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.bigInteger('procedure_session_id').notNullable().references('id').inTable('procedure_sessions').onDelete('CASCADE');
    table.text('token').notNullable().unique();
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('used_at', { useTz: true });
    table.boolean('is_revoked').notNullable().defaultTo(false);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['token', 'is_revoked']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('player_tokens');
};
