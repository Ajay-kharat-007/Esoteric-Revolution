import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminLessonEditorService } from './admin-lesson-editor.service';
import { AdminLessonEditor } from './admin-lesson-editor';
describe('AdminLessonEditor', () => {
  it('loads lesson context', async () => {
    const lesson = {
      id: 'l1',
      slug: 'lesson-one',
      title: 'Lesson One',
      summary: null,
      position: 1,
      publishedVersionId: null,
      createdAt: '2026-10-20T00:00:00Z',
      updatedAt: '2026-10-20T00:00:00Z',
      module: { id: 'm', title: 'Module', work: { id: 'w', slug: 'work' } },
      versions: [],
    };
    await TestBed.configureTestingModule({
      imports: [AdminLessonEditor],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => lesson.id } } } },
        {
          provide: AdminLessonEditorService,
          useValue: {
            get: () => of(lesson),
            update: () => of(lesson),
            createVersion: () => of({}),
          },
        },
      ],
    }).compileComponents();
    const f = TestBed.createComponent(AdminLessonEditor);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Lesson One');
  });
});
