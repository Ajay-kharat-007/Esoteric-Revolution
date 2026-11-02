import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { SetMetadata } from '@nestjs/common';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';
@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T> {
  constructor(private readonly reflector: Reflector) {}
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    if (
      this.reflector.getAllAndOverride<boolean>('skip_response_envelope', [
        context.getHandler(),
        context.getClass(),
      ])
    )
      return next.handle();
    const req = context.switchToHttp().getRequest<Request>();
    return next
      .handle()
      .pipe(map((data) => ({ data, correlationId: req.headers[CORRELATION_ID_HEADER] as string })));
  }
}
export const SkipResponseEnvelope = () => SetMetadata('skip_response_envelope', true);
