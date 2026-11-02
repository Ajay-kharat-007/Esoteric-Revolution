$ErrorActionPreference='Stop';$PackageRoot=Split-Path -Parent $MyInvocation.MyCommand.Path
if(-not(Test-Path 'angular.json')){throw 'Run from Angular frontend root.'}
$Stamp=Get-Date -Format 'yyyyMMdd-HHmmss';$Backup=".phase-a3-backup-$Stamp";New-Item -ItemType Directory -Force $Backup|Out-Null
Copy-Item 'src\app\app.routes.ts' (Join-Path $Backup 'app.routes.ts') -Force
if(Test-Path 'src\app\features\admin\dashboard'){Copy-Item 'src\app\features\admin\dashboard' (Join-Path $Backup 'dashboard') -Recurse -Force}
Remove-Item 'src\app\features\admin\dashboard\admin-dashboard-placeholder.*' -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $PackageRoot 'payload\src\*') 'src' -Recurse -Force
$routes=Get-Content 'src\app\app.routes.ts' -Raw
$routes=$routes -replace "import\('\./features/admin/dashboard/admin-dashboard-placeholder'\)\.then\(\(m\) => m\.AdminDashboardPlaceholder\)","import('./features/admin/dashboard/admin-dashboard').then((m) => m.AdminDashboard)"
Set-Content 'src\app\app.routes.ts' $routes
function Run-Step([string]$Name,[scriptblock]$Command){Write-Host "Running $Name..." -ForegroundColor Cyan;& $Command;if($LASTEXITCODE -ne 0){throw "$Name failed with exit code $LASTEXITCODE"}}
Run-Step 'format' {npm run format};Run-Step 'build' {npm run build};Run-Step 'tests' {npm test -- --watch=false}
Write-Host 'Phase A3 Admin Dashboard installed successfully.' -ForegroundColor Green;Write-Host "Backup: $Backup" -ForegroundColor Cyan
