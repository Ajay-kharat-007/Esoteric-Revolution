import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminWorkWorkspaceService } from './admin-work-workspace.service';
import { AdminWorkWorkspace } from './admin-work-workspace';

describe('AdminWorkWorkspace', () => {
  it('loads context and opens curriculum', async () => {
    const work = {
      id: 'w1',
      slug: 'sample-work',
      languageId: 'en',
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
      assignments: [],
      modules: [],
    };
    await TestBed.configureTestingModule({
      imports: [AdminWorkWorkspace],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => work.id } } } },
        {
          provide: AdminWorkWorkspaceService,
          useValue: {
            get: () => of(work),
            update: () => of(work),
            createModule: () => of({}),
            updateModule: () => of({}),
            createLesson: () => of({}),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminWorkWorkspace);
    fixture.detectChanges();
    fixture.componentInstance.selectTab('curriculum');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Curriculum builder');
    expect(fixture.nativeElement.textContent).toContain('No curriculum yet');
  });
});
