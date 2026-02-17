/**
 * Unit tests for Epic 2.2 attachment linking (create, link, list, delete, download).
 * Mocks DB and S3 presign so no real DB/S3 required.
 */
import { FastifyInstance } from 'fastify';
import { buildAppForTest } from './helpers';
import { getEnv } from '../config/env';

const mockClient = {
  query: jest.fn(),
  release: jest.fn(),
};
const mockPool = {
  connect: jest.fn().mockResolvedValue(mockClient),
  query: jest.fn(),
};

jest.mock('../db', () => ({
  getPool: jest.fn(() => mockPool),
  withTx: jest.fn((fn: (c: typeof mockClient) => Promise<unknown>) => fn(mockClient)),
}));

jest.mock('../lib/s3Presign', () => ({
  createPresignedPostForUpload: jest.fn().mockResolvedValue({ url: '', fields: {}, key: '', expiresInSeconds: 900 }),
  createPresignedDownloadUrl: jest.fn().mockResolvedValue({
    downloadUrl: 'https://s3.example.com/presigned',
    expiresInSeconds: 300,
  }),
  MAX_UPLOAD_BYTES: 10 * 1024 * 1024,
  PRESIGN_POST_EXPIRES_SECONDS: 900,
  PRESIGN_GET_EXPIRES_SECONDS: 300,
}));

describe('Attachment linking (Epic 2.2)', () => {
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

  const validAttachmentId = '00000000-0000-0000-0000-000000000002';

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockReset();
    mockPool.query.mockReset();
  });

  afterEach(async () => {
    if (restoreEnv) restoreEnv();
    if (app) await app.close();
  });

  describe('POST /attachments', () => {
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
        url: `${prefix()}/attachments`,
        payload: {
          key: 'attachments/uuid-file.pdf',
          originalFilename: 'file.pdf',
          contentType: 'application/pdf',
          sizeBytes: 100,
        },
      });
      expect(res.statusCode).toBe(401);
    });

    it('rejects key not starting with attachments/ (400)', async () => {
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/attachments`,
        payload: {
          key: 'other/uuid-file.pdf',
          originalFilename: 'file.pdf',
          contentType: 'application/pdf',
          sizeBytes: 100,
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid contentType (400)', async () => {
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/attachments`,
        payload: {
          key: 'attachments/uuid-file.bin',
          originalFilename: 'file.bin',
          contentType: 'application/octet-stream',
          sizeBytes: 100,
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('rejects sizeBytes > 10MB (400)', async () => {
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/attachments`,
        payload: {
          key: 'attachments/uuid-file.pdf',
          originalFilename: 'file.pdf',
          contentType: 'application/pdf',
          sizeBytes: 10 * 1024 * 1024 + 1,
        },
      });
      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('VALIDATION_ERROR');
    });

    it('returns attachment object with correct shape when created', async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'att-123',
              s3_key: 'attachments/abc-file.pdf',
              original_filename: 'file.pdf',
              content_type: 'application/pdf',
              size_bytes: '1024',
              created_at: new Date('2025-01-01T00:00:00Z'),
            },
          ],
        });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/attachments`,
        payload: {
          key: 'attachments/abc-file.pdf',
          originalFilename: 'file.pdf',
          contentType: 'application/pdf',
          sizeBytes: 1024,
        },
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toMatchObject({
        id: 'att-123',
        key: 'attachments/abc-file.pdf',
        originalFilename: 'file.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1024,
      });
      expect(body.createdAt).toBeDefined();
    });
  });

  describe('GET /attachments/:attachmentId/download', () => {
    it('returns 404 when attachment not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'GET',
        url: `${prefix()}/attachments/00000000-0000-0000-0000-000000000001/download`,
      });
      expect(res.statusCode).toBe(404);
      const body = JSON.parse(res.payload);
      expect(body.code).toBe('NOT_FOUND');
    });

    it('returns downloadUrl and expiresInSeconds when attachment exists', async () => {
      mockPool.query.mockResolvedValue({
        rows: [
          {
            id: validAttachmentId,
            s3_key: 'attachments/abc-file.pdf',
            original_filename: 'file.pdf',
          },
        ],
      });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'GET',
        url: `${prefix()}/attachments/${validAttachmentId}/download`,
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toHaveProperty('downloadUrl');
      expect(body).toHaveProperty('expiresInSeconds', 300);
    });
  });

  describe('DELETE /attachments/:attachmentId', () => {
    it('returns 404 when attachment not found', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 0 });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'DELETE',
        url: `${prefix()}/attachments/00000000-0000-0000-0000-000000000001`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 204 and soft-deletes when attachment exists', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 1 });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'DELETE',
        url: `${prefix()}/attachments/${validAttachmentId}`,
      });
      expect(res.statusCode).toBe(204);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('deleted_at'),
        expect.any(Array)
      );
    });
  });

  describe('POST /shows/:showId/attachments', () => {
    it('returns 404 when show does not exist', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/shows/00000000-0000-0000-0000-000000000001/attachments`,
        payload: { attachmentId: '00000000-0000-0000-0000-000000000002' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 404 when attachment does not exist', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'show-1' }] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/shows/00000000-0000-0000-0000-000000000001/attachments`,
        payload: { attachmentId: '00000000-0000-0000-0000-000000000002' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 201 with linked attachment summary when show and attachment exist', async () => {
      const showId = '00000000-0000-0000-0000-000000000001';
      const attachmentId = '00000000-0000-0000-0000-000000000002';
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: showId }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: attachmentId,
              s3_key: 'attachments/abc-file.pdf',
              original_filename: 'file.pdf',
              content_type: 'application/pdf',
              size_bytes: '1024',
              created_at: new Date('2025-01-01T00:00:00Z'),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/shows/${showId}/attachments`,
        payload: { attachmentId },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body).toMatchObject({
        showId,
        attachmentId,
        id: attachmentId,
        key: 'attachments/abc-file.pdf',
        originalFilename: 'file.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1024,
      });
      expect(body.createdAt).toBeDefined();
    });
  });

  describe('GET /shows/:showId/attachments', () => {
    it('returns 404 when show does not exist', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'GET',
        url: `${prefix()}/shows/00000000-0000-0000-0000-000000000001/attachments`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns empty list when show has no attachments', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'show-1' }] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'GET',
        url: `${prefix()}/shows/00000000-0000-0000-0000-000000000001/attachments`,
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    });

    it('returns list of attachments excluding deleted', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'show-1' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'att-1',
              s3_key: 'attachments/a-file.pdf',
              original_filename: 'file.pdf',
              content_type: 'application/pdf',
              size_bytes: '100',
              created_at: new Date('2025-01-01T00:00:00Z'),
            },
          ],
        });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'GET',
        url: `${prefix()}/shows/00000000-0000-0000-0000-000000000001/attachments`,
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({
        id: 'att-1',
        key: 'attachments/a-file.pdf',
        filename: 'file.pdf',
        contentType: 'application/pdf',
        sizeBytes: 100,
      });
      expect(body[0].createdAt).toBeDefined();
    });
  });

  describe('POST /settlements/:settlementId/attachments', () => {
    it('returns 404 when settlement does not exist', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/settlements/00000000-0000-0000-0000-000000000001/attachments`,
        payload: { attachmentId: '00000000-0000-0000-0000-000000000002' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 404 when attachment does not exist', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'settlement-1' }] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/settlements/00000000-0000-0000-0000-000000000001/attachments`,
        payload: { attachmentId: '00000000-0000-0000-0000-000000000002' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 201 with linked attachment summary when settlement and attachment exist', async () => {
      const settlementId = '00000000-0000-0000-0000-000000000001';
      const attachmentId = '00000000-0000-0000-0000-000000000002';
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: settlementId }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: attachmentId,
              s3_key: 'attachments/receipt.pdf',
              original_filename: 'receipt.pdf',
              content_type: 'application/pdf',
              size_bytes: '2048',
              created_at: new Date('2025-01-01T00:00:00Z'),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/settlements/${settlementId}/attachments`,
        payload: { attachmentId },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body).toMatchObject({
        settlementId,
        attachmentId,
        id: attachmentId,
        key: 'attachments/receipt.pdf',
        originalFilename: 'receipt.pdf',
        contentType: 'application/pdf',
        sizeBytes: 2048,
      });
      expect(body.createdAt).toBeDefined();
    });
  });

  describe('GET /settlements/:settlementId/attachments', () => {
    it('returns 404 when settlement does not exist', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'GET',
        url: `${prefix()}/settlements/00000000-0000-0000-0000-000000000001/attachments`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns empty list when settlement has no attachments', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'settlement-1' }] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'GET',
        url: `${prefix()}/settlements/00000000-0000-0000-0000-000000000001/attachments`,
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    });

    it('returns list of attachments excluding deleted', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'settlement-1' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'att-1',
              s3_key: 'attachments/settlement-doc.pdf',
              original_filename: 'settlement-doc.pdf',
              content_type: 'application/pdf',
              size_bytes: '500',
              created_at: new Date('2025-01-01T00:00:00Z'),
            },
          ],
        });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'GET',
        url: `${prefix()}/settlements/00000000-0000-0000-0000-000000000001/attachments`,
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({
        id: 'att-1',
        key: 'attachments/settlement-doc.pdf',
        filename: 'settlement-doc.pdf',
        contentType: 'application/pdf',
        sizeBytes: 500,
      });
      expect(body[0].createdAt).toBeDefined();
    });
  });

  describe('POST /payments/:paymentId/attachments', () => {
    it('returns 404 when payment does not exist', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/payments/00000000-0000-0000-0000-000000000001/attachments`,
        payload: { attachmentId: '00000000-0000-0000-0000-000000000002' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 404 when attachment does not exist', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'payment-1' }] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/payments/00000000-0000-0000-0000-000000000001/attachments`,
        payload: { attachmentId: '00000000-0000-0000-0000-000000000002' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 201 with linked attachment summary when payment and attachment exist', async () => {
      const paymentId = '00000000-0000-0000-0000-000000000001';
      const attachmentId = '00000000-0000-0000-0000-000000000002';
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: paymentId }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: attachmentId,
              s3_key: 'attachments/check-image.png',
              original_filename: 'check-image.png',
              content_type: 'image/png',
              size_bytes: '1024',
              created_at: new Date('2025-01-01T00:00:00Z'),
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'POST',
        url: `${prefix()}/payments/${paymentId}/attachments`,
        payload: { attachmentId },
      });
      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.payload);
      expect(body).toMatchObject({
        paymentId,
        attachmentId,
        id: attachmentId,
        key: 'attachments/check-image.png',
        originalFilename: 'check-image.png',
        contentType: 'image/png',
        sizeBytes: 1024,
      });
      expect(body.createdAt).toBeDefined();
    });
  });

  describe('GET /payments/:paymentId/attachments', () => {
    it('returns 404 when payment does not exist', async () => {
      mockPool.query.mockResolvedValue({ rows: [] });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'GET',
        url: `${prefix()}/payments/00000000-0000-0000-0000-000000000001/attachments`,
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns empty list when payment has no attachments', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'payment-1' }] })
        .mockResolvedValueOnce({ rows: [] });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'GET',
        url: `${prefix()}/payments/00000000-0000-0000-0000-000000000001/attachments`,
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    });

    it('returns list of attachments excluding deleted', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'payment-1' }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'att-1',
              s3_key: 'attachments/payment-receipt.pdf',
              original_filename: 'payment-receipt.pdf',
              content_type: 'application/pdf',
              size_bytes: '300',
              created_at: new Date('2025-01-01T00:00:00Z'),
            },
          ],
        });
      const result = await buildAppForTest(authEnv);
      app = result.app;
      restoreEnv = result.restoreEnv;
      const res = await app.inject({
        method: 'GET',
        url: `${prefix()}/payments/00000000-0000-0000-0000-000000000001/attachments`,
      });
      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body).toHaveLength(1);
      expect(body[0]).toMatchObject({
        id: 'att-1',
        key: 'attachments/payment-receipt.pdf',
        filename: 'payment-receipt.pdf',
        contentType: 'application/pdf',
        sizeBytes: 300,
      });
      expect(body[0].createdAt).toBeDefined();
    });
  });
});
