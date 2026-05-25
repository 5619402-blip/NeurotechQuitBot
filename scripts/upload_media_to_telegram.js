/**
 * Одноразовый скрипт: загружает intro-видео и rules-видео в Telegram,
 * выводит file_id для вставки в .env.
 *
 * Запуск: node scripts/upload_media_to_telegram.js
 *
 * Требования:
 *   - BOT_TOKEN и ADMIN_TELEGRAM_IDS заданы в .env
 *   - Видеофайлы присутствуют в media/
 *
 * Скрипт использует только sendVideo (исходящий запрос) и не вызывает
 * bot.launch() или getUpdates. Можно запускать при работающем боте на сервере.
 */

require('dotenv').config();
const { Telegraf } = require('telegraf');
const path = require('path');
const fs = require('fs');

const INTRO_VIDEO_PATH = path.join(__dirname, '../media/intro_neurotech_quit_h264.mp4');
const RULES_VIDEO_PATH = path.join(__dirname, '../media/rules_neurotech_quit_h264.mp4');

async function main() {
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

  for (const [name, filePath] of [
    ['intro_neurotech_quit_h264.mp4', INTRO_VIDEO_PATH],
    ['rules_neurotech_quit_h264.mp4', RULES_VIDEO_PATH],
  ]) {
    if (!fs.existsSync(filePath)) {
      console.error(`Ошибка: файл не найден: ${filePath}`);
      console.error('Убедитесь, что MP4-файлы есть в папке media/');
      process.exit(1);
    }
    const sizeMb = (fs.statSync(filePath).size / 1024 / 1024).toFixed(1);
    console.log(`Найден ${name} (${sizeMb} МБ)`);
  }

  const bot = new Telegraf(token);

  console.log('\nЗагружаем intro-видео в Telegram...');
  const introMsg = await bot.telegram.sendVideo(adminId, { source: INTRO_VIDEO_PATH });
  const introFileId = introMsg.video.file_id;
  console.log('Загрузка intro-видео завершена.');

  console.log('Загружаем rules-видео в Telegram...');
  const rulesMsg = await bot.telegram.sendVideo(adminId, { source: RULES_VIDEO_PATH });
  const rulesFileId = rulesMsg.video.file_id;
  console.log('Загрузка rules-видео завершена.');

  console.log('\n--- Добавь в .env (локальный и Bothost) ---');
  console.log(`INTRO_VIDEO_FILE_ID=${introFileId}`);
  console.log(`RULES_VIDEO_FILE_ID=${rulesFileId}`);
  console.log('-------------------------------------------');
}

main().catch((err) => {
  console.error('Ошибка при загрузке:', err.message);
  process.exit(1);
});
