import { FastifyInstance, FastifyPluginOptions } from 'fastify';

export async function attachmentRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  // Attachment routes will be implemented here
  fastify.get('/attachments', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });
}
