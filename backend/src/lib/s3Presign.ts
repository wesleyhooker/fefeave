import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getEnv } from '../config/env';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const PRESIGN_POST_EXPIRES_SECONDS = 900; // 15 min
const PRESIGN_GET_EXPIRES_SECONDS = 300; // 5 min

let cachedClient: S3Client | null = null;

function getS3Client(): S3Client {
  if (!cachedClient) {
    const env = getEnv();
    cachedClient = new S3Client({ region: env.AWS_REGION });
  }
  return cachedClient;
}

/**
 * Returns the attachments bucket name from env. Throws if not configured.
 */
export function getAttachmentsBucket(): string {
  const bucket = getEnv().S3_ATTACHMENTS_BUCKET;
  if (!bucket || !bucket.trim()) {
    throw new Error('S3_ATTACHMENTS_BUCKET is not configured');
  }
  return bucket.trim();
}

export interface PresignedPostResult {
  url: string;
  fields: Record<string, string>;
  key: string;
  expiresInSeconds: number;
}

/**
 * Generate a presigned POST for direct browser/client upload to S3.
 * Key must start with "attachments/". S3 policy enforces content-type and content-length-range.
 */
export async function createPresignedPostForUpload(
  key: string,
  contentType: string,
  maxSizeBytes: number = MAX_UPLOAD_BYTES,
  expiresInSeconds: number = PRESIGN_POST_EXPIRES_SECONDS
): Promise<PresignedPostResult> {
  if (!key.startsWith('attachments/')) {
    throw new Error('Key must start with attachments/');
  }
  const bucket = getAttachmentsBucket();
  const client = getS3Client();

  const conditions = [
    ['content-length-range', 0, maxSizeBytes],
    ['eq', '$Content-Type', contentType],
    ['eq', '$x-amz-server-side-encryption', 'AES256'],
  ];

  const { url, fields } = await createPresignedPost(client, {
    Bucket: bucket,
    Key: key,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- SDK Conditions type is not exported
    Conditions: conditions as any,
    Fields: {
      'Content-Type': contentType,
      'x-amz-server-side-encryption': 'AES256',
    },
    Expires: expiresInSeconds,
  });

  return {
    url,
    fields: fields as Record<string, string>,
    key,
    expiresInSeconds,
  };
}

export interface PresignedDownloadResult {
  downloadUrl: string;
  expiresInSeconds: number;
}

/**
 * Generate a presigned GET URL for downloading an object.
 * Key must start with "attachments/". Optional filename for Content-Disposition.
 */
export async function createPresignedDownloadUrl(
  key: string,
  expiresInSeconds: number = PRESIGN_GET_EXPIRES_SECONDS,
  filename?: string
): Promise<PresignedDownloadResult> {
  if (!key.startsWith('attachments/')) {
    throw new Error('Key must start with attachments/');
  }
  const bucket = getAttachmentsBucket();
  const client = getS3Client();

  const disposition =
    filename != null && filename !== ''
      ? `attachment; filename="${filename.replace(/"/g, '\\"')}"`
      : 'attachment';

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: disposition,
  });

  const downloadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

  return {
    downloadUrl,
    expiresInSeconds,
  };
}

export { MAX_UPLOAD_BYTES, PRESIGN_POST_EXPIRES_SECONDS, PRESIGN_GET_EXPIRES_SECONDS };
