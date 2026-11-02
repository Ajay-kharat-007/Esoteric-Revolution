export interface CreateModuleRequest {
  title: string;
  summary?: string;
  position: number;
}

export interface UpdateModuleRequest {
  title?: string;
  summary?: string;
  position?: number;
}

export interface CreateLessonRequest {
  slug: string;
  title: string;
  summary?: string;
  position: number;
}
