import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function authRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // Auth routes will be implemented here
  fastify.get('/auth/me', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });
}
