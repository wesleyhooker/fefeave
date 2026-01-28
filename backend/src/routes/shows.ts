import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function showRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // Show routes will be implemented here
  fastify.get('/shows', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });
}
