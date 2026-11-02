$ErrorActionPreference='Stop';$PackageRoot=Split-Path -Parent $MyInvocation.MyCommand.Path
if(-not(Test-Path 'angular.json')){throw 'Run from Angular frontend root.'}
$Stamp=Get-Date -Format 'yyyyMMdd-HHmmss';$Backup=".phase-a4.3-backup-$Stamp";New-Item -ItemType Directory -Force $Backup|Out-Null
foreach($item in @('src\app\app.routes.ts','src\app\features\admin\content\works\admin-works.html')){if(Test-Path $item){$dest=Join-Path $Backup (Split-Path $item -Leaf);Copy-Item $item $dest -Force}}
Copy-Item (Join-Path $PackageRoot 'payload\src\*') 'src' -Recurse -Force
$routes=Get-Content 'src\app\app.routes.ts' -Raw
$works="{ path: 'content/works', title: 'Works | The Esoteric Library', loadComponent: () => import('./features/admin/content/works/admin-works').then((m) => m.AdminWorks) },"
$create="{ path: 'content/works/new', title: 'Create Work | The Esoteric Library', loadComponent: () => import('./features/admin/content/create-work/admin-create-work').then((m) => m.AdminCreateWork) },"
if($routes -notmatch "path: 'content/works/new'"){$routes=$routes.Replace($works,$create+"`r`n      "+$works)}
Set-Content 'src\app\app.routes.ts' $routes
$worksHtml=Get-Content 'src\app\features\admin\content\works\admin-works.html' -Raw
$worksHtml=$worksHtml -replace '<button class="create" type="button" disabled title="Create Work arrives in Phase A4.3">','<a class="create" routerLink="/admin/content/works/new">'
$worksHtml=$worksHtml -replace ' Create work <small>A4.3</small></button>',' Create work</a>'
Set-Content 'src\app\features\admin\content\works\admin-works.html' $worksHtml
$worksTs='src\app\features\admin\content\works\admin-works.ts';$source=Get-Content $worksTs -Raw
if($source -notmatch 'RouterLink'){$source=$source -replace "import\{FormsModule\}from'@angular/forms';","import{FormsModule}from'@angular/forms';import{RouterLink}from'@angular/router';";$source=$source -replace 'imports:\[FormsModule\]','imports:[FormsModule,RouterLink]';Set-Content $worksTs $source}
$worksScss='src\app\features\admin\content\works\admin-works.scss';$css=Get-Content $worksScss -Raw;$css=$css -replace '\.create\{','a.create{display:inline-flex;align-items:center;gap:.4rem;text-decoration:none;';$css=$css -replace '\.create:disabled\{[^}]+\}','';$css=$css -replace '\.create small\{[^}]+\}','';Set-Content $worksScss $css
function Run-Step([string]$Name,[scriptblock]$Command){Write-Host "Running $Name..." -ForegroundColor Cyan;& $Command;if($LASTEXITCODE -ne 0){throw "$Name failed with exit code $LASTEXITCODE"}}
Run-Step 'format' {npm run format};Run-Step 'build' {npm run build};Run-Step 'tests' {npm test -- --watch=false}
Write-Host 'Phase A4.3 Create Work installed successfully.' -ForegroundColor Green;Write-Host "Backup: $Backup" -ForegroundColor Cyan
