import { FastifyInstance } from 'fastify';
import { buildAppForTest } from './helpers';
import { getEnv } from '../config/env';

describe('Smoke tests', () => {
  let app: FastifyInstance;

  afterEach(async () => {
    if (app) await app.close();
  });

  it('GET {API_PREFIX}/health returns 200 and { status: "ok" }', async () => {
    app = await buildAppForTest({ NODE_ENV: 'test', LOG_LEVEL: 'error' });
    const prefix = getEnv().API_PREFIX;
    const res = await app.inject({ method: 'GET', url: `${prefix}/health` });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.payload)).toEqual({ status: 'ok' });
  });

  it('With AUTH_MODE=off: GET {API_PREFIX}/users/me returns 401', async () => {
    app = await buildAppForTest({
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      AUTH_MODE: 'off',
    });
    const prefix = getEnv().API_PREFIX;
    const res = await app.inject({ method: 'GET', url: `${prefix}/users/me` });
    expect(res.statusCode).toBe(401);
  });

  it('With AUTH_MODE=dev_bypass + required env: GET {API_PREFIX}/users/me returns 200 and includes id/email/roles', async () => {
    app = await buildAppForTest({
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      AUTH_MODE: 'dev_bypass',
      AUTH_DEV_BYPASS_USER_ID: 'test-user-123',
      AUTH_DEV_BYPASS_EMAIL: 'test@example.com',
      AUTH_DEV_BYPASS_ROLE: 'ADMIN',
    });
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
});
