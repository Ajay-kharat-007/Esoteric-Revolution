import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    if (!(exception instanceof HttpException)) {
      console.error('UNHANDLED_BACKEND_EXCEPTION', exception);
    }
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const prismaCode =
      typeof (exception as { code?: unknown }).code === 'string'
        ? (exception as { code: string }).code
        : '';
    const prismaStatus =
      prismaCode === 'P2025'
        ? HttpStatus.NOT_FOUND
        : prismaCode === 'P2002'
          ? HttpStatus.CONFLICT
          : prismaCode === 'P2003'
            ? HttpStatus.CONFLICT
            : prismaCode === 'P2023'
              ? HttpStatus.BAD_REQUEST
              : undefined;
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : (prismaStatus ?? HttpStatus.INTERNAL_SERVER_ERROR);
    const body = exception instanceof HttpException ? exception.getResponse() : undefined;
    const details = typeof body === 'object' ? body : undefined;
    const message =
      typeof body === 'string'
        ? body
        : details && 'message' in details
          ? details.message
          : status === 500
            ? 'Internal server error'
            : prismaCode === 'P2025'
              ? 'Requested record was not found'
              : prismaCode === 'P2002'
                ? 'A record with the same unique value already exists'
                : prismaCode === 'P2003'
                  ? 'The request conflicts with a related record'
                  : prismaCode === 'P2023'
                    ? 'A supplied identifier or value is invalid'
                    : 'Request failed';
    res.status(status).json({
      status,
      code: exception instanceof HttpException ? `HTTP_${status}` : prismaCode || 'INTERNAL_ERROR',
      message,
      details,
      correlationId: req.headers[CORRELATION_ID_HEADER],
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }
}
