import { NextRequest, NextResponse } from 'next/server';
import { createLogoutResponse } from '@/lib/auth/logout-response';

/** Safe for prefetch/crawlers — redirects without clearing session cookies. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return createLogoutResponse(request, { clearSession: false });
}

/** User-initiated sign-out — clears session cookies then redirects. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return createLogoutResponse(request, { clearSession: true });
}
