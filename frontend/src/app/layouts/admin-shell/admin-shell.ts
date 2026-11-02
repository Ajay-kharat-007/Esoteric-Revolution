import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthApiService } from '../../core/auth/auth-api.service';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { ADMIN_NAVIGATION } from './admin-navigation';

@Component({
  selector: 'els-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-shell.html',
  styleUrl: './admin-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminShell {
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);

  readonly authState = inject(AuthStateService);
  readonly navigation = ADMIN_NAVIGATION;
  readonly collapsed = signal(this.readCollapsed());
  readonly mobileOpen = signal(false);
  readonly profileOpen = signal(false);
  readonly createOpen = signal(false);
  readonly currentUrl = signal(this.router.url);
  readonly breadcrumbs = computed(() => this.buildBreadcrumbs(this.currentUrl()));
  readonly initials = computed(() => {
    const user = this.authState.user();
    const value = user?.displayName || user?.email || 'Admin';
    return value
      .split(/\s|@/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.mobileOpen.set(false);
        this.profileOpen.set(false);
        this.createOpen.set(false);
      });
  }

  toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
    if (isPlatformBrowser(this.platformId))
      localStorage.setItem('els.admin.sidebar-collapsed', String(this.collapsed()));
  }

  toggleMobile(): void {
    this.mobileOpen.update((value) => !value);
  }
  closeMobile(): void {
    this.mobileOpen.set(false);
  }
  toggleProfile(): void {
    this.profileOpen.update((value) => !value);
    this.createOpen.set(false);
  }
  toggleCreate(): void {
    this.createOpen.update((value) => !value);
    this.profileOpen.set(false);
  }

  logout(): void {
    this.authApi.logout().subscribe(() => void this.router.navigateByUrl('/admin/login'));
  }

  private readCollapsed(): boolean {
    return (
      isPlatformBrowser(this.platformId) &&
      localStorage.getItem('els.admin.sidebar-collapsed') === 'true'
    );
  }

  private buildBreadcrumbs(url: string): { label: string; route?: string }[] {
    const labels: Record<string, string> = {
      admin: 'Administration',
      dashboard: 'Dashboard',
      content: 'Content',
      catalogue: 'Catalogue',
      editorial: 'Editorial',
      discovery: 'Discovery',
      quizzes: 'Quizzes',
      commerce: 'Commerce',
      learners: 'Learners',
      operations: 'Operations',
      analytics: 'Analytics',
      governance: 'Governance',
      settings: 'Settings',
    };
    const segments = url.split('?')[0].split('/').filter(Boolean);
    return segments.map((segment, index) => ({
      label: labels[segment] ?? this.titleCase(segment),
      route: index < segments.length - 1 ? `/${segments.slice(0, index + 1).join('/')}` : undefined,
    }));
  }

  private titleCase(value: string): string {
    return value.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
  }
}
