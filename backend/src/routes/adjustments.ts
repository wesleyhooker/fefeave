import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function adjustmentRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // Adjustment routes will be implemented here
  fastify.get('/adjustments', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });
}
