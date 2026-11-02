import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboard } from './admin-dashboard';
describe('AdminDashboard', () => {
  it('loads live dashboard data', async () => {
    const data = {
      queues: {
        generatedAt: '2026-10-20T00:00:00Z',
        roles: ['admin'],
        queues: { works: 1, support: 2, reports: 3, products: 4, users: 5 },
      },
      overview: {
        generatedAt: '2026-10-20T00:00:00Z',
        users: 5,
        activeUsers: 5,
        publishedWorks: 1,
        paidOrders: 1,
        activeEntitlements: 1,
        openSupportCases: 2,
        openReports: 3,
      },
      activity: [],
      health: { status: 'ready' as const, checks: { database: true, redis: true } },
    };
    await TestBed.configureTestingModule({
      imports: [AdminDashboard],
      providers: [{ provide: AdminDashboardService, useValue: { load: () => of(data) } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminDashboard);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('All required services are ready');
    expect(fixture.nativeElement.textContent).toContain('Published works');
  });
});
