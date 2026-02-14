import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import type { AppRole } from './types';

export async function requireAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  if (!request.user) {
    throw new UnauthorizedError('Authentication required');
  }
}

export function requireRole(allowedRoles: AppRole[]) {
  return async function (request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const hasRole = request.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      throw new ForbiddenError('Insufficient permissions');
    }
  };
}
