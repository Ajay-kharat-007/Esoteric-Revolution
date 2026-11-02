import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AdminForgotPassword } from './admin-forgot-password';
describe('AdminForgotPassword', () => {
  it('creates', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminForgotPassword],
      providers: [
        provideRouter([]),
        { provide: AuthApiService, useValue: { forgotPassword: () => of({ accepted: true }) } },
      ],
    }).compileComponents();
    expect(TestBed.createComponent(AdminForgotPassword).componentInstance).toBeTruthy();
  });
});
