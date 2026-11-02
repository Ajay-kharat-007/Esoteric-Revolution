import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { BackendApiError } from '../../../../core/interceptors/api-error.interceptor';
import { CatalogueLanguage, CreateWorkRequest } from './admin-create-work.models';
import { AdminCreateWorkService } from './admin-create-work.service';

@Component({
  selector: 'els-admin-create-work',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './admin-create-work.html',
  styleUrl: './admin-create-work.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCreateWork {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(AdminCreateWorkService);
  private readonly router = inject(Router);

  readonly loadingLanguages = signal(true);
  readonly submitting = signal(false);
  readonly languages = signal<CatalogueLanguage[]>([]);
  readonly pageError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly slugManuallyEdited = signal(false);
  readonly summaryRemaining = computed(() => 500 - this.form.controls.summary.value.length);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(160)]],
    slug: [
      '',
      [
        Validators.required,
        Validators.pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        Validators.maxLength(180),
      ],
    ],
    languageCode: ['', Validators.required],
    summary: ['', Validators.maxLength(500)],
  });

  constructor() {
    this.loadLanguages();
    this.form.controls.title.valueChanges.subscribe((title) => {
      if (!this.slugManuallyEdited())
        this.form.controls.slug.setValue(this.slugify(title), { emitEvent: false });
    });
  }

  onSlugInput(): void {
    this.slugManuallyEdited.set(true);
    const normalized = this.slugify(this.form.controls.slug.value);
    this.form.controls.slug.setValue(normalized, { emitEvent: false });
  }

  submit(): void {
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.form.disable();
    const raw = this.form.getRawValue();
    const request: CreateWorkRequest = {
      title: raw.title.trim(),
      slug: raw.slug.trim(),
      languageCode: raw.languageCode,
      ...(raw.summary.trim() ? { summary: raw.summary.trim() } : {}),
    };
    this.service
      .create(request)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
          this.form.enable();
        }),
      )
      .subscribe({
        next: () => {
          this.form.markAsPristine();
          void this.router.navigate(['/admin/content/works'], {
            queryParams: { created: request.slug },
          });
        },
        error: (error: Partial<BackendApiError>) => this.formError.set(this.errorMessage(error)),
      });
  }

  cancel(): void {
    if (!this.form.dirty || confirm('Discard this new Work? Unsaved information will be lost.')) {
      void this.router.navigateByUrl('/admin/content/works');
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  protectUnsavedChanges(event: BeforeUnloadEvent): void {
    if (this.form.dirty && !this.submitting()) event.preventDefault();
  }

  private loadLanguages(): void {
    this.loadingLanguages.set(true);
    this.pageError.set(null);
    this.service
      .languages()
      .pipe(finalize(() => this.loadingLanguages.set(false)))
      .subscribe({
        next: (languages) => {
          this.languages.set(languages);
          const preferred = languages.find((language) => language.code === 'en') ?? languages[0];
          if (preferred) this.form.controls.languageCode.setValue(preferred.code);
          else
            this.pageError.set(
              'No active catalogue languages are available. Add a language in the backend before creating a Work.',
            );
        },
        error: () =>
          this.pageError.set(
            'Catalogue languages could not be loaded. Please retry before creating a Work.',
          ),
      });
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

  private errorMessage(error: Partial<BackendApiError>): string {
    const message = Array.isArray(error.message) ? error.message.join(' ') : (error.message ?? '');
    if (error.status === 409 || /slug|unique|already/i.test(message))
      return 'This slug is already in use. Choose a unique URL slug.';
    if (error.status === 400)
      return message || 'Review the Work information and correct the highlighted fields.';
    return error.correlationId
      ? `The Work could not be created. Reference: ${error.correlationId}`
      : 'The Work could not be created. Please try again.';
  }
}
