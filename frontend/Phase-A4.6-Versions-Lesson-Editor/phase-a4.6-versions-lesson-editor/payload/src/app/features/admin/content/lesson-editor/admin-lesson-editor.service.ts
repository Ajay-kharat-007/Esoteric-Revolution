import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClient } from '../../../../core/api/api-client';
import {
  CreateLessonVersionRequest,
  LessonContext,
  LessonVersion,
  UpdateLessonRequest,
} from './admin-lesson-editor.models';
@Injectable({ providedIn: 'root' })
export class AdminLessonEditorService {
  private readonly api = inject(ApiClient);
  get(id: string): Observable<LessonContext> {
    return this.api.get<LessonContext>(`/admin/lessons/${id}`).pipe(map((r) => r.data));
  }
  update(id: string, d: UpdateLessonRequest): Observable<LessonContext> {
    return this.api
      .patch<LessonContext, UpdateLessonRequest>(`/admin/lessons/${id}`, d)
      .pipe(map((r) => r.data));
  }
  createVersion(id: string, d: CreateLessonVersionRequest): Observable<LessonVersion> {
    return this.api
      .post<LessonVersion, CreateLessonVersionRequest>(`/admin/lessons/${id}/versions`, d)
      .pipe(map((r) => r.data));
  }
}
