export type AppRole = 'ADMIN' | 'OPERATOR' | 'WHOLESALER';

export interface AuthUser {
  cognitoSub: string;
  email: string;
  roles: AppRole[];
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}
