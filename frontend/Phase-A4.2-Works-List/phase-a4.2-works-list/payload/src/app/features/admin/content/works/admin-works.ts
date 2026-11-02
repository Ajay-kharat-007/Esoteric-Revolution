import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { BackendApiError } from '../../../../core/interceptors/api-error.interceptor';
import { AdminWorkListItem, PublicationStatus } from './admin-works.models';
import { AdminWorksService } from './admin-works.service';
@Component({
  selector: 'els-admin-works',
  imports: [FormsModule],
  templateUrl: './admin-works.html',
  styleUrl: './admin-works.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminWorks {
  private readonly service = inject(AdminWorksService);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly works = signal<AdminWorkListItem[]>([]);
  readonly query = signal('');
  readonly status = signal<'ALL' | PublicationStatus>('ALL');
  readonly language = signal('ALL');
  readonly languages = computed(() =>
    [...new Map(this.works().map((w) => [w.language.code, w.language])).values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  );
  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.works().filter(
      (w) =>
        (this.status() === 'ALL' || w.status === this.status()) &&
        (this.language() === 'ALL' || w.language.code === this.language()) &&
        (!q ||
          [w.publishedVersion?.title, w.slug, w.publishedVersion?.summary].some((v) =>
            v?.toLowerCase().includes(q),
          )),
    );
  });
  readonly counts = computed(() => ({
    total: this.works().length,
    published: this.works().filter((w) => w.status === 'PUBLISHED').length,
    review: this.works().filter((w) => w.status === 'IN_REVIEW' || w.status === 'APPROVED').length,
    draft: this.works().filter((w) => w.status === 'DRAFT').length,
  }));
  constructor() {
    this.load();
  }
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.service
      .list()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (w) => this.works.set(w),
        error: (e: Partial<BackendApiError>) =>
          this.error.set(
            e.correlationId
              ? `Works could not be loaded. Reference: ${e.correlationId}`
              : 'Works could not be loaded. Please try again.',
          ),
      });
  }
  clearFilters(): void {
    this.query.set('');
    this.status.set('ALL');
    this.language.set('ALL');
  }
  title(w: AdminWorkListItem): string {
    return w.publishedVersion?.title || this.fromSlug(w.slug);
  }
  fromSlug(v: string): string {
    return v.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  label(v: string): string {
    return v
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  date(v: string): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(v));
  }
  trackById(_i: number, w: AdminWorkListItem): string {
    return w.id;
  }
}
