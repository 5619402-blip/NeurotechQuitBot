// Одноразовый скрипт: отправляет ТОЛЬКО новый rules-ролик администратору и выводит file_id.
// Не вызывает bot.launch(), не запускает polling, не меняет production-код и .env.
//
// Запуск: node scripts/upload_new_rules_video.js
require('dotenv').config();
const { Telegraf } = require('telegraf');
const path = require('path');
const fs = require('fs');

const NEW_RULES_PATH = path.join(__dirname, '../media/rules_neurotech_quit_new_h264.mp4');
const ADMIN_ID = '7185030567';

async function main() {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    console.error('Ошибка: BOT_TOKEN не задан в .env');
    process.exit(1);
  }

  if (!fs.existsSync(NEW_RULES_PATH)) {
    console.error('Ошибка: файл не найден:', NEW_RULES_PATH);
    console.error('Убедитесь, что media/rules_neurotech_quit_new_h264.mp4 присутствует в репозитории.');
    process.exit(1);
  }

  const sizeMb = (fs.statSync(NEW_RULES_PATH).size / 1024 / 1024).toFixed(1);
  console.log('Файл: rules_neurotech_quit_new_h264.mp4 (' + sizeMb + ' МБ)');
  console.log('Отправляю администратору ' + ADMIN_ID + '...');

  const bot = new Telegraf(token);
  const msg = await bot.telegram.sendVideo(ADMIN_ID, { source: NEW_RULES_PATH });
  const fileId = msg.video.file_id;

  console.log('\n--- Новый RULES_VIDEO_FILE_ID ---');
  console.log('RULES_VIDEO_FILE_ID=' + fileId);
  console.log('---------------------------------');
  console.log('\nДобавь это значение в .env на Bothost и локально.');
  console.log('Затем обнови RULES_VIDEO_FILE_ID в src/config/media.js вручную после подтверждения.');
}

main().catch(err => {
  console.error('Ошибка при загрузке:', err.message);
  process.exit(1);
});
