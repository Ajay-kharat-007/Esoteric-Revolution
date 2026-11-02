import { HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { SKIP_AUTH, SKIP_REFRESH } from '../api/api-context';
import {
  AuthSessionRecord,
  AuthTokens,
  AuthUser,
  BackendCurrentUser,
  ForgotPasswordRequest,
  LoginRequest,
  ResetPasswordRequest,
} from './auth.models';
import { AuthStateService } from './auth-state.service';
import { TokenStorageService } from './token-storage.service';
import { UserRole } from './user-role';

const PUBLIC_AUTH_CONTEXT = new HttpContext().set(SKIP_AUTH, true).set(SKIP_REFRESH, true);

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly api = inject(ApiClient);
  private readonly tokens = inject(TokenStorageService);
  private readonly state = inject(AuthStateService);

  login(request: LoginRequest): Observable<AuthUser> {
    return this.api
      .post<AuthTokens, LoginRequest>('/auth/login', request, PUBLIC_AUTH_CONTEXT)
      .pipe(
        map((response) => response.data),
        tap((tokens) => this.tokens.save(tokens)),
        switchMap(() => this.loadCurrentUser()),
        switchMap((user) => {
          if (!user.roles.includes('admin')) {
            return this.logout().pipe(
              switchMap(() => throwError(() => new Error('ADMIN_ACCESS_REQUIRED'))),
            );
          }
          return of(user);
        }),
        catchError((error: unknown) => {
          if (error instanceof Error && error.message === 'ADMIN_ACCESS_REQUIRED')
            return throwError(() => error);
          this.clearLocalSession();
          return throwError(() => error);
        }),
      );
  }

  refresh(): Observable<AuthTokens> {
    const refreshToken = this.tokens.refreshToken;
    if (!refreshToken) return throwError(() => new Error('REFRESH_TOKEN_MISSING'));
    return this.api
      .post<AuthTokens, { refreshToken: string }>(
        '/auth/refresh',
        { refreshToken },
        PUBLIC_AUTH_CONTEXT,
      )
      .pipe(
        map((response) => response.data),
        tap((tokens) => this.tokens.save(tokens)),
      );
  }

  restoreSession(): Observable<AuthUser | null> {
    if (!this.tokens.accessToken && !this.tokens.refreshToken) {
      this.state.markInitialized();
      return of(null);
    }
    return this.loadCurrentUser().pipe(
      map((user) => {
        if (!user.roles.includes('admin')) {
          this.clearLocalSession();
          return null;
        }
        return user;
      }),
      catchError(() => {
        this.clearLocalSession();
        return of(null);
      }),
    );
  }

  loadCurrentUser(): Observable<AuthUser> {
    return this.api.get<BackendCurrentUser>('/me').pipe(
      map((response) => this.normalizeUser(response.data)),
      tap((user) => this.state.setUser(user)),
    );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<{ accepted: boolean }> {
    return this.api
      .post<{ accepted: boolean }, ForgotPasswordRequest>(
        '/auth/forgot-password',
        request,
        PUBLIC_AUTH_CONTEXT,
      )
      .pipe(map((response) => response.data));
  }

  resetPassword(request: ResetPasswordRequest): Observable<{ success: boolean }> {
    return this.api
      .post<{ success: boolean }, ResetPasswordRequest>(
        '/auth/reset-password',
        request,
        PUBLIC_AUTH_CONTEXT,
      )
      .pipe(map((response) => response.data));
  }

  sessions(): Observable<AuthSessionRecord[]> {
    return this.api
      .get<AuthSessionRecord[]>('/auth/sessions')
      .pipe(map((response) => response.data));
  }

  revokeSession(sessionId: string): Observable<unknown> {
    return this.api
      .delete<unknown>(`/auth/sessions/${sessionId}`)
      .pipe(map((response) => response.data));
  }

  logout(): Observable<void> {
    return this.api.post<{ success: boolean }>('/auth/logout').pipe(
      map(() => undefined),
      catchError(() => of(undefined)),
      tap(() => this.clearLocalSession()),
    );
  }

  logoutAll(): Observable<void> {
    return this.api.post<{ success: boolean }>('/auth/logout-all').pipe(
      map(() => undefined),
      tap(() => this.clearLocalSession()),
    );
  }

  clearLocalSession(): void {
    this.tokens.clear();
    this.state.clear();
  }

  private normalizeUser(user: BackendCurrentUser): AuthUser {
    const allowedRoles: UserRole[] = ['admin', 'learner'];
    const roles = user.roles
      .map((entry) => entry.role.code)
      .filter((code): code is UserRole => allowedRoles.includes(code as UserRole));
    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      displayName: user.profile?.displayName ?? null,
      status: user.status,
      roles,
    };
  }
}
