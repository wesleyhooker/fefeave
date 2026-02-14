import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function authRoutes(
  _fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // Auth routes (e.g. token refresh) will be implemented here
}
