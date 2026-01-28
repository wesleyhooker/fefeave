import { FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { createRequestLogger } from './logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(404, id ? `${resource} with id ${id} not found` : `${resource} not found`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export async function errorHandler(
  error: Error,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const requestId = request.id as string;
  const requestLogger = createRequestLogger(requestId);

  // Zod validation errors
  if (error instanceof ZodError) {
    const details = error.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));

    requestLogger.warn({ error: error.message, details }, 'Validation error');

    await reply.status(400).send({
      statusCode: 400,
      error: 'Validation Error',
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details,
      requestId,
    });
    return;
  }

  // Application errors
  if (error instanceof AppError) {
    const statusCode = error.statusCode || 500;
    const logLevel = statusCode >= 500 ? 'error' : 'warn';

    requestLogger[logLevel]({ error: error.message, code: error.code }, 'Application error');

    await reply.status(statusCode).send({
      statusCode,
      error: error.name,
      code: error.code || 'APPLICATION_ERROR',
      message: error.message,
      details: error.details,
      requestId,
    });
    return;
  }

  // Unknown errors
  requestLogger.error({ error: error.message, stack: error.stack }, 'Unhandled error');

  await reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    requestId,
  });
}
