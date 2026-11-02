import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../../core/auth/auth-api.service';

@Component({
  selector: 'els-admin-reset-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-reset-password.html',
  styleUrl: '../shared-auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminResetPassword {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthApiService);
  private readonly route = inject(ActivatedRoute);
  readonly submitting = signal(false);
  readonly success = signal(false);
  readonly error = signal<string | null>(null);
  readonly token = this.route.snapshot.queryParamMap.get('token') ?? '';
  readonly form = this.fb.nonNullable.group({
    password: ['', [Validators.required, Validators.minLength(10)]],
    confirmPassword: ['', Validators.required],
  });

  submit(): void {
    this.error.set(null);
    if (!this.token) {
      this.error.set('This password reset link is invalid or incomplete.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { password, confirmPassword } = this.form.getRawValue();
    if (password !== confirmPassword) {
      this.error.set('The passwords do not match.');
      return;
    }
    this.submitting.set(true);
    this.form.disable();
    this.auth
      .resetPassword({ token: this.token, password, revokeAllSessions: true })
      .pipe(
        finalize(() => {
          this.submitting.set(false);
          this.form.enable();
        }),
      )
      .subscribe({
        next: () => this.success.set(true),
        error: () =>
          this.error.set('This reset link is invalid, expired, or has already been used.'),
      });
  }
}
