import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function healthRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.get('/health', async (_request, reply) => {
    return reply.send({ status: 'ok' });
  });
}
