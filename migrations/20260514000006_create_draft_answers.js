// Миграция 006 — таблица draft_answers (раздел 18, docs/TZ_v4.md)
// Промежуточные ответы во время диагностики. Одна строка на (user_id, screen_id).
exports.up = async (knex) => {
  await knex.schema.createTable('draft_answers', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    // screen_id: идентификатор экрана, напр. 'diagnostic_1', 'diagnostic_2'
    table.text('screen_id').notNullable();
    table.jsonb('answers_json').notNullable().defaultTo('{}');
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['user_id', 'screen_id']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('draft_answers');
};
