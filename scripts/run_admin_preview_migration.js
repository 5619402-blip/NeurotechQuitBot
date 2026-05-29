// Применяет только миграцию 20260529000026_create_admin_preview_tokens.
// Если таблица уже есть — ничего не делает.
// Не запускает другие миграции.
require('dotenv').config();
const knex = require('knex');
const knexConfig = require('../knexfile.js');
const migration = require('../migrations/20260529000026_create_admin_preview_tokens.js');

const TABLE_NAME    = 'admin_preview_tokens';
const MIGRATION_NAME = '20260529000026_create_admin_preview_tokens.js';

async function run() {
  const db = knex(knexConfig);

  try {
    // 1. Проверить, существует ли таблица
    const exists = await db.schema.hasTable(TABLE_NAME);
    if (exists) {
      console.log('Таблица ' + TABLE_NAME + ' уже существует. Миграция уже применена. Ничего не делаем.');
      return;
    }

    // 2. Создать таблицу через migration.up
    console.log('Создаём таблицу ' + TABLE_NAME + '...');
    await migration.up(db);
    console.log('Таблица ' + TABLE_NAME + ' успешно создана.');

    // 3. Зарегистрировать в knex_migrations, чтобы повторный knex migrate:latest не упал
    const hasMigrationsTable = await db.schema.hasTable('knex_migrations');
    if (hasMigrationsTable) {
      const maxBatchRow = await db('knex_migrations').max('batch as max').first();
      const nextBatch = (maxBatchRow?.max || 0) + 1;
      await db('knex_migrations').insert({
        name: MIGRATION_NAME,
        batch: nextBatch,
        migration_time: new Date(),
      });
      console.log('Миграция зарегистрирована в knex_migrations (batch=' + nextBatch + ').');
    }

    console.log('\nГотово. Можно запускать бота и использовать /admin_preview.');

  } finally {
    await db.destroy();
  }
}

run().catch((err) => {
  console.error('[run_admin_preview_migration] Ошибка:', err.message);
  process.exit(1);
});
