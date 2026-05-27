require('dotenv').config();
const { Telegraf } = require('telegraf');
const path = require('path');
const fs = require('fs');

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v'];

async function main() {
  const folderArg = process.argv[2];
  if (!folderArg) {
    console.error('Использование: node scripts/upload_reviews_to_telegram.js <путь-к-папке>');
    process.exit(1);
  }

  const folderPath = path.resolve(folderArg);
  if (!fs.existsSync(folderPath)) {
    console.error(`Папка не найдена: ${folderPath}`);
    process.exit(1);
  }

  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error('Ошибка: BOT_TOKEN не задан в .env');
    process.exit(1);
  }

  const adminId = process.env.ADMIN_TELEGRAM_IDS?.split(',')[0]?.trim();
  if (!adminId) {
    console.error('Ошибка: ADMIN_TELEGRAM_IDS не задан в .env');
    process.exit(1);
  }

  const files = fs.readdirSync(folderPath)
    .filter((f) => VIDEO_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .sort();

  if (!files.length) {
    console.error(`В папке нет видеофайлов (.mp4, .mov, .m4v): ${folderPath}`);
    process.exit(1);
  }

  console.log(`Найдено видеофайлов: ${files.length}`);
  for (const f of files) {
    const sizeMb = (fs.statSync(path.join(folderPath, f)).size / 1024 / 1024).toFixed(1);
    console.log(`  ${f} (${sizeMb} МБ)`);
  }

  const bot = new Telegraf(token);
  const results = [];

  for (const filename of files) {
    const filePath = path.join(folderPath, filename);
    console.log(`\nЗагружаем ${filename}...`);
    const msg = await bot.telegram.sendVideo(adminId, { source: filePath });
    const telegram_file_id = msg.video.file_id;
    const title = path.basename(filename, path.extname(filename));
    console.log(`${filename} → ${telegram_file_id}`);
    results.push({ filename, telegram_file_id, title });
  }

  const tmpDir = path.join(__dirname, '../tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const outPath = path.join(tmpDir, 'reviews-file-ids.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log(`\nРезультат сохранён: ${outPath}`);
  console.log('\n--- Итог ---');
  for (const r of results) {
    console.log(`${r.filename} → ${r.telegram_file_id}`);
  }
  console.log('------------');
}

main().catch((err) => {
  console.error('Ошибка при загрузке:', err.message);
  process.exit(1);
});
