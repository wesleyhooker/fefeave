import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination:
          'http://fefeave-backend-dev-379356847.us-west-2.elb.amazonaws.com/api/:path*',
      },
    ];
  },
};

export default nextConfig;
