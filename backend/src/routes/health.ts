import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { runReadinessCheck } from '../services/readiness-check';

export async function healthRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  /** Liveness — process is up; no dependency checks (ALB warm-up / fast probe). */
  fastify.get('/health/live', async (_request, reply) => {
    return reply.send({ status: 'ok' });
  });

  /**
   * Readiness — DB connectivity, migration compatibility, app healthy.
   * Returns 503 when unhealthy (pending migrations, DB down, etc.).
   */
  fastify.get('/health/ready', async (_request, reply) => {
    const report = await runReadinessCheck();
    const statusCode = report.status === 'ok' ? 200 : 503;
    return reply.status(statusCode).send(report);
  });

  /** Default health alias — same as /health/ready for deploy probes and ALB. */
  fastify.get('/health', async (_request, reply) => {
    const report = await runReadinessCheck();
    const statusCode = report.status === 'ok' ? 200 : 503;
    return reply.status(statusCode).send(report);
  });
}
