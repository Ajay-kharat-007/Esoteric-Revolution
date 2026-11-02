import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AdminCreateWorkService } from './admin-create-work.service';
import { AdminCreateWork } from './admin-create-work';

describe('AdminCreateWork', () => {
  it('loads languages and generates a slug from the title', async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCreateWork],
      providers: [
        provideRouter([]),
        {
          provide: AdminCreateWorkService,
          useValue: {
            languages: () =>
              of([{ id: '1', code: 'en', name: 'English', nativeName: 'English', isActive: true }]),
            create: () => of({ id: 'w1' }),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AdminCreateWork);
    fixture.detectChanges();
    fixture.componentInstance.form.controls.title.setValue('The Book of Hidden Knowledge');
    expect(fixture.componentInstance.form.controls.slug.value).toBe('the-book-of-hidden-knowledge');
    expect(fixture.componentInstance.form.controls.languageCode.value).toBe('en');
  });
});
