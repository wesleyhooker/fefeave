import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { requireAuth } from '../auth/guards';

export async function userRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.get(
    '/users/me',
    {
      preHandler: [requireAuth],
      schema: {
        description: 'Get current authenticated user claims',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Cognito sub' },
              email: { type: 'string' },
              roles: { type: 'array', items: { type: 'string', enum: ['ADMIN', 'OPERATOR', 'WHOLESALER'] } },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const user = request.user!;
      return reply.send({
        id: user.cognitoSub,
        email: user.email,
        roles: user.roles,
      });
    }
  );

  fastify.get('/users', async (_request, reply) => {
    return reply.status(501).send({ message: 'Not implemented' });
  });
}
