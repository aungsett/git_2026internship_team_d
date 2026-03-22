/**
 * S3 helpers for resume storage.
 * Stores only object references in DB (key/bucket), never file binary content.
 */

const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const region = process.env.AWS_REGION;
const bucket = process.env.S3_BUCKET_NAME;
const keyPrefix = (process.env.S3_KEY_PREFIX || 'resumes').replace(/^\/+|\/+$/g, '');

if (!region) {
  // Fail fast during startup/runtime where S3 is required.
  // Throwing here keeps the error explicit and easier to diagnose.
  // eslint-disable-next-line no-console
  console.warn('AWS_REGION is not set. S3 resume upload/download will fail until configured.');
}

if (!bucket) {
  // eslint-disable-next-line no-console
  console.warn('S3_BUCKET_NAME is not set. S3 resume upload/download will fail until configured.');
}

const s3 = new S3Client({ region });

function sanitizeFileName(fileName) {
  return (fileName || 'resume')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .slice(-120);
}

function buildResumeKey({ userId, originalName }) {
  const date = new Date();
  const yyyy = String(date.getUTCFullYear());
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');
  const ts = Date.now();
  const safeName = sanitizeFileName(originalName);
  return `${keyPrefix}/${yyyy}/${mm}/${dd}/user-${userId}/${ts}-${safeName}`;
}

async function uploadResumeToS3({ userId, file }) {
  const key = buildResumeKey({ userId, originalName: file.originalname });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype || 'application/octet-stream',
    Metadata: {
      originalname: file.originalname || '',
    },
  });

  const result = await s3.send(command);
  return {
    key,
    bucket,
    etag: result.ETag || null,
  };
}

async function getResumeFromS3(key) {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const result = await s3.send(command);
  return {
    stream: result.Body,
    contentType: result.ContentType,
    contentLength: result.ContentLength,
  };
}

async function deleteResumeFromS3(key) {
  if (!key) return;
  const command = new DeleteObjectCommand({ Bucket: bucket, Key: key });
  await s3.send(command);
}

module.exports = {
  uploadResumeToS3,
  getResumeFromS3,
  deleteResumeFromS3,
};
