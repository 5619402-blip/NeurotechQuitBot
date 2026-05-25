// Миграция 013 — таблица post_procedure_answers (раздел 18, docs/TZ_v4.md)
// Хранит ответы Q1–Q6 после каждой процедуры. Q5 определяет маршрутизацию (раздел 11.3).
exports.up = async (knex) => {
  await knex.schema.createTable('post_procedure_answers', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.bigInteger('procedure_session_id').notNullable().references('id').inTable('procedure_sessions').onDelete('CASCADE');
    table.jsonb('answers_json').notNullable().defaultTo('{}');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index('user_id');
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('post_procedure_answers');
};
