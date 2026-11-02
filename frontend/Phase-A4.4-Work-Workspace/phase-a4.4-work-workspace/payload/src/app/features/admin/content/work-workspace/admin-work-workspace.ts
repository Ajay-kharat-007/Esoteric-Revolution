import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BackendApiError } from '../../../../core/interceptors/api-error.interceptor';
import { WorkContext } from './admin-work-workspace.models';
import { AdminWorkWorkspaceService } from './admin-work-workspace.service';
@Component({
  selector: 'els-admin-work-workspace',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-work-workspace.html',
  styleUrl: './admin-work-workspace.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminWorkWorkspace {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AdminWorkWorkspaceService);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly saved = signal(false);
  readonly work = signal<WorkContext | null>(null);
  readonly latest = computed(() => this.work()?.versions[0] ?? null);
  readonly lessonCount = computed(
    () => this.work()?.modules.reduce((n, m) => n + m.lessons.length, 0) ?? 0,
  );
  readonly form = this.fb.nonNullable.group({
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    introductionVideoUrl: [''],
    introductionVideoTitle: ['', [Validators.maxLength(200)]],
    introductionVideoCaptionInfo: [''],
  });
  constructor() {
    this.load();
  }
  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Work identifier is missing.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.service
      .get(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (w) => {
          this.work.set(w);
          this.form.reset({
            slug: w.slug,
            introductionVideoUrl: w.introductionVideoUrl ?? '',
            introductionVideoTitle: w.introductionVideoTitle ?? '',
            introductionVideoCaptionInfo: w.introductionVideoCaptionInfo ?? '',
          });
        },
        error: (e: Partial<BackendApiError>) =>
          this.error.set(
            e.status === 404
              ? 'This Work no longer exists.'
              : e.correlationId
                ? `Work could not be loaded. Reference: ${e.correlationId}`
                : 'Work could not be loaded.',
          ),
      });
  }
  save(): void {
    const w = this.work();
    this.saved.set(false);
    this.saveError.set(null);
    if (!w || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.form.disable();
    this.service
      .update(w.id, {
        slug: v.slug.trim(),
        introductionVideoUrl: v.introductionVideoUrl.trim(),
        ...(v.introductionVideoTitle.trim()
          ? { introductionVideoTitle: v.introductionVideoTitle.trim() }
          : {}),
        ...(v.introductionVideoCaptionInfo.trim()
          ? { introductionVideoCaptionInfo: v.introductionVideoCaptionInfo.trim() }
          : {}),
      })
      .pipe(
        finalize(() => {
          this.saving.set(false);
          this.form.enable();
        }),
      )
      .subscribe({
        next: (u) => {
          this.work.update((old) => (old ? { ...old, ...u } : u));
          this.form.markAsPristine();
          this.saved.set(true);
        },
        error: (e: Partial<BackendApiError>) => {
          const m = Array.isArray(e.message) ? e.message.join(' ') : (e.message ?? '');
          this.saveError.set(
            e.status === 409
              ? 'That slug is already used by another Work.'
              : m || 'Changes could not be saved.',
          );
        },
      });
  }
  @HostListener('window:beforeunload', ['$event']) protect(e: BeforeUnloadEvent): void {
    if (this.form.dirty && !this.saving()) e.preventDefault();
  }
  title(): string {
    return (
      this.latest()?.title ??
      this.work()
        ?.slug.replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase()) ??
      'Work'
    );
  }
  label(v: string): string {
    return v
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  date(v: string | null): string {
    return v
      ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(v))
      : 'Not published';
  }
}
