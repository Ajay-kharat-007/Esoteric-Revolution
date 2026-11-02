export interface ApiEnvelope<T> {
  data: T;
  correlationId?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiErrorPayload {
  statusCode: number;
  code?: string;
  message: string | string[];
  correlationId?: string;
  details?: unknown;
}
