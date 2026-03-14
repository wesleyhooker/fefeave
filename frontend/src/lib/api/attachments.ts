/**
 * Attachment upload and linking APIs.
 * Uses: presign -> client uploads to S3 -> create attachment record -> link to entity.
 */

import { backendGetJson } from './backend';

const ALLOWED_TYPES = ['application/pdf', 'image/png', 'image/jpeg'] as const;

export type AllowedAttachmentContentType = (typeof ALLOWED_TYPES)[number];

export function isAllowedContentType(
  type: string,
): type is AllowedAttachmentContentType {
  return ALLOWED_TYPES.includes(type as AllowedAttachmentContentType);
}

export interface PresignResult {
  url: string;
  fields: Record<string, string>;
  key: string;
  expiresInSeconds: number;
}

export interface CreateAttachmentResult {
  id: string;
  key: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

/** Get presigned POST URL for S3 upload. */
export async function getPresignUpload(params: {
  filename: string;
  contentType: AllowedAttachmentContentType;
  sizeBytes: number;
}): Promise<PresignResult> {
  return backendGetJson<PresignResult>('/uploads/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

/** Create attachment record after client has uploaded to S3. */
export async function createAttachmentRecord(params: {
  key: string;
  originalFilename: string;
  contentType: string;
  sizeBytes: number;
}): Promise<CreateAttachmentResult> {
  return backendGetJson<CreateAttachmentResult>('/attachments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

/** Link an attachment to a payment. */
export async function linkAttachmentToPayment(
  paymentId: string,
  attachmentId: string,
): Promise<{ paymentId: string; attachmentId: string }> {
  return backendGetJson<{ paymentId: string; attachmentId: string }>(
    `/payments/${encodeURIComponent(paymentId)}/attachments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachmentId }),
    },
  );
}

export interface ShowAttachmentItem {
  id: string;
  key: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
}

/** List attachments linked to a show. */
export async function fetchShowAttachments(
  showId: string,
): Promise<ShowAttachmentItem[]> {
  return backendGetJson<ShowAttachmentItem[]>(
    `/shows/${encodeURIComponent(showId)}/attachments`,
  );
}

/** Link an attachment to a show. */
export async function linkAttachmentToShow(
  showId: string,
  attachmentId: string,
): Promise<{ showId: string; attachmentId: string }> {
  return backendGetJson<{ showId: string; attachmentId: string }>(
    `/shows/${encodeURIComponent(showId)}/attachments`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachmentId }),
    },
  );
}

/** Get presigned download URL for an attachment (opens in new tab). */
export async function getAttachmentDownloadUrl(
  attachmentId: string,
): Promise<{ downloadUrl: string; expiresInSeconds: number }> {
  return backendGetJson<{ downloadUrl: string; expiresInSeconds: number }>(
    `/attachments/${encodeURIComponent(attachmentId)}/download`,
  );
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function getMaxUploadBytes(): number {
  return MAX_SIZE_BYTES;
}

/**
 * Upload a file: presign -> POST to S3 -> create attachment record.
 * Returns the attachment id for linking.
 */
export async function uploadFile(file: File): Promise<string> {
  const contentType = file.type as string;
  if (!isAllowedContentType(contentType)) {
    throw new Error(
      `File type not allowed. Use PDF or image (PNG/JPEG). Got: ${contentType}`,
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    throw new Error(`File too large. Max ${MAX_SIZE_BYTES / 1024 / 1024} MB.`);
  }
  if (file.size === 0) {
    throw new Error('File is empty.');
  }

  const { url, fields, key } = await getPresignUpload({
    filename: file.name,
    contentType,
    sizeBytes: file.size,
  });

  const formData = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    formData.append(k, v);
  }
  formData.append('file', file);

  const uploadRes = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  if (!uploadRes.ok) {
    throw new Error(
      `Upload failed: ${uploadRes.status} ${uploadRes.statusText}`,
    );
  }

  const attachment = await createAttachmentRecord({
    key,
    originalFilename: file.name,
    contentType,
    sizeBytes: file.size,
  });
  return attachment.id;
}
