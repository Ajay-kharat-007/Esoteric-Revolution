import { TestBed } from '@angular/core/testing';
import { AuthStateService } from './auth-state.service';

describe('AuthStateService', () => {
  it('tracks authentication and roles', () => {
    const service = TestBed.inject(AuthStateService);
    expect(service.isAuthenticated()).toBe(false);
    service.setUser({ id: '1', email: 'admin@example.com', roles: ['admin'] });
    expect(service.isAuthenticated()).toBe(true);
    expect(service.hasRole('admin')).toBe(true);
    expect(service.hasRole('learner')).toBe(false);
    service.clear();
    expect(service.isAuthenticated()).toBe(false);
  });
});
