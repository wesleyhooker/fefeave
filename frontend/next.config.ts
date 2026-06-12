import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  devFilePollingEnabled,
  devPollingIntervalMs,
} from './scripts/dev-detect-polling';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  webpack: (config, { dev }) => {
    if (dev && devFilePollingEnabled()) {
      config.watchOptions = {
        ...config.watchOptions,
        poll: devPollingIntervalMs(),
        aggregateTimeout: 300,
        ignored: ['**/node_modules/**', '**/.git/**', '**/.next/**'],
      };
    }
    return config;
  },
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
