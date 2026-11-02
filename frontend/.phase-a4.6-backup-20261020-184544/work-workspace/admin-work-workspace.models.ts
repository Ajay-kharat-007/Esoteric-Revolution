export interface WorkVersion {
  id: string;
  version: number;
  title: string;
  subtitle: string | null;
  summary: string;
  description: string | null;
  coverImageUrl: string | null;
  createdAt: string;
}
export interface WorkLesson {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  position: number;
  publishedVersionId: string | null;
  versions: Array<{ id: string; version: number; createdAt: string }>;
}
export interface WorkModule {
  id: string;
  title: string;
  summary: string | null;
  position: number;
  lessons: WorkLesson[];
}
export interface WorkContext {
  id: string;
  slug: string;
  languageId: string;
  status: string;
  publishedVersionId: string | null;
  publishedAt: string | null;
  introductionVideoUrl: string | null;
  introductionVideoId: string | null;
  introductionVideoTitle: string | null;
  introductionVideoCaptionInfo: string | null;
  createdAt: string;
  updatedAt: string;
  versions: WorkVersion[];
  assignments: Array<{ userId: string }>;
  modules: WorkModule[];
}
export interface UpdateWorkRequest {
  slug?: string;
  introductionVideoUrl?: string;
  introductionVideoTitle?: string;
  introductionVideoCaptionInfo?: string;
}
