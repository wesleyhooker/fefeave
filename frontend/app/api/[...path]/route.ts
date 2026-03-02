import { NextRequest, NextResponse } from 'next/server';
import { getBackendBaseUrl } from '@/lib/auth/backendUser';
import { getSession } from '@/lib/auth/session.node';

function normalizePathForBase(base: string, path: string[]): string[] {
  const cleanPath = path.filter((p) => p.length > 0);
  const baseEndsWithApi = /\/api$/i.test(base);
  if (baseEndsWithApi && cleanPath[0]?.toLowerCase() === 'api') {
    return cleanPath.slice(1);
  }
  return cleanPath;
}

function joinUpstreamUrl(base: string, path: string[], query: string): string {
  const normalizedBase = base.replace(/\/$/, '');
  const normalizedPath = normalizePathForBase(normalizedBase, path).join('/');
  const pathSuffix = normalizedPath ? `/${normalizedPath}` : '';
  return `${normalizedBase}${pathSuffix}${query ? `?${query}` : ''}`;
}

function buildTargetUrl(request: NextRequest, path: string[]): string {
  const base = getBackendBaseUrl();
  const query = request.nextUrl.searchParams.toString();
  return joinUpstreamUrl(base, path, query);
}

async function proxy(
  request: NextRequest,
  path: string[],
): Promise<NextResponse> {
  let targetUrl: string;
  try {
    targetUrl = buildTargetUrl(request, path);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Invalid backend configuration';
    return NextResponse.json({ message }, { status: 500 });
  }

  const session = await getSession();
  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);
  if (session?.access_token) {
    headers.set('authorization', `Bearer ${session.access_token}`);
  }

  const method = request.method.toUpperCase();
  const requestBody =
    method === 'GET' || method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();
  const upstream = await fetch(targetUrl, {
    method,
    headers,
    body: requestBody,
    cache: 'no-store',
  });

  const responseHeaders = new Headers();
  const upstreamContentType = upstream.headers.get('content-type');
  if (upstreamContentType)
    responseHeaders.set('content-type', upstreamContentType);
  const disposition = upstream.headers.get('content-disposition');
  if (disposition) responseHeaders.set('content-disposition', disposition);

  const body = await upstream.arrayBuffer();
  return new NextResponse(body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await context.params;
  return proxy(request, path);
}
