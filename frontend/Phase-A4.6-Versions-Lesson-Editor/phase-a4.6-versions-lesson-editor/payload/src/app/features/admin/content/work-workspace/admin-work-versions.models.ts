export interface CreateWorkVersionRequest {
  title: string;
  summary: string;
  subtitle?: string;
  description?: string;
  content?: Record<string, unknown>;
  preview?: Record<string, unknown>;
}
