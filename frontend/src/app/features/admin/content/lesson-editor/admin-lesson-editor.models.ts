export interface LessonMedia {
  id: string;
  type: string;
  status: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: string;
}
export interface LessonVersion {
  id: string;
  version: number;
  content: Record<string, unknown>;
  transcript: string | null;
  durationSeconds: number | null;
  createdAt: string;
  media: LessonMedia[];
}
export interface LessonContext {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  position: number;
  publishedVersionId: string | null;
  createdAt: string;
  updatedAt: string;
  module: { id: string; title: string; work: { id: string; slug: string } };
  versions: LessonVersion[];
}
export interface UpdateLessonRequest {
  title?: string;
  summary?: string;
  position?: number;
}
export interface CreateLessonVersionRequest {
  content: Record<string, unknown>;
  transcript?: string;
  durationSeconds?: number;
}
