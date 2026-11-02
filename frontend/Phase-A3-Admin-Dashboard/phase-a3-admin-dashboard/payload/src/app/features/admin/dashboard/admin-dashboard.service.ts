import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import {
  AdminDashboardData,
  DashboardAuditEvent,
  DashboardHealth,
  DashboardOverview,
  DashboardQueueResponse,
} from './admin-dashboard.models';
@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly api = inject(ApiClient);
  load(): Observable<AdminDashboardData> {
    return forkJoin({
      queues: this.api.get<DashboardQueueResponse>('/admin/dashboard').pipe(map((r) => r.data)),
      overview: this.api.get<DashboardOverview>('/admin/reports/overview').pipe(map((r) => r.data)),
      activity: this.api
        .get<DashboardAuditEvent[]>('/admin/audit-events')
        .pipe(map((r) => r.data.slice(0, 6))),
      health: this.api.get<DashboardHealth>('/health/ready').pipe(map((r) => r.data)),
    });
  }
}
