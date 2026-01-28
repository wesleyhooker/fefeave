import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function owedLineItemRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // Owed line item routes will be implemented here
  fastify.get('/line-items', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });
}
