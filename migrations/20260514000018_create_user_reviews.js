// Миграция 018 — таблица user_reviews (отзывы пользователей, раздел 18, docs/TZ_v4.md)
// Файлы хранятся во внешнем хранилище, текст — в базе. Модерация через /review_approve (раздел 15.2).
exports.up = async (knex) => {
  await knex.schema.createTable('user_reviews', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.specificType('review_type', 'review_type_enum').notNullable();
    table.text('text');
    table.text('file_url');
    // review_context: из какого экрана отправлен отзыв
    table.text('review_context');
    table.timestamp('uploaded_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.specificType('moderation_status', 'moderation_status_enum').notNullable().defaultTo('pending');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['moderation_status']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('user_reviews');
};
