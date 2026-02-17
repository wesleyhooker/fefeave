import { FastifyInstance } from 'fastify';
import { buildAppForTest } from './helpers';
import { getEnv } from '../config/env';

jest.mock('../lib/s3Presign', () => ({
  createPresignedPostForUpload: jest.fn().mockResolvedValue({
    url: 'https://s3.example.com/bucket',
    fields: { key: 'attachments/abc-123-file.pdf', 'Content-Type': 'application/pdf' },
    key: 'attachments/abc-123-file.pdf',
    expiresInSeconds: 900,
  }),
  createPresignedDownloadUrl: jest.fn().mockResolvedValue({
    downloadUrl: 'https://s3.example.com/bucket/attachments/abc-123-file.pdf?X-Amz-Signature=...',
    expiresInSeconds: 300,
  }),
  MAX_UPLOAD_BYTES: 10 * 1024 * 1024,
  PRESIGN_POST_EXPIRES_SECONDS: 900,
  PRESIGN_GET_EXPIRES_SECONDS: 300,
}));

describe('Uploads (Epic 2.1)', () => {
  let app: FastifyInstance;
  let restoreEnv: () => void;
  const prefix = () => getEnv().API_PREFIX;

  const authEnv = {
    NODE_ENV: 'test' as const,
    LOG_LEVEL: 'error' as const,
    AUTH_MODE: 'dev_bypass' as const,
    AUTH_DEV_BYPASS_USER_ID: 'test-user',
    AUTH_DEV_BYPASS_EMAIL: 'test@example.com',
    AUTH_DEV_BYPASS_ROLE: 'ADMIN' as const,
    S3_ATTACHMENTS_BUCKET: 'test-bucket',
  };

  afterEach(async () => {
    if (restoreEnv) restoreEnv();
    if (app) await app.close();
  });

  describe('POST /uploads/presign', () => {
    it('requires auth (401 without auth)', async () => {
      const result = await buildAppForTest({
        NODE_ENV: 'test',
        LOG_LEVEL: 'error',
        AUTH_MODE: 'off',
        S3_ATTACHMENTS_BUCKET: 'test-bucket',
      });
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/uploads/presign`,
        payload: { filename: 'x.pdf', contentType: 'application/pdf', sizeBytes: 100 },
      });
      expect(res.statusCode).toBe(401);
    });

    it('rejects invalid contentType with 400', async () => {
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/uploads/presign`,
        payload: {
          filename: 'x.pdf',
          contentType: 'application/octet-stream',
          sizeBytes: 100,
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects sizeBytes > 10MB with 400', async () => {
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/uploads/presign`,
        payload: {
          filename: 'big.pdf',
          contentType: 'application/pdf',
          sizeBytes: 10 * 1024 * 1024 + 1,
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('returns correct response shape with auth and valid body', async () => {
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/uploads/presign`,
        payload: {
          filename: 'invoice.pdf',
          contentType: 'application/pdf',
          sizeBytes: 1024,
        },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toHaveProperty('url');
      expect(typeof body.url).toBe('string');
      expect(body).toHaveProperty('fields');
      expect(body.fields).toBeDefined();
      expect(typeof body.fields).toBe('object');
      expect(body).toHaveProperty('key');
      expect(body.key).toMatch(/^attachments\/[0-9a-f-]+-invoice\.pdf$/);
      expect(body).toHaveProperty('expiresInSeconds');
      expect(body.expiresInSeconds).toBe(900);
    });
  });

  describe('GET /uploads/download/*', () => {
    it('requires auth (401 without auth)', async () => {
      const result = await buildAppForTest({
        NODE_ENV: 'test',
        LOG_LEVEL: 'error',
        AUTH_MODE: 'off',
        S3_ATTACHMENTS_BUCKET: 'test-bucket',
      });
      app = result.app;
      restoreEnv = result.restoreEnv;
      const key = encodeURIComponent('attachments/abc-123-file.pdf');
      const res = await app.inject({
        method: 'GET',
        url: `${prefix()}/uploads/download/${key}`,
      });
      expect(res.statusCode).toBe(401);
    });

    it('rejects key that does not start with attachments/ (400)', async () => {
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'GET',
        url: `${prefix()}/uploads/download/other/abc-123-file.pdf`,
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('returns correct response shape with auth and valid key', async () => {
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'GET',
        url: `${prefix()}/uploads/download/attachments/abc-123-invoice.pdf`,
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toHaveProperty('downloadUrl');
      expect(typeof body.downloadUrl).toBe('string');
      expect(body).toHaveProperty('expiresInSeconds');
      expect(body.expiresInSeconds).toBe(300);
    });
  });
});
