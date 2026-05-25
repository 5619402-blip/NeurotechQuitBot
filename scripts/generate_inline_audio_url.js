require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const BUCKET = 'neurotech-quit-test';
const KEY = 'Anti SmokingАУДИО.m4a';
const EXPIRES_IN = 3600;

const accessKey = process.env.YC_ACCESS_KEY;
const secretKey = process.env.YC_SECRET_KEY;

if (!accessKey || !secretKey) {
  console.error('Ошибка: YC_ACCESS_KEY и YC_SECRET_KEY не найдены в .env');
  console.error('');
  console.error('Получить ключи:');
  console.error('  Yandex Cloud → Сервисные аккаунты → Создать ключ → Статический ключ доступа');
  console.error('');
  console.error('Добавить в .env:');
  console.error('  YC_ACCESS_KEY=<идентификатор ключа>');
  console.error('  YC_SECRET_KEY=<секретный ключ>');
  process.exit(1);
}

const client = new S3Client({
  region: 'ru-central1',
  endpoint: 'https://storage.yandexcloud.net',
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretKey,
  },
});

async function main() {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: KEY,
    ResponseContentDisposition: 'inline',
    ResponseContentType: 'audio/mp4',
  });

  const url = await getSignedUrl(client, command, { expiresIn: EXPIRES_IN });

  console.log('Inline pre-signed URL (действительна 1 час):');
  console.log('');
  console.log(url);
  console.log('');
  console.log('Откройте ссылку в браузере — файл должен воспроизводиться, а не скачиваться.');
}

main().catch((err) => {
  console.error('Ошибка генерации ссылки:', err.message);
  process.exit(1);
});
