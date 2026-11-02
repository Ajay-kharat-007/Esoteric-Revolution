import { computed, Injectable, signal } from '@angular/core';
import { AuthUser } from './auth.models';
import { UserRole } from './user-role';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly userState = signal<AuthUser | null>(null);
  private readonly initializedState = signal(false);

  readonly user = this.userState.asReadonly();
  readonly initialized = this.initializedState.asReadonly();
  readonly isAuthenticated = computed(() => this.userState() !== null);
  readonly roles = computed(() => this.userState()?.roles ?? []);

  setUser(user: AuthUser): void {
    this.userState.set(user);
    this.initializedState.set(true);
  }

  markInitialized(): void {
    this.initializedState.set(true);
  }

  clear(): void {
    this.userState.set(null);
    this.initializedState.set(true);
  }

  hasRole(role: UserRole): boolean {
    return this.roles().includes(role);
  }
}
