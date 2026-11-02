import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AdminLogin } from './admin-login';

describe('AdminLogin', () => {
  let fixture: ComponentFixture<AdminLogin>;
  const auth = {
    login: vi.fn(() =>
      of({
        id: '1',
        email: 'admin@example.com',
        phone: null,
        displayName: 'Admin',
        status: 'ACTIVE',
        roles: ['admin'],
      }),
    ),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLogin],
      providers: [provideRouter([]), { provide: AuthApiService, useValue: auth }],
    }).compileComponents();
    fixture = TestBed.createComponent(AdminLogin);
    fixture.detectChanges();
  });

  it('creates the login page', () => expect(fixture.componentInstance).toBeTruthy());

  it('does not submit an empty form', () => {
    fixture.componentInstance.submit();
    expect(auth.login).not.toHaveBeenCalled();
  });
});
