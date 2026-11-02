import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export interface BackendApiError {
  status: number;
  code?: string;
  message: string | string[];
  details?: unknown;
  correlationId?: string;
  timestamp?: string;
  path?: string;
}

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) return throwError(() => error);
      const payload = error.error as Partial<BackendApiError> | null;
      const normalized: BackendApiError = {
        status: payload?.status ?? error.status,
        code: payload?.code,
        message: payload?.message ?? error.message,
        details: payload?.details,
        correlationId: payload?.correlationId ?? error.headers.get('x-correlation-id') ?? undefined,
        timestamp: payload?.timestamp,
        path: payload?.path ?? request.url,
      };
      return throwError(() => normalized);
    }),
  );
