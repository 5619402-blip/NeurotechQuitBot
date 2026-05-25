// Миграция 004 — таблица audio_files (раздел 18, docs/TZ_v4.md)
exports.up = async (knex) => {
  await knex.schema.createTable('audio_files', (table) => {
    table.bigIncrements('id').primary();
    table.bigInteger('procedure_id').notNullable().references('id').inTable('procedures').onDelete('RESTRICT');
    table.text('file_name').notNullable();
    table.text('storage_provider').notNullable();
    table.text('storage_path').notNullable();
    table.decimal('file_size_mb', 8, 2);
    // duration_seconds нужен для расчёта таймаута callback (раздел 8.4: duration_seconds + 30 мин)
    table.integer('duration_seconds');
    table.text('audio_format');
    table.integer('channels');
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists('audio_files');
};
