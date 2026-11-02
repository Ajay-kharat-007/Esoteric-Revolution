$ErrorActionPreference='Stop';$PackageRoot=Split-Path -Parent $MyInvocation.MyCommand.Path;$ProjectRoot=(Get-Location).Path
if(-not(Test-Path 'angular.json')){throw 'Run from Angular frontend root.'}
$Stamp=Get-Date -Format 'yyyyMMdd-HHmmss';$Backup=Join-Path $ProjectRoot ".phase-a2-backup-$Stamp";New-Item -ItemType Directory -Force $Backup|Out-Null
foreach($item in @('src\app\app.routes.ts','src\app\layouts\admin-shell','src\app\features\admin\dashboard\admin-dashboard-placeholder.scss')){if(Test-Path $item){$dest=Join-Path $Backup $item;New-Item -ItemType Directory -Force (Split-Path $dest -Parent)|Out-Null;Copy-Item $item $dest -Recurse -Force}}
Copy-Item (Join-Path $PackageRoot 'payload\src\*') (Join-Path $ProjectRoot 'src') -Recurse -Force
function Run-Step([string]$Name,[scriptblock]$Command){Write-Host "Running $Name..." -ForegroundColor Cyan;& $Command;if($LASTEXITCODE -ne 0){throw "$Name failed with exit code $LASTEXITCODE"}}
Run-Step 'format' {npm run format};Run-Step 'build' {npm run build};Run-Step 'tests' {npm test -- --watch=false}
Write-Host 'Phase A2 Admin Shell installed successfully.' -ForegroundColor Green;Write-Host "Backup: $Backup" -ForegroundColor Cyan
