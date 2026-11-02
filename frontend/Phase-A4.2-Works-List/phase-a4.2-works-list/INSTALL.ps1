$ErrorActionPreference='Stop';$PackageRoot=Split-Path -Parent $MyInvocation.MyCommand.Path;if(-not(Test-Path 'angular.json')){throw 'Run from Angular frontend root.'}
$Stamp=Get-Date -Format 'yyyyMMdd-HHmmss';$Backup=".phase-a4.2-backup-$Stamp";New-Item -ItemType Directory -Force $Backup|Out-Null
foreach($item in @('src\app\app.routes.ts','src\app\layouts\admin-shell\admin-navigation.ts')){Copy-Item $item (Join-Path $Backup (Split-Path $item -Leaf)) -Force}
Copy-Item (Join-Path $PackageRoot 'payload\src\*') 'src' -Recurse -Force
$routes=Get-Content 'src\app\app.routes.ts' -Raw
$needle="{ path: 'dashboard', title: 'Admin Dashboard | The Esoteric Library', loadComponent: () => import('./features/admin/dashboard/admin-dashboard').then((m) => m.AdminDashboard) },"
$insert=$needle+"`r`n      { path: 'content/works', title: 'Works | The Esoteric Library', loadComponent: () => import('./features/admin/content/works/admin-works').then((m) => m.AdminWorks) },"
if($routes -notmatch "path: 'content/works'"){$routes=$routes.Replace($needle,$insert)}
Set-Content 'src\app\app.routes.ts' $routes
$nav=Get-Content 'src\app\layouts\admin-shell\admin-navigation.ts' -Raw
$nav=$nav -replace "(label: 'Works', route: '/admin/content/works', icon: '◫', enabled:) false","`$1 true"
Set-Content 'src\app\layouts\admin-shell\admin-navigation.ts' $nav
function Run-Step([string]$Name,[scriptblock]$Command){Write-Host "Running $Name..." -ForegroundColor Cyan;& $Command;if($LASTEXITCODE -ne 0){throw "$Name failed with exit code $LASTEXITCODE"}}
Run-Step 'format' {npm run format};Run-Step 'build' {npm run build};Run-Step 'tests' {npm test -- --watch=false}
Write-Host 'Phase A4.2 Works List installed successfully.' -ForegroundColor Green;Write-Host "Backup: $Backup" -ForegroundColor Cyan
