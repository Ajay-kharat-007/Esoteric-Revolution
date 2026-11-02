import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ApiErrorPayload } from '../models/api.models';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);
      const payload = error.error as Partial<ApiErrorPayload> | null;
      const normalized: ApiErrorPayload = {
        statusCode: error.status,
        code: payload?.code,
        message: payload?.message ?? error.message,
        correlationId: payload?.correlationId ?? error.headers.get('x-correlation-id') ?? undefined,
        details: payload?.details,
      };
      return throwError(() => normalized);
    }),
  );
