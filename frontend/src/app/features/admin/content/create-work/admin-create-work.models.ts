export interface CreateWorkRequest {
  slug: string;
  languageCode: string;
  title?: string;
  summary?: string;
}

export interface CreatedWork {
  id: string;
  slug: string;
  status: string;
  languageId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CatalogueLanguage {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  isActive: boolean;
}
