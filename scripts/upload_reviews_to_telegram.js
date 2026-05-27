require('dotenv').config();
const { Telegraf } = require('telegraf');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.m4v'];

function getVideoMeta(filePath) {
  try {
    const out = execSync(
      `ffprobe -v quiet -print_format json -show_streams -show_format "${filePath}"`,
      { timeout: 15000 }
    ).toString();
    const data = JSON.parse(out);
    const videoStream = (data.streams || []).find((s) => s.codec_type === 'video');
    const duration = Math.round(parseFloat(data.format?.duration ?? '0'));
    return {
      width: videoStream?.width ?? undefined,
      height: videoStream?.height ?? undefined,
      duration: duration || undefined,
    };
  } catch {
    console.warn('  ffprobe недоступен или ошибка — отправляем без размеров');
    return {};
  }
}

function readExistingJson(outPath) {
  if (!fs.existsSync(outPath)) return { uploaded: [], errors: [] };
  try {
    const raw = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    return {
      uploaded: Array.isArray(raw.uploaded) ? raw.uploaded : [],
      errors: Array.isArray(raw.errors) ? raw.errors : [],
    };
  } catch {
    return { uploaded: [], errors: [] };
  }
}

async function main() {
  const inputArg = process.argv[2];
  if (!inputArg) {
    console.error('Использование: node scripts/upload_reviews_to_telegram.js <путь-к-файлу-или-папке>');
    process.exit(1);
  }

  const inputPath = path.resolve(inputArg);
  if (!fs.existsSync(inputPath)) {
    console.error(`Путь не найден: ${inputPath}`);
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

  const stat = fs.statSync(inputPath);
  let filesToUpload;
  let appendMode;

  if (stat.isFile()) {
    const ext = path.extname(inputPath).toLowerCase();
    if (!VIDEO_EXTENSIONS.includes(ext)) {
      console.error(`Неподдерживаемый формат: ${ext}. Допустимы: .mp4, .mov, .m4v`);
      process.exit(1);
    }
    const filename = path.basename(inputPath);
    const sizeMb = (stat.size / 1024 / 1024).toFixed(1);
    console.log(`Файл: ${filename} (${sizeMb} МБ)`);
    filesToUpload = [{ filename, filePath: inputPath }];
    appendMode = true;
  } else {
    const files = fs.readdirSync(inputPath)
      .filter((f) => VIDEO_EXTENSIONS.includes(path.extname(f).toLowerCase()))
      .sort();

    if (!files.length) {
      console.error(`В папке нет видеофайлов (.mp4, .mov, .m4v): ${inputPath}`);
      process.exit(1);
    }

    console.log(`Найдено видеофайлов: ${files.length}`);
    for (const f of files) {
      const sizeMb = (fs.statSync(path.join(inputPath, f)).size / 1024 / 1024).toFixed(1);
      console.log(`  ${f} (${sizeMb} МБ)`);
    }

    filesToUpload = files.map((f) => ({ filename: f, filePath: path.join(inputPath, f) }));
    appendMode = false;
  }

  const tmpDir = path.join(__dirname, '../tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }
  const outPath = path.join(tmpDir, 'reviews-file-ids.json');

  const base = appendMode ? readExistingJson(outPath) : { uploaded: [], errors: [] };
  const uploaded = base.uploaded;
  const errors = base.errors;

  const bot = new Telegraf(token);

  function saveProgress() {
    fs.writeFileSync(outPath, JSON.stringify({ uploaded, errors }, null, 2));
  }

  for (const { filename, filePath } of filesToUpload) {
    console.log(`\nЗагружаем ${filename}...`);
    try {
      const meta = getVideoMeta(filePath);
      if (meta.width && meta.height) {
        console.log(`  ${meta.width}×${meta.height}, ${meta.duration ?? '?'}с`);
      }
      const msg = await bot.telegram.sendVideo(adminId, { source: filePath }, {
        width: meta.width,
        height: meta.height,
        duration: meta.duration,
        supports_streaming: true,
      });
      const telegram_file_id = msg.video.file_id;
      const title = path.basename(filename, path.extname(filename));
      console.log(`${filename} → ${telegram_file_id}`);
      uploaded.push({ filename, telegram_file_id, title });
    } catch (err) {
      console.error(`Ошибка при загрузке ${filename}: ${err.message}`);
      errors.push({ filename, error: err.message });
    }
    saveProgress();
  }

  console.log(`\nРезультат сохранён: ${outPath}`);
  console.log('\n--- Итог ---');
  for (const r of uploaded) {
    console.log(`${r.filename} → ${r.telegram_file_id}`);
  }
  if (errors.length) {
    console.log('\n--- Ошибки ---');
    for (const e of errors) {
      console.log(`${e.filename}: ${e.error}`);
    }
  }
  console.log('------------');
}

main().catch((err) => {
  console.error('Ошибка при загрузке:', err.message);
  process.exit(1);
});
