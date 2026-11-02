import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { ApiClient } from '../../../core/api/api-client';
import { APP_CONFIG } from '../../../core/config/app-config';
import { ApiEnvelope } from '../../../core/models/api.models';
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
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  load(): Observable<AdminDashboardData> {
    return forkJoin({
      queues: this.api
        .get<DashboardQueueResponse>('/admin/dashboard')
        .pipe(map((response) => response.data)),

      overview: this.api
        .get<DashboardOverview>('/admin/reports/overview')
        .pipe(map((response) => response.data)),

      activity: this.api
        .get<DashboardAuditEvent[]>('/admin/audit-events')
        .pipe(map((response) => response.data.slice(0, 6))),

      health: this.http.get<ApiEnvelope<DashboardHealth>>(this.healthUrl()).pipe(
        map((response) => response.data),
        catchError(() =>
          of({
            status: 'not_ready' as const,
            checks: {
              database: false,
              redis: false,
            },
          }),
        ),
      ),
    });
  }

  private healthUrl(): string {
    const backendOrigin = this.config.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    return `${backendOrigin}/health/ready`;
  }
}
