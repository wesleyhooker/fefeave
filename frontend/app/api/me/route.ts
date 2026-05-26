import { NextResponse } from 'next/server';
import { fetchMe } from '@/lib/auth/backendUser';
import { appendSessionCookieClearHeaders } from '@/lib/auth/session-cookie-options';
import { getSession } from '@/lib/auth/session.node';

export async function GET(): Promise<NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const me = await fetchMe(session.access_token);
    return NextResponse.json(me, { status: 200 });
  } catch {
    const response = NextResponse.json(
      { message: 'Unauthorized' },
      { status: 401 },
    );
    appendSessionCookieClearHeaders(response.headers);
    return response;
  }
}
