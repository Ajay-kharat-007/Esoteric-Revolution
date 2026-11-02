import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthApiService } from '../auth/auth-api.service';
import { AuthStateService } from '../auth/auth-state.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const authState = inject(AuthStateService);
  const authApi = inject(AuthApiService);
  const router = inject(Router);
  const decide = () =>
    authState.hasRole('admin')
      ? true
      : router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
  if (authState.initialized()) return decide();
  return authApi.restoreSession().pipe(
    map(decide),
    catchError(() => of(decide())),
  );
};
