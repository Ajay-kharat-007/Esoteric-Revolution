import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthApiService } from '../../core/auth/auth-api.service';
import { AuthStateService } from '../../core/auth/auth-state.service';
import { AdminShell } from './admin-shell';

describe('AdminShell', () => {
  it('creates and exposes navigation', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminShell],
      providers: [
        provideRouter([]),
        { provide: AuthApiService, useValue: { logout: () => of(undefined) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminShell);
    const state = TestBed.inject(AuthStateService);
    state.setUser({
      id: '1',
      email: 'admin@example.com',
      phone: null,
      displayName: 'Admin',
      status: 'ACTIVE',
      roles: ['admin'],
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.navigation.length).toBeGreaterThan(0);
    expect(fixture.nativeElement.textContent).toContain('Dashboard');
  });
});
