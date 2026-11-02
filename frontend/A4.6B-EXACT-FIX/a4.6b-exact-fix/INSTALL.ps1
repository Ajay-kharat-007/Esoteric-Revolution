$ErrorActionPreference = 'Stop'
if (-not (Test-Path '.\angular.json')) { throw 'Run from Angular frontend root.' }
$PackageRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Target = '.\src\app\features\admin\content\work-workspace'
$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$Backup = ".\.phase-a4.6b-exact-backup-$Stamp"
New-Item -ItemType Directory -Path $Backup -Force | Out-Null
Copy-Item "$Target\admin-work-workspace.ts" $Backup -Force
Copy-Item "$Target\admin-work-workspace.html" $Backup -Force
Copy-Item "$Target\admin-work-workspace.scss" $Backup -Force
Copy-Item (Join-Path $PackageRoot 'payload\admin-content-editor.*') $Target -Force
node (Join-Path $PackageRoot 'patch-a46b.mjs')
if ($LASTEXITCODE -ne 0) { throw "Source patch failed with exit code $LASTEXITCODE" }
function Run-Step([string]$Name, [scriptblock]$Command) { Write-Host "Running $Name..." -ForegroundColor Cyan; & $Command; if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE" } }
Run-Step 'format' { npm run format }
Run-Step 'build' { npm run build }
Run-Step 'tests' { npm test -- --watch=false }
Write-Host ''
Write-Host 'Phase A4.6B Exact Fix installed successfully.' -ForegroundColor Green
Write-Host "Backup: $Backup" -ForegroundColor Cyan
