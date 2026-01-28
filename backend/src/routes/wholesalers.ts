import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function wholesalerRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // Wholesaler routes will be implemented here
  fastify.get('/wholesalers', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });
}
