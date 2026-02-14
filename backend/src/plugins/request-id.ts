import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { randomUUID } from 'crypto';

export async function requestIdPlugin(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.addHook('onRequest', async (request) => {
    const raw = request.headers['x-request-id'];
    const requestId = (Array.isArray(raw) ? raw[0] : raw) || randomUUID();
    request.id = requestId;
    request.log = request.log.child({ requestId });
  });
}
