import fs from 'node:fs';

const tsPath = 'src/app/features/admin/content/work-workspace/admin-work-workspace.ts';
const htmlPath = 'src/app/features/admin/content/work-workspace/admin-work-workspace.html';

let ts = fs.readFileSync(tsPath, 'utf8');
let html = fs.readFileSync(htmlPath, 'utf8');

function replaceOnce(source, oldValue, newValue, label) {
  const count = source.split(oldValue).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one match, found ${count}`);
  return source.replace(oldValue, newValue);
}

if (!ts.includes("import { AdminContentEditor } from './admin-content-editor';")) {
  ts = replaceOnce(
    ts,
    "import { AdminWorkWorkspaceService } from './admin-work-workspace.service';",
    "import { AdminContentEditor } from './admin-content-editor';\nimport {\n  WorkContentDocument,\n  WorkPreviewDocument,\n} from './admin-content-editor.models';\nimport { AdminWorkWorkspaceService } from './admin-work-workspace.service';",
    'editor imports',
  );
  ts = replaceOnce(
    ts,
    'imports: [ReactiveFormsModule, RouterLink],',
    'imports: [ReactiveFormsModule, RouterLink, AdminContentEditor],',
    'component imports',
  );
}

const oldForm = `  readonly workVersionForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    summary: ['', Validators.required],
    subtitle: [''],
    description: [''],
    contentJson: ['{}'],
    previewJson: ['{}'],
  });`;
const newForm = `  readonly versionContent = signal<WorkContentDocument>({
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
  });`;
if (ts.includes(oldForm)) ts = replaceOnce(ts, oldForm, newForm, 'version form');
else if (!ts.includes('readonly versionContent = signal<WorkContentDocument>'))
  throw new Error('Neither raw nor structured version form was found.');

const oldParsing = `    const value = this.workVersionForm.getRawValue();
    let content: Record<string, unknown>;
    let preview: Record<string, unknown>;
    try {
      content = JSON.parse(value.contentJson) as Record<string, unknown>;
      preview = JSON.parse(value.previewJson) as Record<string, unknown>;
    } catch {
      this.mutationError.set('Content or preview JSON is invalid.');
      return;
    }`;
const newParsing = `    const value = this.workVersionForm.getRawValue();
    const content = this.versionContent();
    const preview = this.versionPreview();`;
if (ts.includes(oldParsing)) ts = replaceOnce(ts, oldParsing, newParsing, 'JSON parsing');
else if (ts.includes('value.contentJson') || ts.includes('value.previewJson'))
  throw new Error('Unexpected JSON parsing shape remains.');

const oldReset = `          this.workVersionForm.reset({
            title: '',
            summary: '',
            subtitle: '',
            description: '',
            contentJson: '{}',
            previewJson: '{}',
          });`;
const newReset = `          this.workVersionForm.reset({
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
          });`;
if (ts.includes(oldReset)) ts = replaceOnce(ts, oldReset, newReset, 'version reset');
else if (ts.includes("contentJson: '{}'") || ts.includes("previewJson: '{}'"))
  throw new Error('Unexpected raw JSON reset remains.');

const rawJsonPattern =
  /\s*<label class="full"\s*>Content JSON<textarea rows="7" formControlName="contentJson"><\/textarea>\s*<\/label>\s*<label class="full"\s*>Preview JSON<textarea rows="5" formControlName="previewJson"><\/textarea>\s*<\/label>/m;
const editorMarkup = `
            <div class="full">
              <els-admin-content-editor
                [initialContent]="versionContent()"
                [initialPreview]="versionPreview()"
                (contentChange)="versionContent.set($event)"
                (previewChange)="versionPreview.set($event)"
              />
            </div>`;
if (rawJsonPattern.test(html)) html = html.replace(rawJsonPattern, editorMarkup);
else if (!html.includes('<els-admin-content-editor'))
  throw new Error('Raw JSON fields or structured editor markup were not found.');

fs.writeFileSync(tsPath, ts, 'utf8');
fs.writeFileSync(htmlPath, html, 'utf8');

const finalTs = fs.readFileSync(tsPath, 'utf8');
const finalHtml = fs.readFileSync(htmlPath, 'utf8');
if (
  !finalTs.includes('AdminContentEditor') ||
  finalTs.includes('contentJson') ||
  finalTs.includes('previewJson')
)
  throw new Error('TypeScript post-check failed.');
if (
  !finalHtml.includes('<els-admin-content-editor') ||
  finalHtml.includes('Content JSON') ||
  finalHtml.includes('Preview JSON')
)
  throw new Error('HTML post-check failed.');
console.log('[OK] A4.6B source wiring completed.');
