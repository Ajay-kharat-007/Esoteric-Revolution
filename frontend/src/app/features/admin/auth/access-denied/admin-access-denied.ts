import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthApiService } from '../../../../core/auth/auth-api.service';
@Component({
  selector: 'els-admin-access-denied',
  imports: [RouterLink],
  templateUrl: './admin-access-denied.html',
  styleUrl: './admin-access-denied.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminAccessDenied {
  private readonly auth = inject(AuthApiService);
  private readonly router = inject(Router);
  signOut(): void {
    this.auth.logout().subscribe(() => void this.router.navigateByUrl('/admin/login'));
  }
}
