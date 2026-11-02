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
import { WorkContext, WorkModule } from './admin-work-workspace.models';
import { AdminContentEditor } from './admin-content-editor';
import { WorkContentDocument, WorkPreviewDocument } from './admin-content-editor.models';
import { AdminWorkWorkspaceService } from './admin-work-workspace.service';

type WorkspaceTab =
  'overview' | 'curriculum' | 'versions' | 'media' | 'sources' | 'rights' | 'publishing';

@Component({
  selector: 'els-admin-work-workspace',
  imports: [ReactiveFormsModule, RouterLink, AdminContentEditor],
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
  readonly mutating = signal(false);
  readonly error = signal<string | null>(null);
  readonly saveError = signal<string | null>(null);
  readonly mutationError = signal<string | null>(null);
  readonly saved = signal(false);
  readonly work = signal<WorkContext | null>(null);
  readonly activeTab = signal<WorkspaceTab>('overview');
  readonly addingModule = signal(false);
  readonly editingModuleId = signal<string | null>(null);
  readonly addingLessonTo = signal<string | null>(null);
  readonly creatingWorkVersion = signal(false);
  readonly latest = computed(() => this.work()?.versions[0] ?? null);
  readonly lessonCount = computed(
    () => this.work()?.modules.reduce((count, module) => count + module.lessons.length, 0) ?? 0,
  );

  readonly form = this.fb.nonNullable.group({
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    introductionVideoUrl: [''],
    introductionVideoTitle: ['', Validators.maxLength(200)],
    introductionVideoCaptionInfo: [''],
  });

  readonly versionContent = signal<WorkContentDocument>({
    type: 'document',
    version: 1,
    blocks: [],
  });
  readonly versionPreview = signal<WorkPreviewDocument>({
    type: 'preview',
    version: 1,
    excerpt: '',
    featuredSections: [],
    estimatedReadMinutes: 5,
  });
  readonly workVersionForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    summary: ['', Validators.required],
    subtitle: [''],
    description: [''],
  });
  readonly moduleForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    summary: ['', Validators.maxLength(500)],
    position: [1, [Validators.required, Validators.min(1)]],
  });

  readonly lessonForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)]],
    summary: ['', Validators.maxLength(500)],
    position: [1, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    this.load();
    this.lessonForm.controls.title.valueChanges.subscribe((title) => {
      if (!this.lessonForm.controls.slug.dirty)
        this.lessonForm.controls.slug.setValue(this.slugify(title), { emitEvent: false });
    });
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
        next: (work) => {
          this.work.set({
            ...work,
            modules: [...work.modules]
              .sort((a, b) => a.position - b.position)
              .map((module) => ({
                ...module,
                lessons: [...module.lessons].sort((a, b) => a.position - b.position),
              })),
          });
          this.form.reset({
            slug: work.slug,
            introductionVideoUrl: work.introductionVideoUrl ?? '',
            introductionVideoTitle: work.introductionVideoTitle ?? '',
            introductionVideoCaptionInfo: work.introductionVideoCaptionInfo ?? '',
          });
        },
        error: (error: Partial<BackendApiError>) =>
          this.error.set(
            error.status === 404
              ? 'This Work no longer exists.'
              : error.correlationId
                ? `Work could not be loaded. Reference: ${error.correlationId}`
                : 'Work could not be loaded.',
          ),
      });
  }

  selectTab(tab: WorkspaceTab): void {
    this.activeTab.set(tab);
    this.mutationError.set(null);
  }

  save(): void {
    const work = this.work();
    this.saved.set(false);
    this.saveError.set(null);
    if (!work || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    this.saving.set(true);
    this.form.disable();
    this.service
      .update(work.id, {
        slug: value.slug.trim(),
        introductionVideoUrl: value.introductionVideoUrl.trim(),
        introductionVideoTitle: value.introductionVideoTitle.trim(),
        introductionVideoCaptionInfo: value.introductionVideoCaptionInfo.trim(),
      })
      .pipe(
        finalize(() => {
          this.saving.set(false);
          this.form.enable();
        }),
      )
      .subscribe({
        next: (updated) => {
          this.work.update((current) => (current ? { ...current, ...updated } : updated));
          this.form.markAsPristine();
          this.saved.set(true);
        },
        error: (error: Partial<BackendApiError>) =>
          this.saveError.set(this.apiMessage(error, 'Changes could not be saved.')),
      });
  }

  openAddModule(): void {
    const next = (this.work()?.modules.length ?? 0) + 1;
    this.moduleForm.reset({ title: '', summary: '', position: next });
    this.editingModuleId.set(null);
    this.addingLessonTo.set(null);
    this.addingModule.set(true);
  }

  openEditModule(module: WorkModule): void {
    this.moduleForm.reset({
      title: module.title,
      summary: module.summary ?? '',
      position: module.position,
    });
    this.addingModule.set(false);
    this.addingLessonTo.set(null);
    this.editingModuleId.set(module.id);
  }

  cancelModuleForm(): void {
    this.addingModule.set(false);
    this.editingModuleId.set(null);
    this.moduleForm.reset();
  }

  submitModule(): void {
    const work = this.work();
    if (!work || this.moduleForm.invalid) {
      this.moduleForm.markAllAsTouched();
      return;
    }
    const value = this.moduleForm.getRawValue();
    const payload = {
      title: value.title.trim(),
      summary: value.summary.trim(),
      position: Number(value.position),
    };
    this.mutating.set(true);
    this.mutationError.set(null);
    const request = this.editingModuleId()
      ? this.service.updateModule(this.editingModuleId()!, payload)
      : this.service.createModule(work.id, payload);
    request.pipe(finalize(() => this.mutating.set(false))).subscribe({
      next: () => {
        this.cancelModuleForm();
        this.load();
        this.activeTab.set('curriculum');
      },
      error: (error: Partial<BackendApiError>) =>
        this.mutationError.set(this.apiMessage(error, 'The module could not be saved.')),
    });
  }

  openAddLesson(module: WorkModule): void {
    this.lessonForm.reset({
      title: '',
      slug: '',
      summary: '',
      position: module.lessons.length + 1,
    });
    this.lessonForm.markAsPristine();
    this.addingModule.set(false);
    this.editingModuleId.set(null);
    this.addingLessonTo.set(module.id);
  }

  cancelLesson(): void {
    this.addingLessonTo.set(null);
    this.lessonForm.reset();
  }

  submitLesson(): void {
    const moduleId = this.addingLessonTo();
    if (!moduleId || this.lessonForm.invalid) {
      this.lessonForm.markAllAsTouched();
      return;
    }
    const value = this.lessonForm.getRawValue();
    this.mutating.set(true);
    this.mutationError.set(null);
    this.service
      .createLesson(moduleId, {
        title: value.title.trim(),
        slug: value.slug.trim(),
        summary: value.summary.trim(),
        position: Number(value.position),
      })
      .pipe(finalize(() => this.mutating.set(false)))
      .subscribe({
        next: () => {
          this.cancelLesson();
          this.load();
          this.activeTab.set('curriculum');
        },
        error: (error: Partial<BackendApiError>) =>
          this.mutationError.set(this.apiMessage(error, 'The lesson could not be created.')),
      });
  }

  createWorkVersion(): void {
    const work = this.work();
    if (!work || this.workVersionForm.invalid) {
      this.workVersionForm.markAllAsTouched();
      return;
    }
    const value = this.workVersionForm.getRawValue();
    const content = this.versionContent();
    const preview = this.versionPreview();
    this.creatingWorkVersion.set(true);
    this.mutationError.set(null);
    this.service
      .createWorkVersion(work.id, {
        title: value.title.trim(),
        summary: value.summary.trim(),
        ...(value.subtitle.trim() ? { subtitle: value.subtitle.trim() } : {}),
        ...(value.description.trim() ? { description: value.description.trim() } : {}),
        content,
        preview,
      })
      .pipe(finalize(() => this.creatingWorkVersion.set(false)))
      .subscribe({
        next: () => {
          this.workVersionForm.reset({
            title: '',
            summary: '',
            subtitle: '',
            description: '',
          });
          this.versionContent.set({ type: 'document', version: 1, blocks: [] });
          this.versionPreview.set({
            type: 'preview',
            version: 1,
            excerpt: '',
            featuredSections: [],
            estimatedReadMinutes: 5,
          });
          this.load();
          this.activeTab.set('versions');
        },
        error: (error: Partial<BackendApiError>) =>
          this.mutationError.set(this.apiMessage(error, 'Work version could not be created.')),
      });
  }
  @HostListener('window:beforeunload', ['$event']) protect(event: BeforeUnloadEvent): void {
    if (
      (this.form.dirty || this.moduleForm.dirty || this.lessonForm.dirty) &&
      !this.saving() &&
      !this.mutating()
    )
      event.preventDefault();
  }
  title(): string {
    return (
      this.latest()?.title ??
      this.work()
        ?.slug.replace(/-/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase()) ??
      'Work'
    );
  }
  label(value: string): string {
    return value
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }
  date(value: string | null): string {
    return value
      ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
      : 'Not published';
  }
  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 180);
  }
  private apiMessage(error: Partial<BackendApiError>, fallback: string): string {
    const message = Array.isArray(error.message) ? error.message.join(' ') : error.message;
    return (
      message || (error.correlationId ? `${fallback} Reference: ${error.correlationId}` : fallback)
    );
  }
}
