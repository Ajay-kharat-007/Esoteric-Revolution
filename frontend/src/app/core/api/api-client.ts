import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app-config';
import { ApiEnvelope } from '../models/api.models';

export type QueryValue = string | number | boolean | null | undefined;

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly config = inject(APP_CONFIG);

  get<T>(
    path: string,
    query?: Record<string, QueryValue>,
    context?: HttpContext,
  ): Observable<ApiEnvelope<T>> {
    return this.http.get<ApiEnvelope<T>>(this.url(path), { params: this.params(query), context });
  }

  post<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    context?: HttpContext,
  ): Observable<ApiEnvelope<TResponse>> {
    return this.http.post<ApiEnvelope<TResponse>>(this.url(path), body ?? null, { context });
  }

  patch<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    context?: HttpContext,
  ): Observable<ApiEnvelope<TResponse>> {
    return this.http.patch<ApiEnvelope<TResponse>>(this.url(path), body, { context });
  }

  put<TResponse, TBody = unknown>(
    path: string,
    body: TBody,
    context?: HttpContext,
  ): Observable<ApiEnvelope<TResponse>> {
    return this.http.put<ApiEnvelope<TResponse>>(this.url(path), body, { context });
  }

  delete<T>(path: string, context?: HttpContext): Observable<ApiEnvelope<T>> {
    return this.http.delete<ApiEnvelope<T>>(this.url(path), { context });
  }

  private url(path: string): string {
    const base = this.config.apiBaseUrl.replace(/\/$/, '');
    const target = path.startsWith('/') ? path : `/${path}`;
    return `${base}${target}`;
  }

  private params(query?: Record<string, QueryValue>): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== null && value !== undefined) params = params.set(key, String(value));
    }
    return params;
  }
}
