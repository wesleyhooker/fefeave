import { NextRequest } from 'next/server';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function getBackendOrigin(): string {
  return (
    process.env.DEV_BACKEND_ORIGIN?.trim().replace(/\/$/, '') ||
    'http://fefeave-backend-dev-379356847.us-west-2.elb.amazonaws.com'
  );
}

function getTargetUrl(req: NextRequest, path: string[]): string {
  const origin = getBackendOrigin();
  const joinedPath = path.join('/');
  const qs = req.nextUrl.search || '';
  return `${origin}/api/${joinedPath}${qs}`;
}

function copyRequestHeaders(req: NextRequest): Headers {
  const headers = new Headers();
  req.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (HOP_BY_HOP_HEADERS.has(k) || k === 'host' || k === 'content-length')
      return;
    headers.set(key, value);
  });

  const devBearer = process.env.DEV_AUTH_BEARER?.trim();
  if (devBearer) {
    headers.set('Authorization', `Bearer ${devBearer}`);
  }
  return headers;
}

function copyResponseHeaders(source: Headers): Headers {
  const headers = new Headers();
  source.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase())) return;
    headers.set(key, value);
  });
  return headers;
}

async function proxy(req: NextRequest, path: string[]): Promise<Response> {
  const target = getTargetUrl(req, path);
  const headers = copyRequestHeaders(req);
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
    redirect: 'manual',
    cache: 'no-store',
  });

  const responseHeaders = copyResponseHeaders(upstream.headers);
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  });
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(
  req: NextRequest,
  ctx: RouteContext,
): Promise<Response> {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function POST(
  req: NextRequest,
  ctx: RouteContext,
): Promise<Response> {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function PUT(
  req: NextRequest,
  ctx: RouteContext,
): Promise<Response> {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext,
): Promise<Response> {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function DELETE(
  req: NextRequest,
  ctx: RouteContext,
): Promise<Response> {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function OPTIONS(
  req: NextRequest,
  ctx: RouteContext,
): Promise<Response> {
  const { path } = await ctx.params;
  return proxy(req, path);
}

export async function HEAD(
  req: NextRequest,
  ctx: RouteContext,
): Promise<Response> {
  const { path } = await ctx.params;
  return proxy(req, path);
}
