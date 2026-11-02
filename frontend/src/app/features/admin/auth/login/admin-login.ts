import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { BackendApiError } from '../../../../core/interceptors/api-error.interceptor';

@Component({
  selector: 'els-admin-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLogin {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly passwordVisible = signal(false);
  readonly formError = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    identifier: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  togglePassword(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  submit(): void {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.form.disable();
    this.auth
      .login(this.form.getRawValue())
      .pipe(
        finalize(() => {
          this.submitting.set(false);
          this.form.enable();
        }),
      )
      .subscribe({
        next: () => void this.router.navigateByUrl(this.safeReturnUrl()),
        error: (error: unknown) => this.formError.set(this.messageFor(error)),
      });
  }

  private safeReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    return returnUrl?.startsWith('/admin/') && !returnUrl.startsWith('//')
      ? returnUrl
      : '/admin/dashboard';
  }

  private messageFor(error: unknown): string {
    if (error instanceof Error && error.message === 'ADMIN_ACCESS_REQUIRED') {
      return 'This account does not have access to the administration portal.';
    }
    const apiError = error as Partial<BackendApiError>;
    if (apiError.status === 429)
      return 'Too many sign-in attempts. Please wait before trying again.';
    if (apiError.status === 0)
      return 'The administration service could not be reached. Check your connection and try again.';
    if (apiError.status === 401) return 'Unable to sign in with those credentials.';
    if (apiError.status === 403) return 'This account is not permitted to access administration.';
    return 'The administration service is temporarily unavailable. Please try again.';
  }
}
