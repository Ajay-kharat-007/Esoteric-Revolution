import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthApiService } from '../../../core/auth/auth-api.service';
import { AuthStateService } from '../../../core/auth/auth-state.service';
@Component({
  selector: 'els-admin-dashboard-placeholder',
  templateUrl: './admin-dashboard-placeholder.html',
  styleUrl: './admin-dashboard-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPlaceholder {
  readonly state = inject(AuthStateService);
  private readonly auth = inject(AuthApiService);
  private readonly router = inject(Router);
  logout(): void {
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/admin/login'));
  }
}
