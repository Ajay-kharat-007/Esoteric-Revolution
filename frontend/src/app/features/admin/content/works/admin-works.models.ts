export type PublicationStatus =
  'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'ARCHIVED';
export interface AdminWorkListItem {
  id: string;
  slug: string;
  status: PublicationStatus;
  publishedVersionId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  introductionVideoUrl: string | null;
  introductionVideoId: string | null;
  introductionVideoTitle: string | null;
  introductionVideoCaptionInfo: string | null;
  language: { id: string; code: string; name: string; nativeName: string; isActive: boolean };
  publishedVersion: {
    id: string;
    workId: string;
    version: number;
    title: string;
    subtitle: string | null;
    summary: string;
    description: string | null;
    coverImageUrl: string | null;
    createdAt: string;
  } | null;
  _count: { versions: number; modules: number };
}
