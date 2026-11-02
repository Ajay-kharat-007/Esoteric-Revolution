import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthApiService } from '../../../../core/auth/auth-api.service';

@Component({
  selector: 'els-admin-forgot-password',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-forgot-password.html',
  styleUrl: '../shared-auth.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthApiService);
  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly form = this.fb.nonNullable.group({ identifier: ['', Validators.required] });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.form.disable();
    this.auth
      .forgotPassword(this.form.getRawValue())
      .pipe(
        finalize(() => {
          this.submitting.set(false);
          this.form.enable();
        }),
      )
      .subscribe({
        next: () => this.submitted.set(true),
        error: () => this.submitted.set(true),
      });
  }
}
