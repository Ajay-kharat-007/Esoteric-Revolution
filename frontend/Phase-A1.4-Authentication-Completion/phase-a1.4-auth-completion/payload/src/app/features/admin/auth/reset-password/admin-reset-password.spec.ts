import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AdminResetPassword } from './admin-reset-password';
describe('AdminResetPassword', () => {
  it('creates', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminResetPassword],
      providers: [
        provideRouter([]),
        { provide: AuthApiService, useValue: { resetPassword: () => of({ success: true }) } },
      ],
    }).compileComponents();
    expect(TestBed.createComponent(AdminResetPassword).componentInstance).toBeTruthy();
  });
});
