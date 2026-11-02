import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BackendApiError } from '../../../../core/interceptors/api-error.interceptor';
import { LessonContext } from './admin-lesson-editor.models';
import { AdminLessonEditorService } from './admin-lesson-editor.service';
@Component({
  selector: 'els-admin-lesson-editor',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-lesson-editor.html',
  styleUrl: './admin-lesson-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLessonEditor {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AdminLessonEditorService);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly creating = signal(false);
  readonly error = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly lesson = signal<LessonContext | null>(null);
  readonly metadata = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    summary: ['', Validators.maxLength(500)],
    position: [1, [Validators.required, Validators.min(1)]],
  });
  readonly version = this.fb.nonNullable.group({
    contentJson: ['{\n  "type": "document",\n  "blocks": []\n}', Validators.required],
    transcript: [''],
    durationSeconds: [0, [Validators.min(0)]],
  });
  constructor() {
    this.load();
  }
  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set('Lesson identifier is missing.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.service
      .get(id)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (l) => {
          this.lesson.set(l);
          this.metadata.reset({ title: l.title, summary: l.summary ?? '', position: l.position });
        },
        error: (e: Partial<BackendApiError>) =>
          this.error.set(
            e.status === 404
              ? 'Lesson not found.'
              : e.correlationId
                ? `Lesson could not be loaded. Reference: ${e.correlationId}`
                : 'Lesson could not be loaded.',
          ),
      });
  }
  saveMetadata(): void {
    const l = this.lesson();
    if (!l || this.metadata.invalid) {
      this.metadata.markAllAsTouched();
      return;
    }
    const v = this.metadata.getRawValue();
    this.saving.set(true);
    this.actionError.set(null);
    this.service
      .update(l.id, {
        title: v.title.trim(),
        summary: v.summary.trim(),
        position: Number(v.position),
      })
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => {
          this.metadata.markAsPristine();
          this.load();
        },
        error: (e) => this.actionError.set(this.message(e, 'Lesson metadata could not be saved.')),
      });
  }
  createVersion(): void {
    const l = this.lesson();
    if (!l || this.version.invalid) return;
    let content: Record<string, unknown>;
    try {
      content = JSON.parse(this.version.controls.contentJson.value) as Record<string, unknown>;
    } catch {
      this.actionError.set('Content JSON is invalid. Correct the JSON before creating a version.');
      return;
    }
    const v = this.version.getRawValue();
    this.creating.set(true);
    this.actionError.set(null);
    this.service
      .createVersion(l.id, {
        content,
        ...(v.transcript.trim() ? { transcript: v.transcript.trim() } : {}),
        ...(Number(v.durationSeconds) > 0 ? { durationSeconds: Number(v.durationSeconds) } : {}),
      })
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: () => {
          this.version.markAsPristine();
          this.load();
        },
        error: (e) => this.actionError.set(this.message(e, 'Lesson version could not be created.')),
      });
  }
  @HostListener('window:beforeunload', ['$event']) protect(e: BeforeUnloadEvent): void {
    if (this.metadata.dirty || this.version.dirty) e.preventDefault();
  }
  date(v: string): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(v),
    );
  }
  json(v: Record<string, unknown>): string {
    return JSON.stringify(v, null, 2);
  }
  private message(e: Partial<BackendApiError>, f: string): string {
    const m = Array.isArray(e.message) ? e.message.join(' ') : e.message;
    return m || f;
  }
}
