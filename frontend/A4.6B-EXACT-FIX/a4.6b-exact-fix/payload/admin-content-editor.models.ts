export type ContentBlockType = 'heading' | 'paragraph' | 'quote' | 'callout';
export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  text: string;
  level?: 2 | 3;
  tone?: 'note' | 'insight' | 'warning';
}
export interface WorkContentDocument {
  type: 'document';
  version: 1;
  blocks: ContentBlock[];
}
export interface WorkPreviewDocument {
  type: 'preview';
  version: 1;
  excerpt: string;
  featuredSections: string[];
  estimatedReadMinutes: number;
}
