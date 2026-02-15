import { randomUUID } from 'crypto';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { loadEnv, getEnv } from './config/env';
import { logger } from './utils/logger';
import { errorHandler } from './utils/errors';
import { requestIdPlugin } from './plugins/request-id';
import { authPlugin } from './plugins/auth';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { wholesalerRoutes } from './routes/wholesalers';
import { showRoutes } from './routes/shows';
import { showFinancialsRoutes } from './routes/show-financials';
import { owedLineItemRoutes } from './routes/owed-line-items';
import { paymentRoutes } from './routes/payments';
import { adjustmentRoutes } from './routes/adjustments';
import { attachmentRoutes } from './routes/attachments';

async function buildApp() {
  // Load and validate environment variables (fail fast)
  loadEnv();
  const env = getEnv();

  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
    requestIdLogLabel: 'requestId',
    genReqId: () => randomUUID(),
  });

  // Register plugins
  await app.register(helmet);
  await app.register(cors, {
    origin: env.NODE_ENV === 'production' ? false : true, // Allow all in dev, restrict in prod
  });

  // Register request ID plugin (must be early)
  await app.register(requestIdPlugin);

  // Register auth plugin (fp so hook runs for all routes)
  await app.register(fp(authPlugin));

  // Register Swagger/OpenAPI
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Fefeave API',
        description: 'Backend API for Fefeave reseller business system',
        version: '1.0.0',
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
          description: 'Local development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Cognito JWT (when AUTH_MODE=cognito)',
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Register error handler
  app.setErrorHandler(errorHandler);

  // Register routes
  await app.register(healthRoutes, { prefix: env.API_PREFIX });
  await app.register(authRoutes, { prefix: env.API_PREFIX });
  await app.register(userRoutes, { prefix: env.API_PREFIX });
  await app.register(wholesalerRoutes, { prefix: env.API_PREFIX });
  await app.register(showRoutes, { prefix: env.API_PREFIX });
  await app.register(showFinancialsRoutes, { prefix: env.API_PREFIX });
  await app.register(owedLineItemRoutes, { prefix: env.API_PREFIX });
  await app.register(paymentRoutes, { prefix: env.API_PREFIX });
  await app.register(adjustmentRoutes, { prefix: env.API_PREFIX });
  await app.register(attachmentRoutes, { prefix: env.API_PREFIX });

  return app;
}

async function start() {
  try {
    const app = await buildApp();
    const env = getEnv();

    await app.listen({
      port: env.PORT,
      host: '0.0.0.0',
    });

    logger.info(`Server listening on http://0.0.0.0:${env.PORT}`);
    logger.info(`API docs available at http://localhost:${env.PORT}/docs`);
  } catch (err) {
    logger.error(err, 'Error starting server');
    process.exit(1);
  }
}

// Start server if this file is run directly
if (require.main === module) {
  start();
}

export { buildApp };
