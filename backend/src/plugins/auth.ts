import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getEnv } from '../config/env';
import { UnauthorizedError } from '../utils/errors';
import { APP_ROLE_VALUES, type AuthUser, type AppRole } from '../auth/types';

const COGNITO_ISSUER_PREFIX = 'https://cognito-idp.';

function getCognitoIssuer(region: string, userPoolId: string): string {
  return `${COGNITO_ISSUER_PREFIX}${region}.amazonaws.com/${userPoolId}`;
}

function decodeJwtClaimsNoVerify(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    const parsed = JSON.parse(payload) as Record<string, unknown>;
    return parsed;
  } catch {
    return null;
  }
}

export async function authPlugin(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  const envAtRegister = getEnv();
  let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
  if (
    envAtRegister.AUTH_MODE === 'cognito' &&
    envAtRegister.COGNITO_REGION &&
    envAtRegister.COGNITO_USER_POOL_ID
  ) {
    const issuer = getCognitoIssuer(
      envAtRegister.COGNITO_REGION,
      envAtRegister.COGNITO_USER_POOL_ID
    );
    const jwksUrl = `${issuer}/.well-known/jwks.json`;
    jwks = createRemoteJWKSet(new URL(jwksUrl));
  }

  fastify.decorateRequest('user', undefined as AuthUser | undefined);

  fastify.addHook('onRequest', async (request: FastifyRequest, _reply: FastifyReply) => {
    const env = getEnv();
    if (env.AUTH_MODE === 'off') {
      return;
    }

    if (env.AUTH_MODE === 'dev_bypass') {
      const overrideHeader = request.headers['x-dev-user'];
      const allowHeaderOverride =
        env.AUTH_DEV_ALLOW_HEADER_OVERRIDE && overrideHeader && env.NODE_ENV !== 'production';
      if (allowHeaderOverride) {
        try {
          const payload = JSON.parse(overrideHeader as string) as {
            sub?: string;
            email?: string;
            roles?: string[];
          };
          // Never accept ADMIN from header - only trusted server-side config can grant it
          const roles = (payload.roles ?? []).filter(
            (r): r is AppRole => (APP_ROLE_VALUES as readonly string[]).includes(r) && r !== 'ADMIN'
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
        });
        const tokenUse = payload['token_use'];
        if (tokenUse !== 'access') {
          if (env.NODE_ENV !== 'production') {
            request.log.warn(
              {
                expected_token_use: 'access',
                received_token_use: tokenUse,
                iss: payload.iss,
                aud: payload.aud,
                client_id: payload.client_id,
                exp: payload.exp,
              },
              'Rejected Cognito token_use'
            );
          }
          throw new UnauthorizedError('Invalid or expired token');
        }
        const clientId = payload.client_id as string | undefined;
        if (!clientId || clientId !== env.COGNITO_APP_CLIENT_ID) {
          if (env.NODE_ENV !== 'production') {
            request.log.warn(
              {
                expected_client_id: env.COGNITO_APP_CLIENT_ID,
                received_client_id: clientId,
                token_use: tokenUse,
                iss: payload.iss,
                exp: payload.exp,
              },
              'Rejected Cognito client_id'
            );
          }
          throw new UnauthorizedError('Invalid or expired token');
        }
        const groups = (payload['cognito:groups'] as string[] | undefined) ?? [];
        const roles = groups.filter((r): r is AppRole =>
          (APP_ROLE_VALUES as readonly string[]).includes(r)
        );
        request.user = {
          cognitoSub: payload.sub as string,
          email: (payload.email as string) ?? (payload['cognito:username'] as string) ?? '',
          roles: roles.length ? roles : ['OPERATOR'],
        };
      } catch (error) {
        if (env.NODE_ENV !== 'production') {
          const claims = decodeJwtClaimsNoVerify(token);
          request.log.warn(
            {
              reason: error instanceof Error ? error.message : String(error),
              expected_token_use: 'access',
              received_token_use: claims?.token_use,
              iss: claims?.iss,
              aud: claims?.aud,
              client_id: claims?.client_id,
              exp: claims?.exp,
            },
            'Invalid Cognito bearer token'
          );
        }
        throw new UnauthorizedError('Invalid or expired token');
      }
    }
  });
}
