import { NextRequest, NextResponse } from 'next/server';
import { fetchMe } from '@/lib/auth/backendUser';
import { clearSessionCookie, setSessionCookie } from '@/lib/auth/session.node';

function envOrThrow(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function getAppOrigin(): string {
  const redirectUri = process.env.COGNITO_REDIRECT_URI!;
  return new URL(redirectUri).origin;
}

function getPostLoginPath(roles: string[]): string {
  if (roles.includes('ADMIN') || roles.includes('OPERATOR'))
    return '/admin/dashboard';
  if (roles.includes('WHOLESALER')) return '/portal/statement';
  return '/403';
}

function decodeJwtClaimsNoVerify(
  token?: string,
): Record<string, unknown> | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const payload = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(payload) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function redirectAuthFailed(request: NextRequest): Promise<NextResponse> {
  await clearSessionCookie();
  const origin = getAppOrigin();
  return NextResponse.redirect(new URL('/login?error=auth_failed', origin));
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const oauthError = request.nextUrl.searchParams.get('error');
  if (oauthError) {
    return redirectAuthFailed(request);
  }

  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return redirectAuthFailed(request);
  }

  let tokenJson: {
    access_token?: string;
    id_token?: string;
    expires_in?: number;
  };

  try {
    const cognitoDomain = envOrThrow('COGNITO_DOMAIN')
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '');
    const clientId = envOrThrow('COGNITO_CLIENT_ID');
    const clientSecret = envOrThrow('COGNITO_CLIENT_SECRET');
    const redirectUri = envOrThrow('COGNITO_REDIRECT_URI');

    const tokenUrl = `https://${cognitoDomain}/oauth2/token`;
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    });

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
      cache: 'no-store',
    });

    if (!tokenRes.ok) {
      return redirectAuthFailed(request);
    }

    tokenJson = (await tokenRes.json()) as {
      access_token?: string;
      id_token?: string;
      expires_in?: number;
    };

    if (process.env.NODE_ENV !== 'production') {
      const accessClaims = decodeJwtClaimsNoVerify(tokenJson.access_token);
      const idClaims = decodeJwtClaimsNoVerify(tokenJson.id_token);
      // Dev-only claim metadata to diagnose token-use/audience mismatches.
      // Never log raw token strings.
      // eslint-disable-next-line no-console
      console.info('Cognito callback token metadata', {
        access: accessClaims
          ? {
              token_use: accessClaims.token_use,
              iss: accessClaims.iss,
              aud: accessClaims.aud,
              client_id: accessClaims.client_id,
              exp: accessClaims.exp,
            }
          : null,
        id: idClaims
          ? {
              token_use: idClaims.token_use,
              iss: idClaims.iss,
              aud: idClaims.aud,
              client_id: idClaims.client_id,
              exp: idClaims.exp,
            }
          : null,
      });
    }
  } catch {
    return redirectAuthFailed(request);
  }

  if (!tokenJson.access_token) {
    return redirectAuthFailed(request);
  }

  try {
    const me = await fetchMe(tokenJson.access_token);
    const expiresIn =
      tokenJson.expires_in && tokenJson.expires_in > 0
        ? tokenJson.expires_in
        : 3600;
    const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
    await setSessionCookie({
      access_token: tokenJson.access_token,
      id_token: tokenJson.id_token,
      expires_at: expiresAt,
      roles: me.roles,
      user: {
        id: me.id,
        email: me.email,
      },
    });
    const destination = getPostLoginPath(me.roles ?? []);
    const origin = getAppOrigin();
    return NextResponse.redirect(new URL(destination, origin));
  } catch {
    return redirectAuthFailed(request);
  }
}
