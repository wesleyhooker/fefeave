import type { OpenNextConfig } from '@opennextjs/aws/types/open-next';

/**
 * Minimal OpenNext config for FefeAve — no DynamoDB tag cache, SQS revalidation, or warmer.
 */
const config = {
  default: {
    override: {
      tagCache: 'dummy',
      queue: 'dummy',
      incrementalCache: 's3',
    },
  },
} satisfies OpenNextConfig;

export default config;
