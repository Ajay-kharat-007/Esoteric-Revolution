$ErrorActionPreference='Stop'
$PackageRoot=Split-Path -Parent $MyInvocation.MyCommand.Path
if(-not(Test-Path 'angular.json')){throw 'Run from Angular frontend root.'}
$Backup=".phase-a4.5-backup-$(Get-Date -Format yyyyMMdd-HHmmss)"
New-Item -ItemType Directory -Force $Backup|Out-Null
if(Test-Path 'src\app\features\admin\content\work-workspace'){Copy-Item 'src\app\features\admin\content\work-workspace' (Join-Path $Backup 'work-workspace') -Recurse -Force}
Copy-Item (Join-Path $PackageRoot 'payload\src\*') 'src' -Recurse -Force
function Run-Step([string]$Name,[scriptblock]$Command){Write-Host "Running $Name..." -ForegroundColor Cyan;& $Command;if($LASTEXITCODE -ne 0){throw "$Name failed with exit code $LASTEXITCODE"}}
Run-Step 'format' {npm run format}
Run-Step 'build' {npm run build}
Run-Step 'tests' {npm test -- --watch=false}
Write-Host 'Phase A4.5 Curriculum Builder installed successfully.' -ForegroundColor Green
Write-Host "Backup: $Backup" -ForegroundColor Cyan
