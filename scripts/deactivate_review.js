require('dotenv').config();
const db = require('../src/db/connection');

async function main() {
  const source = process.argv[2];
  if (!source) {
    console.error('Использование: node scripts/deactivate_review.js <filename>');
    process.exit(1);
  }
  const count = await db('reviews').where({ source }).update({ is_active: false });
  if (count) {
    console.log(`Деактивировано записей: ${count} (source = ${source})`);
  } else {
    console.log(`Запись не найдена (source = ${source})`);
  }
  await db.destroy();
}

main().catch((err) => {
  console.error('Ошибка:', err.message);
  process.exit(1);
});
