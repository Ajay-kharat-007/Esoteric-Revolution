import { HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import { ApiClient } from '../api/api-client';
import { SKIP_AUTH, SKIP_REFRESH } from '../api/api-context';
import { AuthSession, AuthTokens } from './auth.models';
import { AuthStateService } from './auth-state.service';
import { TokenStorageService } from './token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly api = inject(ApiClient);
  private readonly tokens = inject(TokenStorageService);
  private readonly state = inject(AuthStateService);

  acceptSession(session: AuthSession): void {
    this.tokens.save(session.tokens);
    this.state.setUser(session.user);
  }

  refresh(): Observable<AuthTokens> {
    const refreshToken = this.tokens.refreshToken;
    return this.api
      .post<AuthTokens, { refreshToken: string | null }>(
        '/auth/refresh',
        { refreshToken },
        new HttpContext().set(SKIP_AUTH, true).set(SKIP_REFRESH, true),
      )
      .pipe(
        map((response) => response.data),
        tap((tokens) => this.tokens.save(tokens)),
      );
  }

  clearSession(): void {
    this.tokens.clear();
    this.state.clear();
  }
}
