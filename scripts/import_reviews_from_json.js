require('dotenv').config();
const path = require('path');
const fs = require('fs');
const db = require('../src/db/connection');

const JSON_PATH = path.join(__dirname, '../data/reviews/reviews-file-ids.json');

async function main() {
  if (!fs.existsSync(JSON_PATH)) {
    console.error(`Файл не найден: ${JSON_PATH}`);
    process.exit(1);
  }

  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  } catch (e) {
    console.error(`Ошибка чтения JSON: ${e.message}`);
    process.exit(1);
  }

  const uploaded = Array.isArray(raw) ? raw : raw.uploaded;
  if (!uploaded?.length) {
    console.error('Нет записей в uploaded');
    process.exit(1);
  }

  console.log(`Импортируем ${uploaded.length} отзывов в reviews...`);

  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < uploaded.length; i++) {
    const { filename, telegram_file_id, title } = uploaded[i];
    const sort_order = i + 1;

    const existing = await db('reviews').where({ telegram_file_id }).first();

    if (existing) {
      await db('reviews').where({ telegram_file_id }).update({
        title,
        client_name: title,
        description: 'Видеоотзыв',
        source: filename,
        sort_order,
        is_active: true,
      });
      console.log(`  [обновлено] ${filename}`);
      updated++;
    } else {
      await db('reviews').insert({
        review_type: 'video',
        title,
        client_name: title,
        description: 'Видеоотзыв',
        source: filename,
        telegram_file_id,
        sort_order,
        is_active: true,
      });
      console.log(`  [добавлено] ${filename}`);
      inserted++;
    }
  }

  console.log(`\nГотово. Добавлено: ${inserted}, обновлено: ${updated}`);
  await db.destroy();
}

main().catch((err) => {
  console.error('Ошибка импорта:', err.message);
  process.exit(1);
});
