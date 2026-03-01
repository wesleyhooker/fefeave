import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session.node';

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: session.user
      ? { id: session.user.id, email: session.user.email }
      : undefined,
    roles: session.roles ?? [],
    expiresAt: session.expires_at,
  });
}
