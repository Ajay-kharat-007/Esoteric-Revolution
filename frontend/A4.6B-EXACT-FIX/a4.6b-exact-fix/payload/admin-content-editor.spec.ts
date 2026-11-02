import { TestBed } from '@angular/core/testing';
import { AdminContentEditor } from './admin-content-editor';
describe('AdminContentEditor', () => {
  it('creates structured backend documents', async () => {
    await TestBed.configureTestingModule({ imports: [AdminContentEditor] }).compileComponents();
    const f = TestBed.createComponent(AdminContentEditor);
    f.componentInstance.add('paragraph');
    f.componentInstance.update(f.componentInstance.blocks()[0].id, { text: 'Hello archive' });
    expect(f.componentInstance.contentDocument().blocks[0].text).toBe('Hello archive');
  });
});
