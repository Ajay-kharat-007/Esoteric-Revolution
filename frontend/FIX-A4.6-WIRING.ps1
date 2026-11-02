$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\angular.json')) {
    throw 'Run this script from the Angular frontend root.'
}

$HtmlFile = '.\src\app\features\admin\content\work-workspace\admin-work-workspace.html'
$ScssFile = '.\src\app\features\admin\content\work-workspace\admin-work-workspace.scss'
$RoutesFile = '.\src\app\app.routes.ts'

foreach ($File in @($HtmlFile, $ScssFile, $RoutesFile)) {
    if (-not (Test-Path $File)) { throw "Required file not found: $File" }
}

$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$Backup = ".\.a4.6-wiring-backup-$Stamp"
New-Item -ItemType Directory -Path $Backup -Force | Out-Null
Copy-Item $HtmlFile (Join-Path $Backup 'admin-work-workspace.html') -Force
Copy-Item $ScssFile (Join-Path $Backup 'admin-work-workspace.scss') -Force
Copy-Item $RoutesFile (Join-Path $Backup 'app.routes.ts') -Force

$Html = Get-Content $HtmlFile -Raw

$OldVersions = @'
      <button type="button" disabled>Versions <small>A4.6</small></button
      ><button type="button" disabled>Media <small>A4.7</small></button
'@

$NewVersions = @'
      <button
        type="button"
        [class.active]="activeTab() === 'versions'"
        (click)="selectTab('versions')"
      >
        Versions
      </button>
      <button type="button" disabled>Media <small>A4.7</small></button
'@

if (-not $Html.Contains($OldVersions)) {
    throw 'Exact disabled Versions markup was not found. No files were changed.'
}
$Html = $Html.Replace($OldVersions, $NewVersions)

$OldLesson = @'
                        <button type="button" disabled title="Lesson editor arrives in A4.6">
                          ›
                        </button>
'@

$NewLesson = @'
                        <a
                          class="lesson-open"
                          [routerLink]="['/admin/content/lessons', lesson.id]"
                          [attr.aria-label]="'Open ' + lesson.title + ' in Lesson Editor'"
                          title="Open Lesson Editor"
                        >
                          ›
                        </a>
'@

if (-not $Html.Contains($OldLesson)) {
    throw 'Exact disabled Lesson button markup was not found. No files were changed.'
}
$Html = $Html.Replace($OldLesson, $NewLesson)
Set-Content $HtmlFile $Html -Encoding UTF8

$Scss = Get-Content $ScssFile -Raw
if ($Scss -notmatch '\.lesson-open\s*\{') {
    $Scss += @'

.lesson-open {
  width: 2.3rem;
  height: 2.3rem;
  display: grid;
  place-items: center;
  border: 1px solid var(--els-color-border);
  border-radius: 50%;
  color: var(--els-color-ink);
  text-decoration: none;
}

.lesson-open:hover,
.lesson-open:focus-visible {
  border-color: var(--els-color-rust);
  background: var(--els-color-paper-soft);
  color: var(--els-color-rust);
}
'@
    Set-Content $ScssFile $Scss -Encoding UTF8
}

$Routes = Get-Content $RoutesFile -Raw
if ($Routes -notmatch "path:\s*'content/lessons/:id'") {
    throw 'Lesson Editor route is missing. The HTML changes were applied, but route verification failed. Restore from backup and inspect app.routes.ts.'
}

function Run-Step([string]$Name, [scriptblock]$Command) {
    Write-Host "Running $Name..." -ForegroundColor Cyan
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE" }
}

Run-Step 'format' { npm run format }
Run-Step 'build' { npm run build }
Run-Step 'tests' { npm test -- --watch=false }

$FinalHtml = Get-Content $HtmlFile -Raw
if ($FinalHtml -notmatch "selectTab\('versions'\)" -or $FinalHtml -match 'disabled>Versions') {
    throw 'Post-verification failed: Versions tab is not correctly enabled.'
}
if ($FinalHtml -notmatch '/admin/content/lessons') {
    throw 'Post-verification failed: Lesson Editor link is missing.'
}

Write-Host ''
Write-Host 'A4.6 wiring fixed successfully.' -ForegroundColor Green
Write-Host "Backup: $Backup" -ForegroundColor Cyan
Write-Host 'Versions tab and Lesson Editor links are now enabled.' -ForegroundColor Green
