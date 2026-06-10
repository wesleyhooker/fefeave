import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import { clearEnvCache } from '../config/env';

const testEnv = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'error',
  API_PREFIX: '/api',
  AUTH_MODE: 'off',
} as const;

function mockContext(): Context {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: 'fefeave-backend-test',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-west-2:123456789012:function:fefeave-backend-test',
    memoryLimitInMB: '512',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/fefeave-backend-test',
    logStreamName: 'test',
    getRemainingTimeInMillis: () => 30_000,
    done: () => undefined,
    fail: () => undefined,
    succeed: () => undefined,
  };
}

function healthEvent(): APIGatewayProxyEventV2 {
  return {
    version: '2.0',
    routeKey: 'GET /api/health',
    rawPath: '/api/health',
    rawQueryString: '',
    headers: { host: 'localhost' },
    requestContext: {
      accountId: '123456789012',
      apiId: 'test',
      domainName: 'localhost',
      domainPrefix: 'test',
      http: {
        method: 'GET',
        path: '/api/health',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'jest',
      },
      requestId: 'test-request-id',
      routeKey: 'GET /api/health',
      stage: '$default',
      time: '01/Jan/2026:00:00:00 +0000',
      timeEpoch: 0,
    },
    isBase64Encoded: false,
  };
}

describe('lambda handler', () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    Object.assign(process.env, testEnv);
    clearEnvCache();
    jest.resetModules();
  });

  afterEach(() => {
    process.env = { ...savedEnv };
    clearEnvCache();
    jest.resetModules();
  });

  it('serves GET /api/health via API Gateway v2 on first and second invoke', async () => {
    const { handler } = await import('../lambda');
    const event = healthEvent();
    const context = mockContext();

    const first = (await handler(event, context)) as { statusCode: number; body: string };
    expect(first.statusCode).toBe(200);
    const firstBody = JSON.parse(first.body);
    expect(firstBody.status).toBe('ok');
    expect(firstBody.checks.app.status).toBe('ok');

    const second = (await handler(event, context)) as { statusCode: number; body: string };
    expect(second.statusCode).toBe(200);
    expect(JSON.parse(second.body).status).toBe('ok');
  });
});
