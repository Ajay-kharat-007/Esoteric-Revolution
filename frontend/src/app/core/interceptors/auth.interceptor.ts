import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, finalize, Observable, shareReplay, switchMap, throwError } from 'rxjs';
import { SKIP_AUTH, SKIP_REFRESH } from '../api/api-context';
import { AuthApiService } from '../auth/auth-api.service';
import { AuthTokens } from '../auth/auth.models';
import { TokenStorageService } from '../auth/token-storage.service';

let refreshRequest$: Observable<AuthTokens> | null = null;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const tokenStorage = inject(TokenStorageService);
  const authApi = inject(AuthApiService);
  const accessToken = tokenStorage.accessToken;
  const authenticatedRequest =
    accessToken && !request.context.get(SKIP_AUTH)
      ? request.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
      : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (
        !(error instanceof HttpErrorResponse) ||
        error.status !== 401 ||
        request.context.get(SKIP_REFRESH)
      ) {
        return throwError(() => error);
      }
      refreshRequest$ ??= authApi.refresh().pipe(
        finalize(() => (refreshRequest$ = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
      return refreshRequest$.pipe(
        switchMap((tokens) =>
          next(request.clone({ setHeaders: { Authorization: `Bearer ${tokens.accessToken}` } })),
        ),
        catchError((refreshError: unknown) => {
          authApi.clearLocalSession();
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
