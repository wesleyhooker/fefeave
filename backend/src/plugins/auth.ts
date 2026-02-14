import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getEnv } from '../config/env';
import { UnauthorizedError } from '../utils/errors';
import type { AuthUser, AppRole } from '../auth/types';

const COGNITO_ISSUER_PREFIX = 'https://cognito-idp.';

function getCognitoIssuer(region: string, userPoolId: string): string {
  return `${COGNITO_ISSUER_PREFIX}${region}.amazonaws.com/${userPoolId}`;
}

export async function authPlugin(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const env = getEnv();

  let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
  if (env.AUTH_MODE === 'cognito' && env.COGNITO_REGION && env.COGNITO_USER_POOL_ID) {
    const issuer = getCognitoIssuer(env.COGNITO_REGION, env.COGNITO_USER_POOL_ID);
    const jwksUrl = `${issuer}/.well-known/jwks.json`;
    jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  fastify.decorateRequest('user', undefined as AuthUser | undefined);

  fastify.addHook('onRequest', async (request: FastifyRequest, _reply: FastifyReply) => {
    if (env.AUTH_MODE === 'off') {
      return;
    }

    if (env.AUTH_MODE === 'dev_bypass') {
      const overrideHeader = request.headers['x-dev-user'];
      if (overrideHeader) {
        try {
          const payload = JSON.parse(overrideHeader as string) as {
            sub?: string;
            email?: string;
            roles?: string[];
          };
          const roles = (payload.roles ?? []).filter((r): r is AppRole =>
            ['ADMIN', 'OPERATOR', 'WHOLESALER'].includes(r)
          );
          if (payload.sub && payload.email) {
            request.user = {
              cognitoSub: payload.sub,
              email: payload.email,
              roles: roles.length ? roles : ['OPERATOR'],
            };
            return;
          }
        } catch {
          // Invalid JSON, fall through to env vars
        }
      }
      request.user = {
        cognitoSub: env.AUTH_DEV_BYPASS_USER_ID!,
        email: env.AUTH_DEV_BYPASS_EMAIL!,
        roles: [env.AUTH_DEV_BYPASS_ROLE!],
      };
      return;
    }

    if (env.AUTH_MODE === 'cognito' && jwks) {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No Bearer token: leave request.user undefined (public routes work)
        return;
      }
      const token = authHeader.slice(7);
      try {
        const issuer = getCognitoIssuer(env.COGNITO_REGION!, env.COGNITO_USER_POOL_ID!);
        const { payload } = await jwtVerify(token, jwks, {
          issuer,
          audience: env.COGNITO_APP_CLIENT_ID,
        });
        const groups = (payload['cognito:groups'] as string[] | undefined) ?? [];
        const roles = groups.filter((r): r is AppRole =>
          ['ADMIN', 'OPERATOR', 'WHOLESALER'].includes(r)
        );
        request.user = {
          cognitoSub: payload.sub as string,
          email: (payload.email as string) ?? (payload['cognito:username'] as string) ?? '',
          roles: roles.length ? roles : ['OPERATOR'],
        };
      } catch {
        throw new UnauthorizedError('Invalid or expired token');
      }
    }
  });
}
