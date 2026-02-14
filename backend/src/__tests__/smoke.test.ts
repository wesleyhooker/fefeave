import { FastifyInstance } from 'fastify';
import { buildAppForTest } from './helpers';
import { getEnv } from '../config/env';

describe('Smoke tests', () => {
  let app: FastifyInstance;
  let restoreEnv: () => void;

  afterEach(async () => {
    if (restoreEnv) restoreEnv();
    if (app) await app.close();
  });

  it('GET {API_PREFIX}/health returns 200 and { status: "ok" }', async () => {
    const result = await buildAppForTest({ NODE_ENV: 'test', LOG_LEVEL: 'error' });
    app = result.app;
    restoreEnv = result.restoreEnv;
    const prefix = getEnv().API_PREFIX;
    const res = await app.inject({ method: 'GET', url: `${prefix}/health` });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload)).toEqual({ status: 'ok' });
  });

  it('With AUTH_MODE=off: GET {API_PREFIX}/users/me returns 401', async () => {
    const result = await buildAppForTest({
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      AUTH_MODE: 'off',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
    const prefix = getEnv().API_PREFIX;
    const res = await app.inject({ method: 'GET', url: `${prefix}/users/me` });
    expect(res.statusCode).toBe(401);
  });

  it('With AUTH_MODE=dev_bypass + required env: GET {API_PREFIX}/users/me returns 200 and includes id/email/roles', async () => {
    const result = await buildAppForTest({
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      AUTH_MODE: 'dev_bypass',
      AUTH_DEV_BYPASS_USER_ID: 'test-user-123',
      AUTH_DEV_BYPASS_EMAIL: 'test@example.com',
      AUTH_DEV_BYPASS_ROLE: 'ADMIN',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
    const prefix = getEnv().API_PREFIX;
    const res = await app.inject({ method: 'GET', url: `${prefix}/users/me` });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('id', 'test-user-123');
    expect(body).toHaveProperty('email', 'test@example.com');
    expect(body).toHaveProperty('roles');
    expect(Array.isArray(body.roles)).toBe(true);
    expect(body.roles).toContain('ADMIN');
  });

  it('With AUTH_MODE=dev_bypass and AUTH_DEV_BYPASS_ROLE=WHOLESALER: GET {API_PREFIX}/users/me returns 200 with WHOLESALER role', async () => {
    const result = await buildAppForTest({
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      AUTH_MODE: 'dev_bypass',
      AUTH_DEV_BYPASS_USER_ID: 'wholesaler-dev',
      AUTH_DEV_BYPASS_EMAIL: 'wholesaler@example.com',
      AUTH_DEV_BYPASS_ROLE: 'WHOLESALER',
    });
    app = result.app;
    restoreEnv = result.restoreEnv;
    const prefix = getEnv().API_PREFIX;
    const res = await app.inject({ method: 'GET', url: `${prefix}/users/me` });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body).toHaveProperty('roles');
    expect(body.roles).toContain('WHOLESALER');
  });
});
