import { FastifyInstance } from 'fastify';
import { buildAppForTest } from './helpers';

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

describe('DELETE /shows/:showId/settlements/:settlementId', () => {
  let app: FastifyInstance;
  let restoreEnv: () => void;
  const prefix = '/api';

  const showId = '00000000-0000-0000-0000-000000000010';
  const otherShowId = '00000000-0000-0000-0000-000000000011';
  const settlementId = '00000000-0000-0000-0000-000000000020';

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockReset();
    mockPool.query.mockReset();
  });

  afterEach(async () => {
    if (restoreEnv) restoreEnv();
    if (app) await app.close();
  });

  it('soft-deletes settlement and GET settlements no longer returns it', async () => {
    mockPool.query
      .mockResolvedValueOnce({
        rows: [
          {
            id: settlementId,
            show_id: showId,
            calculation_method: 'MANUAL',
            deleted_at: null,
          },
        ],
      })
      .mockResolvedValueOnce({ rowCount: 1, rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: showId }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await buildAppForTest({
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      AUTH_MODE: 'dev_bypass',
      AUTH_DEV_BYPASS_USER_ID: 'test-admin',
      AUTH_DEV_BYPASS_EMAIL: 'admin@test.example.com',
      AUTH_DEV_BYPASS_ROLE: 'ADMIN',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;

    const delRes = await app.inject({
      method: 'DELETE',
      url: `${prefix}/shows/${showId}/settlements/${settlementId}`,
    });
    expect(delRes.statusCode).toBe(200);
    expect(JSON.parse(delRes.payload)).toEqual({ ok: true });

    const listRes = await app.inject({
      method: 'GET',
      url: `${prefix}/shows/${showId}/settlements`,
    });
    expect(listRes.statusCode).toBe(200);
    expect(JSON.parse(listRes.payload)).toEqual([]);
  });

  it('returns 404 when settlement belongs to another show', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        {
          id: settlementId,
          show_id: showId,
          calculation_method: 'PERCENT_PAYOUT',
          deleted_at: null,
        },
      ],
    });

    const result = await buildAppForTest({
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      AUTH_MODE: 'dev_bypass',
      AUTH_DEV_BYPASS_USER_ID: 'test-admin',
      AUTH_DEV_BYPASS_EMAIL: 'admin@test.example.com',
      AUTH_DEV_BYPASS_ROLE: 'ADMIN',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;

    const delRes = await app.inject({
      method: 'DELETE',
      url: `${prefix}/shows/${otherShowId}/settlements/${settlementId}`,
    });
    expect(delRes.statusCode).toBe(404);
  });

  it('requires auth/role (401 and 403)', async () => {
    const unauthResult = await buildAppForTest({
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      AUTH_MODE: 'off',
    });
    app = unauthResult.app;
    restoreEnv = unauthResult.restoreEnv;

    const unauthRes = await app.inject({
      method: 'DELETE',
      url: `${prefix}/shows/${showId}/settlements/${settlementId}`,
    });
    expect(unauthRes.statusCode).toBe(401);

    await app.close();
    restoreEnv();

    const forbiddenResult = await buildAppForTest({
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      AUTH_MODE: 'dev_bypass',
      AUTH_DEV_BYPASS_USER_ID: 'test-wholesaler',
      AUTH_DEV_BYPASS_EMAIL: 'wholesaler@test.example.com',
      AUTH_DEV_BYPASS_ROLE: 'WHOLESALER',
    });
    app = forbiddenResult.app;
    restoreEnv = forbiddenResult.restoreEnv;

    const forbiddenRes = await app.inject({
      method: 'DELETE',
      url: `${prefix}/shows/${showId}/settlements/${settlementId}`,
    });
    expect(forbiddenRes.statusCode).toBe(403);
  });
});
