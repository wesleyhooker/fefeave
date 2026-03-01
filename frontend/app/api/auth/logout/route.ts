import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth/session.node';

async function handleLogout(request: NextRequest): Promise<NextResponse> {
  await clearSessionCookie();
  return NextResponse.redirect(new URL('/login', request.url));
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleLogout(request);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleLogout(request);
}
