/**
 * AWS Lambda entrypoint for the Fastify API.
 * Local dev continues to use `src/index.ts` (app.listen).
 *
 * API Gateway should forward requests with the /api prefix intact, or strip a stage
 * and set basePath — see docs/deployment/lambda-phase2.md.
 */
import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import awsLambdaFastify from '@fastify/aws-lambda';
import { buildApp } from './index';

/** Promise-style API Gateway handler (v2 overload of @fastify/aws-lambda). */
type LambdaProxy = (event: APIGatewayProxyEventV2, context: Context) => Promise<unknown>;

let proxy: LambdaProxy | undefined;

async function getProxy(): Promise<LambdaProxy> {
  if (!proxy) {
    const app = await buildApp();
    await app.ready();
    proxy = awsLambdaFastify(app, {
      callbackWaitsForEmptyEventLoop: false,
    }) as LambdaProxy;
  }
  return proxy;
}

export const handler: LambdaProxy = async (event, context) => {
  const lambdaProxy = await getProxy();
  return lambdaProxy(event, context);
};
