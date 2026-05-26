import { buildPgPoolConfig, isLambdaRuntime } from '../db';

describe('Postgres pool runtime config', () => {
  const previousLambdaFunctionName = process.env.AWS_LAMBDA_FUNCTION_NAME;

  afterEach(() => {
    if (previousLambdaFunctionName === undefined) {
      delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    } else {
      process.env.AWS_LAMBDA_FUNCTION_NAME = previousLambdaFunctionName;
    }
  });

  test('isLambdaRuntime is false without AWS_LAMBDA_FUNCTION_NAME', () => {
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    expect(isLambdaRuntime()).toBe(false);
  });

  test('non-Lambda pool config leaves pg defaults (no max override)', () => {
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    const config = buildPgPoolConfig('postgres://local/test');
    expect(config).toEqual({ connectionString: 'postgres://local/test' });
    expect(config.max).toBeUndefined();
    expect(config.idleTimeoutMillis).toBeUndefined();
  });

  test('Lambda pool config caps connections at 1', () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'fefeave-backend-prod';
    expect(isLambdaRuntime()).toBe(true);
    const config = buildPgPoolConfig('postgres://neon/test');
    expect(config).toEqual({
      connectionString: 'postgres://neon/test',
      max: 1,
      idleTimeoutMillis: 20_000,
    });
  });
});
