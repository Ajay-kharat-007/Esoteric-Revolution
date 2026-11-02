$ErrorActionPreference='Stop'
$workspace='src\app\features\admin\content\work-workspace\admin-work-workspace.ts'
$html='src\app\features\admin\content\work-workspace\admin-work-workspace.html'
$service='src\app\features\admin\content\work-workspace\admin-work-workspace.service.ts'
$models='src\app\features\admin\content\work-workspace\admin-work-versions.models.ts'
# Service import/method
$s=Get-Content $service -Raw
if($s -notmatch 'CreateWorkVersionRequest'){$s=$s -replace "import \{ ApiClient \}","import { ApiClient }";$s=$s -replace "import \{ UpdateWorkRequest", "import { CreateWorkVersionRequest } from './admin-work-versions.models';`r`nimport { UpdateWorkRequest";$s=$s -replace "\n}\s*$","`r`n  createWorkVersion(workId: string, data: CreateWorkVersionRequest) { return this.api.post<any, CreateWorkVersionRequest>(``/admin/works/`${workId}/versions``, data).pipe(map((response) => response.data)); }`r`n}`r`n";Set-Content $service $s}
# TS state/form/method
$t=Get-Content $workspace -Raw
$t=$t -replace "readonly addingLessonTo = signal<string \| null>\(null\);","readonly addingLessonTo = signal<string | null>(null);`r`n  readonly creatingWorkVersion = signal(false);"
$t=$t -replace "readonly moduleForm =", "readonly workVersionForm = this.fb.nonNullable.group({ title: ['', Validators.required], summary: ['', Validators.required], subtitle: [''], description: [''], contentJson: ['{}'], previewJson: ['{}'] });`r`n`r`n  readonly moduleForm ="
$method=@'

  createWorkVersion(): void {
    const work = this.work(); if (!work || this.workVersionForm.invalid) { this.workVersionForm.markAllAsTouched(); return; }
    const value = this.workVersionForm.getRawValue(); let content: Record<string, unknown>; let preview: Record<string, unknown>;
    try { content = JSON.parse(value.contentJson) as Record<string, unknown>; preview = JSON.parse(value.previewJson) as Record<string, unknown>; }
    catch { this.mutationError.set('Content or preview JSON is invalid.'); return; }
    this.creatingWorkVersion.set(true); this.mutationError.set(null);
    this.service.createWorkVersion(work.id, { title: value.title.trim(), summary: value.summary.trim(), ...(value.subtitle.trim()?{subtitle:value.subtitle.trim()}:{}), ...(value.description.trim()?{description:value.description.trim()}:{}), content, preview }).pipe(finalize(() => this.creatingWorkVersion.set(false))).subscribe({ next: () => { this.workVersionForm.reset({title:'',summary:'',subtitle:'',description:'',contentJson:'{}',previewJson:'{}'}); this.load(); this.activeTab.set('versions'); }, error: (error: Partial<BackendApiError>) => this.mutationError.set(this.apiMessage(error, 'Work version could not be created.')) });
  }
'@
$t=$t -replace "\n  @HostListener",($method+"`r`n  @HostListener")
Set-Content $workspace $t
# Template enable versions and lesson links, append versions view before closing work branch
$h=Get-Content $html -Raw
$h=$h -replace '<button type="button" disabled>Versions <small>A4.6</small></button>','<button type="button" [class.active]="activeTab()===''versions''" (click)="selectTab(''versions'')">Versions</button>'
$h=$h -replace '<button type="button" disabled title="Lesson editor arrives in A4.6">›</button>','<a class="lesson-open" [routerLink]="[''/admin/content/lessons'', lesson.id]" aria-label="Open lesson editor">›</a>'
$versions=@'
 @else if (activeTab()==='versions') { <section class="curriculum"><header class="curriculum-header"><div><p class="els-overline">Editorial history</p><h2>Work versions</h2><p>Create immutable editorial versions. Publishing selection arrives in A4.8.</p></div></header>@if(mutationError()){<div class="alert">{{mutationError()}}</div>}<form class="inline-form" [formGroup]="workVersionForm" (ngSubmit)="createWorkVersion()"><h3>Create new Work version</h3><div class="form-grid"><label>Title<input formControlName="title"/></label><label>Subtitle<input formControlName="subtitle"/></label><label class="full">Summary<textarea rows="3" formControlName="summary"></textarea></label><label class="full">Description<textarea rows="4" formControlName="description"></textarea></label><label class="full">Content JSON<textarea rows="7" formControlName="contentJson"></textarea></label><label class="full">Preview JSON<textarea rows="5" formControlName="previewJson"></textarea></label></div><div class="form-actions"><button class="primary" type="submit" [disabled]="creatingWorkVersion()">{{creatingWorkVersion()?'Creating…':'Create version'}}</button></div></form><div class="module-list">@for(version of item.versions;track version.id){<article class="module"><header><div class="module-number">{{version.version}}</div><div><p>Version {{version.version}}</p><h3>{{version.title}}</h3><small>{{version.summary}}</small></div><div>{{date(version.createdAt)}}</div></header></article>}</div></section> }
'@
$h=$h -replace "\n  }\n</section>",("`r`n   "+$versions+"`r`n  }`r`n</section>")
Set-Content $html $h
