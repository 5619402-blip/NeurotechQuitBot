const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const config = require('../config');

const PRESIGN_TTL = 2 * 60 * 60; // 2 часа

function buildS3Client() {
  return new S3Client({
    region: 'ru-central1',
    endpoint: 'https://storage.yandexcloud.net',
    credentials: {
      accessKeyId: config.storage.accessKey,
      secretAccessKey: config.storage.secretKey,
    },
  });
}

async function generatePresignedUrl(storagePath) {
  const bucket = config.storage.bucket;
  if (!bucket) throw new Error('STORAGE_BUCKET не задан');

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: storagePath,
    ResponseContentDisposition: 'inline',
    ResponseContentType: 'audio/mp4',
  });

  return getSignedUrl(buildS3Client(), command, { expiresIn: PRESIGN_TTL });
}

module.exports = { generatePresignedUrl };
