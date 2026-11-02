import { TestBed } from '@angular/core/testing';
import { AuthStateService } from './auth-state.service';

describe('AuthStateService', () => {
  it('tracks initialization, authentication and roles', () => {
    const service = TestBed.inject(AuthStateService);
    expect(service.initialized()).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
    service.setUser({
      id: '1',
      email: 'admin@example.com',
      phone: null,
      displayName: 'Admin',
      status: 'ACTIVE',
      roles: ['admin'],
    });
    expect(service.initialized()).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.hasRole('admin')).toBe(true);
    expect(service.hasRole('learner')).toBe(false);
    service.clear();
    expect(service.isAuthenticated()).toBe(false);
  });
});
