import { computed, Injectable, signal } from '@angular/core';
import { AuthUser } from './auth.models';
import { UserRole } from './user-role';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly userState = signal<AuthUser | null>(null);

  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);
  readonly roles = computed(() => this.userState()?.roles ?? []);

  setUser(user: AuthUser): void {
    this.userState.set(user);
  }

  clear(): void {
    this.userState.set(null);
  }

  hasRole(role: UserRole): boolean {
    return this.roles().includes(role);
  }
}
