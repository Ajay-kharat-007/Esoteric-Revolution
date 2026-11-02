import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AdminWorkWorkspaceService } from './admin-work-workspace.service';
import { AdminWorkWorkspace } from './admin-work-workspace';
describe('AdminWorkWorkspace', () => {
  it('loads Work context and populates metadata form', async () => {
    const work = {
      id: '12345678-1234-1234-1234-123456789012',
      slug: 'sample-work',
      languageId: 'lang',
      status: 'DRAFT',
      publishedVersionId: null,
      publishedAt: null,
      introductionVideoUrl: null,
      introductionVideoId: null,
      introductionVideoTitle: null,
      introductionVideoCaptionInfo: null,
      createdAt: '2026-10-20T00:00:00Z',
      updatedAt: '2026-10-20T00:00:00Z',
      versions: [
        {
          id: 'v1',
          version: 1,
          title: 'Sample Work',
          subtitle: null,
          summary: 'Summary',
          description: null,
          coverImageUrl: null,
          createdAt: '2026-10-20T00:00:00Z',
        },
      ],
      assignments: [{ userId: 'u' }],
      modules: [],
    };
    await TestBed.configureTestingModule({
      imports: [AdminWorkWorkspace],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => work.id } } } },
        {
          provide: AdminWorkWorkspaceService,
          useValue: { get: () => of(work), update: () => of(work) },
        },
      ],
    }).compileComponents();
    const f = TestBed.createComponent(AdminWorkWorkspace);
    f.detectChanges();
    expect(f.componentInstance.form.controls.slug.value).toBe('sample-work');
    expect(f.nativeElement.textContent).toContain('Sample Work');
  });
});
