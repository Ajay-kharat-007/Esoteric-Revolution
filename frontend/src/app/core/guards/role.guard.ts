import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserRole } from '../auth/user-role';
import { AuthStateService } from '../auth/auth-state.service';

export const roleGuard =
  (role: UserRole): CanActivateFn =>
  () => {
    const auth = inject(AuthStateService);
    const router = inject(Router);
    return auth.hasRole(role) ? true : router.createUrlTree(['/']);
  };
