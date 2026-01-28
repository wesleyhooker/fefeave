import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { randomUUID } from 'crypto';

export async function requestIdPlugin(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.addHook('onRequest', async (request) => {
    const requestId = request.headers['x-request-id'] || randomUUID();
    request.id = requestId;
    request.log = request.log.child({ requestId });
  });
}
