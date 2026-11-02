$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\angular.json')) { throw 'Run from Angular frontend root.' }

$ExtractedPackage = '.\A4.6B-EXACT-FIX\a4.6b-exact-fix'
$OriginalPackage = '.\Phase-A4.6B-Admin-Content-Editor\phase-a4.6b-admin-content-editor'
$EditorPayload = if (Test-Path "$ExtractedPackage\payload") { "$ExtractedPackage\payload" } elseif (Test-Path "$OriginalPackage\payload\src\app\features\admin\content\work-workspace") { "$OriginalPackage\payload\src\app\features\admin\content\work-workspace" } else { throw 'Extracted A4.6B package payload not found.' }

$Target = '.\src\app\features\admin\content\work-workspace'
$TsPath = "$Target\admin-work-workspace.ts"
$HtmlPath = "$Target\admin-work-workspace.html"
foreach ($Path in @($TsPath, $HtmlPath)) { if (-not (Test-Path $Path)) { throw "Missing required file: $Path" } }

$Stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$Backup = ".\.phase-a4.6b-current-backup-$Stamp"
New-Item -ItemType Directory -Path $Backup -Force | Out-Null
Copy-Item $TsPath $Backup -Force
Copy-Item $HtmlPath $Backup -Force
Copy-Item "$Target\admin-work-workspace.scss" $Backup -Force
Copy-Item "$EditorPayload\admin-content-editor.*" $Target -Force

$NodePatch = @'
import fs from 'node:fs';
const tsPath='src/app/features/admin/content/work-workspace/admin-work-workspace.ts';
const htmlPath='src/app/features/admin/content/work-workspace/admin-work-workspace.html';
let ts=fs.readFileSync(tsPath,'utf8');
let html=fs.readFileSync(htmlPath,'utf8');
function once(source,oldValue,newValue,name){const n=source.split(oldValue).length-1;if(n!==1)throw new Error(`${name}: expected 1 match, found ${n}`);return source.replace(oldValue,newValue);}
if(!ts.includes("import { AdminContentEditor } from './admin-content-editor';")){
 ts=once(ts,"import { AdminWorkWorkspaceService } from './admin-work-workspace.service';","import { AdminContentEditor } from './admin-content-editor';\nimport { WorkContentDocument, WorkPreviewDocument } from './admin-content-editor.models';\nimport { AdminWorkWorkspaceService } from './admin-work-workspace.service';",'imports');
 ts=once(ts,'imports: [ReactiveFormsModule, RouterLink],','imports: [ReactiveFormsModule, RouterLink, AdminContentEditor],','component imports');
}
const formStart=ts.indexOf('  readonly workVersionForm = this.fb.nonNullable.group({');
const moduleFormStart=ts.indexOf('  readonly moduleForm =',formStart);
if(formStart<0||moduleFormStart<0)throw new Error('Work version form boundaries not found.');
if(!ts.includes('readonly versionContent = signal<WorkContentDocument>')){
 const replacement=`  readonly versionContent = signal<WorkContentDocument>({\n    type: 'document',\n    version: 1,\n    blocks: [],\n  });\n  readonly versionPreview = signal<WorkPreviewDocument>({\n    type: 'preview',\n    version: 1,\n    excerpt: '',\n    featuredSections: [],\n    estimatedReadMinutes: 5,\n  });\n  readonly workVersionForm = this.fb.nonNullable.group({\n    title: ['', Validators.required],\n    summary: ['', Validators.required],\n    subtitle: [''],\n    description: [''],\n  });\n`;
 ts=ts.slice(0,formStart)+replacement+ts.slice(moduleFormStart);
}
const parseStart=ts.indexOf('    const value = this.workVersionForm.getRawValue();',ts.indexOf('createWorkVersion(): void'));
const creatingStart=ts.indexOf('    this.creatingWorkVersion.set(true);',parseStart);
if(parseStart<0||creatingStart<0)throw new Error('Version parsing boundaries not found.');
if(ts.slice(parseStart,creatingStart).includes('JSON.parse')){
 ts=ts.slice(0,parseStart)+"    const value = this.workVersionForm.getRawValue();\n    const content = this.versionContent();\n    const preview = this.versionPreview();\n"+ts.slice(creatingStart);
}
const resetStart=ts.indexOf('          this.workVersionForm.reset({',ts.indexOf('createWorkVersion(): void'));
const loadStart=ts.indexOf('          this.load();',resetStart);
if(resetStart<0||loadStart<0)throw new Error('Version reset boundaries not found.');
if(ts.slice(resetStart,loadStart).includes('contentJson')){
 const reset=`          this.workVersionForm.reset({\n            title: '',\n            summary: '',\n            subtitle: '',\n            description: '',\n          });\n          this.versionContent.set({ type: 'document', version: 1, blocks: [] });\n          this.versionPreview.set({\n            type: 'preview',\n            version: 1,\n            excerpt: '',\n            featuredSections: [],\n            estimatedReadMinutes: 5,\n          });\n`;
 ts=ts.slice(0,resetStart)+reset+ts.slice(loadStart);
}
if(!html.includes('<els-admin-content-editor')){
 const contentPos=html.indexOf('Content JSON');
 const previewPos=html.indexOf('Preview JSON');
 if(contentPos<0||previewPos<0||previewPos<contentPos)throw new Error('JSON field labels not found.');
 const start=html.lastIndexOf('<label class="full"',contentPos);
 const firstEnd=html.indexOf('</label>',contentPos);
 const secondEnd=html.indexOf('</label>',previewPos);
 if(start<0||firstEnd<0||secondEnd<0)throw new Error('JSON label boundaries not found.');
 const end=secondEnd+'</label>'.length;
 const editor=`<div class="full">\n              <els-admin-content-editor\n                [initialContent]="versionContent()"\n                [initialPreview]="versionPreview()"\n                (contentChange)="versionContent.set($event)"\n                (previewChange)="versionPreview.set($event)"\n              />\n            </div>`;
 html=html.slice(0,start)+editor+html.slice(end);
}
fs.writeFileSync(tsPath,ts,'utf8');fs.writeFileSync(htmlPath,html,'utf8');
if(ts.includes('contentJson')||ts.includes('previewJson')||!ts.includes('AdminContentEditor'))throw new Error('TypeScript post-check failed.');
if(html.includes('Content JSON')||html.includes('Preview JSON')||!html.includes('<els-admin-content-editor'))throw new Error('HTML post-check failed.');
console.log('[OK] Exact current A4.6B wiring complete.');
'@
$PatchPath = Join-Path $env:TEMP 'patch-a46b-current.mjs'
[System.IO.File]::WriteAllText($PatchPath, $NodePatch, [System.Text.UTF8Encoding]::new($false))
node $PatchPath
if ($LASTEXITCODE -ne 0) { throw "Node source patch failed with exit code $LASTEXITCODE" }

function Run-Step([string]$Name,[scriptblock]$Command){Write-Host "Running $Name..." -ForegroundColor Cyan;&$Command;if($LASTEXITCODE -ne 0){throw "$Name failed with exit code $LASTEXITCODE"}}
Run-Step 'format' { npm run format }
Run-Step 'build' { npm run build }
Run-Step 'tests' { npm test -- --watch=false }

Write-Host ''
Write-Host 'Phase A4.6B Current-State Fix installed successfully.' -ForegroundColor Green
Write-Host "Backup: $Backup" -ForegroundColor Cyan
