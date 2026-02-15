import { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import type { AppRole } from './types';

export async function requireAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  if (!request.user) {
    throw new UnauthorizedError('Authentication required');
  }
}

/**
 * Requires the request user to have at least one of the given roles.
 * Must be used after requireAuth.
 */
export function requireRole(allowedRoles: AppRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      throw new UnauthorizedError('Authentication required');
    }
    const hasRole = request.user.roles.some((r) => allowedRoles.includes(r));
    if (!hasRole) {
      throw new ForbiddenError('Insufficient permissions');
    }
  };
}
