import { ChangeDetectionStrategy, Component } from '@angular/core';
@Component({
  selector: 'els-admin-dashboard-placeholder',
  template:
    '<main class="els-container"><h1>Admin Dashboard</h1><p>Dashboard implementation begins in Phase A3.</p></main>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboardPlaceholder {}
