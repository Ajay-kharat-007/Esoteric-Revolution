$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\angular.json')) {
    throw 'Run this script from the Angular frontend root.'
}

$PackageRoot = '.\Phase-A4.6B-Admin-Content-Editor\phase-a4.6b-admin-content-editor'
$PayloadRoot = Join-Path $PackageRoot 'payload\src'
$WorkspaceTsPath = '.\src\app\features\admin\content\work-workspace\admin-work-workspace.ts'
$WorkspaceHtmlPath = '.\src\app\features\admin\content\work-workspace\admin-work-workspace.html'

foreach ($RequiredPath in @($PayloadRoot, $WorkspaceTsPath, $WorkspaceHtmlPath)) {
    if (-not (Test-Path $RequiredPath)) {
        throw "Required path not found: $RequiredPath"
    }
}

$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$BackupFolder = ".\.phase-a4.6b-fix-backup-$Stamp"
New-Item -ItemType Directory -Path $BackupFolder -Force | Out-Null
Copy-Item $WorkspaceTsPath (Join-Path $BackupFolder 'admin-work-workspace.ts') -Force
Copy-Item $WorkspaceHtmlPath (Join-Path $BackupFolder 'admin-work-workspace.html') -Force

Copy-Item (Join-Path $PayloadRoot '*') '.\src' -Recurse -Force

$WorkspaceSource = Get-Content $WorkspaceTsPath -Raw

if ($WorkspaceSource -notmatch 'AdminContentEditor') {
    $ServiceImport = "import { AdminWorkWorkspaceService } from './admin-work-workspace.service';"
    $EditorImports = @"
import { AdminContentEditor } from './admin-content-editor';
import {
  WorkContentDocument,
  WorkPreviewDocument,
} from './admin-content-editor.models';
import { AdminWorkWorkspaceService } from './admin-work-workspace.service';
"@

    if (-not $WorkspaceSource.Contains($ServiceImport)) {
        throw 'Expected AdminWorkWorkspaceService import was not found.'
    }
    $WorkspaceSource = $WorkspaceSource.Replace($ServiceImport, $EditorImports.TrimEnd())

    $OldImports = 'imports: [ReactiveFormsModule, RouterLink],'
    $NewImports = 'imports: [ReactiveFormsModule, RouterLink, AdminContentEditor],'
    if (-not $WorkspaceSource.Contains($OldImports)) {
        throw 'Expected component imports array was not found.'
    }
    $WorkspaceSource = $WorkspaceSource.Replace($OldImports, $NewImports)

    $OldVersionForm = @"
  readonly workVersionForm = this.fb.nonNullable.group({
    title: ['', Validators.required],
    summary: ['', Validators.required],
    subtitle: [''],
    description: [''],
    contentJson: ['{}'],
    previewJson: ['{}'],
  });
"@

    $NewVersionForm = @"
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
"@

    if (-not $WorkspaceSource.Contains($OldVersionForm.TrimEnd())) {
        throw 'Expected raw JSON version form was not found.'
    }
    $WorkspaceSource = $WorkspaceSource.Replace($OldVersionForm.TrimEnd(), $NewVersionForm.TrimEnd())

    $OldJsonParsing = @"
    const value = this.workVersionForm.getRawValue();
    let content: Record<string, unknown>;
    let preview: Record<string, unknown>;
    try {
      content = JSON.parse(value.contentJson) as Record<string, unknown>;
      preview = JSON.parse(value.previewJson) as Record<string, unknown>;
    } catch {
      this.mutationError.set('Content or preview JSON is invalid.');
      return;
    }
"@

    $NewJsonState = @"
    const value = this.workVersionForm.getRawValue();
    const content = this.versionContent();
    const preview = this.versionPreview();
"@

    if (-not $WorkspaceSource.Contains($OldJsonParsing.TrimEnd())) {
        throw 'Expected JSON parsing block was not found.'
    }
    $WorkspaceSource = $WorkspaceSource.Replace($OldJsonParsing.TrimEnd(), $NewJsonState.TrimEnd())

    $OldReset = @"
        this.workVersionForm.reset({
          title: '',
          summary: '',
          subtitle: '',
          description: '',
          contentJson: '{}',
          previewJson: '{}',
        });
"@

    $NewReset = @"
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
"@

    if (-not $WorkspaceSource.Contains($OldReset.TrimEnd())) {
        throw 'Expected Work version reset block was not found.'
    }
    $WorkspaceSource = $WorkspaceSource.Replace($OldReset.TrimEnd(), $NewReset.TrimEnd())

    Set-Content $WorkspaceTsPath $WorkspaceSource -Encoding UTF8
}

$WorkspaceMarkup = Get-Content $WorkspaceHtmlPath -Raw
if ($WorkspaceMarkup -notmatch '<els-admin-content-editor') {
    $OldContentJson = @"
              <label class="full"
                >Content JSON<textarea rows="7" formControlName="contentJson"></textarea
              ></label>
              <label class="full"
                >Preview JSON<textarea rows="5" formControlName="previewJson"></textarea
              ></label>
"@

    $NewContentEditor = @"
              <div class="full">
                <els-admin-content-editor
                  [initialContent]="versionContent()"
                  [initialPreview]="versionPreview()"
                  (contentChange)="versionContent.set(`$event)"
                  (previewChange)="versionPreview.set(`$event)"
                />
              </div>
"@

    if (-not $WorkspaceMarkup.Contains($OldContentJson.TrimEnd())) {
        throw 'Expected formatted raw JSON fields were not found.'
    }
    $WorkspaceMarkup = $WorkspaceMarkup.Replace($OldContentJson.TrimEnd(), $NewContentEditor.TrimEnd())
    Set-Content $WorkspaceHtmlPath $WorkspaceMarkup -Encoding UTF8
}

function Run-Step([string]$Name, [scriptblock]$Command) {
    Write-Host "Running $Name..." -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) {
        throw "$Name failed with exit code $LASTEXITCODE"
    }
}

Run-Step 'format' { npm run format }
Run-Step 'build' { npm run build }
Run-Step 'tests' { npm test -- --watch=false }

$VerifiedSource = Get-Content $WorkspaceTsPath -Raw
$VerifiedMarkup = Get-Content $WorkspaceHtmlPath -Raw
if ($VerifiedSource -notmatch 'AdminContentEditor' -or $VerifiedSource -match 'contentJson') {
    throw 'Post-check failed for Workspace TypeScript.'
}
if ($VerifiedMarkup -notmatch '<els-admin-content-editor' -or $VerifiedMarkup -match 'Content JSON') {
    throw 'Post-check failed for Workspace markup.'
}

Write-Host ''
Write-Host 'Phase A4.6B Admin Content Editor installed successfully.' -ForegroundColor Green
Write-Host "Backup: $BackupFolder" -ForegroundColor Cyan
