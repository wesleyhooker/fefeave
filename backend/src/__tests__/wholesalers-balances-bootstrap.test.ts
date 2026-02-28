import { FastifyInstance } from 'fastify';
import { buildAppForTest } from './helpers';

const mockPool = {
  query: jest.fn(),
};

jest.mock('../db', () => ({
  getPool: jest.fn(() => mockPool),
  withTx: jest.fn(),
}));

describe('GET /wholesalers/balances bootstrap behavior', () => {
  let app: FastifyInstance;
  let restoreEnv: () => void;

  beforeEach(() => {
    jest.clearAllMocks();
    mockPool.query.mockReset();
  });

  afterEach(async () => {
    if (restoreEnv) restoreEnv();
    if (app) await app.close();
  });

  it('returns 200 [] when schema tables are not present yet', async () => {
    const err = new Error('relation "wholesalers" does not exist') as Error & { code?: string };
    err.code = '42P01';
    mockPool.query.mockRejectedValueOnce(err);

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

    const response = await app.inject({
      method: 'GET',
      url: '/api/wholesalers/balances',
    });

    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual([]);
  });
});
