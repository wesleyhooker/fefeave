import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function userRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // User routes will be implemented here
  fastify.get('/users', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });
}
