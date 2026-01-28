import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function paymentRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // Payment routes will be implemented here
  fastify.get('/payments', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });
}
