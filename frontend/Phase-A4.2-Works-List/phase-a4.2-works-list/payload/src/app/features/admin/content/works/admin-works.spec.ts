import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { AdminWorksService } from './admin-works.service';
import { AdminWorks } from './admin-works';
describe('AdminWorks', () => {
  it('loads and filters the backend list', async () => {
    const item = {
      id: '1',
      slug: 'sample-work',
      status: 'DRAFT',
      publishedVersionId: null,
      publishedAt: null,
      createdAt: '2026-10-20T00:00:00Z',
      updatedAt: '2026-10-20T00:00:00Z',
      introductionVideoUrl: null,
      introductionVideoId: null,
      introductionVideoTitle: null,
      introductionVideoCaptionInfo: null,
      language: { id: 'l', code: 'en', name: 'English', nativeName: 'English', isActive: true },
      publishedVersion: null,
      _count: { versions: 1, modules: 0 },
    };
    await TestBed.configureTestingModule({
      imports: [AdminWorks],
      providers: [{ provide: AdminWorksService, useValue: { list: () => of([item]) } }],
    }).compileComponents();
    const f = TestBed.createComponent(AdminWorks);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Sample Work');
    f.componentInstance.query.set('missing');
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('No works match');
  });
});
