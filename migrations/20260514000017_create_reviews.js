// Миграция 017 — таблица reviews (витринные отзывы, раздел 18, docs/TZ_v4.md)
// Видео/аудио хранятся во внешнем хранилище. Текст — в базе (раздел 15).
exports.up = async (knex) => {
  await knex.schema.createTable('reviews', (table) => {
    table.bigIncrements('id').primary();
    table.specificType('review_type', 'review_type_enum').notNullable();
    table.text('title');
    table.text('client_name');
    table.text('description');
    table.text('file_url');
    table.text('preview_image_url');
    // source: '2gis', 'telegram', 'manual' и т.д.
    table.text('source');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.integer('sort_order').notNullable().defaultTo(0);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['is_active', 'sort_order']);
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('reviews');
};
