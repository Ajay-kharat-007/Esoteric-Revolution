import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { BackendApiError } from '../../../core/interceptors/api-error.interceptor';
import { AdminDashboardData, DashboardAuditEvent } from './admin-dashboard.models';
import { AdminDashboardService } from './admin-dashboard.service';
@Component({
  selector: 'els-admin-dashboard',
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  private readonly service = inject(AdminDashboardService);
  readonly loading = signal(true);
  readonly data = signal<AdminDashboardData | null>(null);
  readonly error = signal<string | null>(null);
  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .load()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (d) => this.data.set(d),
        error: (e: Partial<BackendApiError>) =>
          this.error.set(
            e.correlationId
              ? `Dashboard could not be loaded. Reference: ${e.correlationId}`
              : 'Dashboard could not be loaded. Please try again.',
          ),
      });
  }
  label(value: string): string {
    return value
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  activityTitle(item: DashboardAuditEvent): string {
    return this.label(item.action);
  }
  actor(item: DashboardAuditEvent): string {
    return item.actor?.profile?.displayName || item.actor?.email || 'System';
  }
  timestamp(value: string): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(value),
    );
  }
}
