export const APP_ROLE_VALUES = ['ADMIN', 'OPERATOR', 'WHOLESALER'] as const;
export type AppRole = (typeof APP_ROLE_VALUES)[number];

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
