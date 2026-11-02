import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { AuthTokens } from './auth.models';

const ACCESS_TOKEN = 'esoteric.access-token';
const REFRESH_TOKEN = 'esoteric.refresh-token';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly platformId = inject(PLATFORM_ID);

  get accessToken(): string | null {
    return this.storage?.getItem(ACCESS_TOKEN) ?? null;
  }

  get refreshToken(): string | null {
    return this.storage?.getItem(REFRESH_TOKEN) ?? null;
  }

  save(tokens: AuthTokens): void {
    const storage = this.storage;
    if (!storage) return;
    storage.setItem(ACCESS_TOKEN, tokens.accessToken);
    if (tokens.refreshToken) storage.setItem(REFRESH_TOKEN, tokens.refreshToken);
  }

  clear(): void {
    this.storage?.removeItem(ACCESS_TOKEN);
    this.storage?.removeItem(REFRESH_TOKEN);
  }

  private get storage(): Storage | null {
    return isPlatformBrowser(this.platformId) ? window.sessionStorage : null;
  }
}
