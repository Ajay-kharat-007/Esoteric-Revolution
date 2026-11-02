import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ContentBlock,
  ContentBlockType,
  WorkContentDocument,
  WorkPreviewDocument,
} from './admin-content-editor.models';
@Component({
  selector: 'els-admin-content-editor',
  imports: [FormsModule],
  templateUrl: './admin-content-editor.html',
  styleUrl: './admin-content-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminContentEditor {
  @Input() set initialContent(value: Record<string, unknown> | null | undefined) {
    this.blocks.set(this.readBlocks(value));
  }
  @Input() set initialPreview(value: Record<string, unknown> | null | undefined) {
    this.readPreview(value);
  }
  @Output() contentChange = new EventEmitter<WorkContentDocument>();
  @Output() previewChange = new EventEmitter<WorkPreviewDocument>();
  readonly blocks = signal<ContentBlock[]>([]);
  readonly excerpt = signal('');
  readonly featuredSections = signal('');
  readonly estimatedReadMinutes = signal(5);
  readonly wordCount = computed(() =>
    this.blocks().reduce((n, b) => n + b.text.trim().split(/\s+/).filter(Boolean).length, 0),
  );
  readonly previewSections = computed(() =>
    this.featuredSections()
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean),
  );
  add(type: ContentBlockType): void {
    const block: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      text: '',
      ...(type === 'heading' ? { level: 2 as const } : {}),
      ...(type === 'callout' ? { tone: 'note' as const } : {}),
    };
    this.blocks.update((v) => [...v, block]);
    this.emit();
  }
  update(id: string, patch: Partial<ContentBlock>): void {
    this.blocks.update((v) => v.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    this.emit();
  }
  remove(id: string): void {
    this.blocks.update((v) => v.filter((b) => b.id !== id));
    this.emit();
  }
  move(id: string, direction: -1 | 1): void {
    this.blocks.update((v) => {
      const a = [...v];
      const i = a.findIndex((b) => b.id === id);
      const j = i + direction;
      if (i < 0 || j < 0 || j >= a.length) return a;
      [a[i], a[j]] = [a[j], a[i]];
      return a;
    });
    this.emit();
  }
  previewChanged(): void {
    this.previewChange.emit(this.previewDocument());
  }
  contentDocument(): WorkContentDocument {
    return {
      type: 'document',
      version: 1,
      blocks: this.blocks().map(({ id, ...b }) => ({ id, ...b })),
    };
  }
  previewDocument(): WorkPreviewDocument {
    return {
      type: 'preview',
      version: 1,
      excerpt: this.excerpt().trim(),
      featuredSections: this.previewSections(),
      estimatedReadMinutes: Math.max(1, Number(this.estimatedReadMinutes()) || 1),
    };
  }
  private emit(): void {
    this.contentChange.emit(this.contentDocument());
  }
  private readBlocks(value: Record<string, unknown> | null | undefined): ContentBlock[] {
    const raw = Array.isArray(value?.['blocks'])
      ? (value!['blocks'] as Array<Record<string, unknown>>)
      : [];
    return raw
      .filter((b) => typeof b['type'] === 'string' && typeof b['text'] === 'string')
      .map((b) => ({
        id: typeof b['id'] === 'string' ? b['id'] : crypto.randomUUID(),
        type: b['type'] as ContentBlockType,
        text: b['text'] as string,
        ...(b['level'] ? { level: b['level'] as 2 | 3 } : {}),
        ...(b['tone'] ? { tone: b['tone'] as 'note' | 'insight' | 'warning' } : {}),
      }));
  }
  private readPreview(value: Record<string, unknown> | null | undefined): void {
    this.excerpt.set(typeof value?.['excerpt'] === 'string' ? value['excerpt'] : '');
    this.featuredSections.set(
      Array.isArray(value?.['featuredSections'])
        ? (value!['featuredSections'] as unknown[]).filter((v) => typeof v === 'string').join(', ')
        : '',
    );
    this.estimatedReadMinutes.set(
      typeof value?.['estimatedReadMinutes'] === 'number' ? value['estimatedReadMinutes'] : 5,
    );
  }
}
