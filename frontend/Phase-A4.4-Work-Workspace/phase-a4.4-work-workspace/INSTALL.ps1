$ErrorActionPreference='Stop';$P=Split-Path -Parent $MyInvocation.MyCommand.Path;if(-not(Test-Path 'angular.json')){throw 'Run from Angular frontend root.'};$B=".phase-a4.4-backup-$(Get-Date -Format yyyyMMdd-HHmmss)";New-Item -ItemType Directory -Force $B|Out-Null
foreach($f in @('src\app\app.routes.ts','src\app\features\admin\content\works\admin-works.html','src\app\features\admin\content\works\admin-works.ts')){if(Test-Path $f){Copy-Item $f (Join-Path $B (Split-Path $f -Leaf)) -Force}}
Copy-Item (Join-Path $P 'payload\src\*') 'src' -Recurse -Force
$r=Get-Content 'src\app\app.routes.ts' -Raw
$route="{ path: 'content/works/:id', title: 'Work Workspace | The Esoteric Library', loadComponent: () => import('./features/admin/content/work-workspace/admin-work-workspace').then((m) => m.AdminWorkWorkspace) },"
$anchor="{ path: 'content/works', title: 'Works | The Esoteric Library', loadComponent: () => import('./features/admin/content/works/admin-works').then((m) => m.AdminWorks) },"
if($r -notmatch "path: 'content/works/:id'"){$r=$r.Replace($anchor,$route+"`r`n      "+$anchor)};Set-Content 'src\app\app.routes.ts' $r
$h='src\app\features\admin\content\works\admin-works.html';$x=Get-Content $h -Raw
$x=$x -replace '<button class="row-action" type="button" disabled title="Work workspace arrives in Phase A4.4" \[attr.aria-label\]="''Open ''\+title\(work\)\+'' — available in Phase A4.4''">›</button>','<a class="row-action" [routerLink]="[''/admin/content/works'', work.id]" [attr.aria-label]="''Open '' + title(work)">›</a>'
Set-Content $h $x
$t='src\app\features\admin\content\works\admin-works.ts';$s=Get-Content $t -Raw;if($s -notmatch 'RouterLink'){$s=$s -replace "import \{ FormsModule \} from '@angular/forms';","import { FormsModule } from '@angular/forms';`r`nimport { RouterLink } from '@angular/router';";$s=$s -replace 'imports: \[FormsModule\]','imports: [FormsModule, RouterLink]'};Set-Content $t $s
$c='src\app\features\admin\content\works\admin-works.scss';$css=Get-Content $c -Raw;$css=$css -replace '\.row-action\{','.row-action{display:grid;place-items:center;text-decoration:none;color:inherit;';Set-Content $c $css
function Run-Step($n,$b){Write-Host "Running $n..." -ForegroundColor Cyan;& $b;if($LASTEXITCODE -ne 0){throw "$n failed with exit code $LASTEXITCODE"}};Run-Step 'format' {npm run format};Run-Step 'build' {npm run build};Run-Step 'tests' {npm test -- --watch=false};Write-Host 'A4.4 installed successfully.' -ForegroundColor Green;Write-Host "Backup: $B"

