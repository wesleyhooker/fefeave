import { NextResponse } from 'next/server';
import { fetchMe } from '@/lib/auth/backendUser';
import { clearSessionCookie, getSession } from '@/lib/auth/session.node';

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const me = await fetchMe(session.access_token);
    return NextResponse.json(me, { status: 200 });
  } catch {
    await clearSessionCookie();
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}
