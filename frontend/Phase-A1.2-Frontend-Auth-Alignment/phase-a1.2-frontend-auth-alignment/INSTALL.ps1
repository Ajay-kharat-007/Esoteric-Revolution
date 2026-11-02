$ErrorActionPreference = 'Stop'
$PackageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Get-Location).Path
if (-not (Test-Path (Join-Path $ProjectRoot 'angular.json'))) { throw 'Run INSTALL.ps1 from the Angular frontend root.' }
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$Backup = Join-Path $ProjectRoot ".phase-a1.2-backup-$Stamp"
New-Item -ItemType Directory -Force $Backup | Out-Null
$files = @(
  'src\app\core\auth\auth.models.ts',
  'src\app\core\auth\auth-state.service.ts',
  'src\app\core\auth\auth-api.service.ts',
  'src\app\core\auth\auth-state.service.spec.ts',
  'src\app\core\interceptors\api-error.interceptor.ts'
)
foreach ($file in $files) {
  if (Test-Path $file) {
    $dest = Join-Path $Backup $file
    New-Item -ItemType Directory -Force (Split-Path $dest -Parent) | Out-Null
    Copy-Item $file $dest -Force
  }
}
Copy-Item (Join-Path $PackageRoot 'payload\src\*') (Join-Path $ProjectRoot 'src') -Recurse -Force
function Run-Step([string]$Name, [scriptblock]$Command) {
  Write-Host "Running $Name..." -ForegroundColor Cyan
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE" }
}
Run-Step 'format' { npm run format }
Run-Step 'build' { npm run build }
Run-Step 'tests' { npm test -- --watch=false }
Write-Host 'Phase A1.2 Frontend Auth Alignment completed successfully.' -ForegroundColor Green
Write-Host "Backup: $Backup" -ForegroundColor Cyan
