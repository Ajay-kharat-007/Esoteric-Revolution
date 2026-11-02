import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClient } from '../../../../core/api/api-client';
import { CreateWorkVersionRequest } from './admin-work-versions.models';
import {
  CreateLessonRequest,
  CreateModuleRequest,
  UpdateModuleRequest,
} from './admin-curriculum.models';
import {
  UpdateWorkRequest,
  WorkContext,
  WorkLesson,
  WorkModule,
} from './admin-work-workspace.models';

@Injectable({ providedIn: 'root' })
export class AdminWorkWorkspaceService {
  private readonly api = inject(ApiClient);

  get(id: string): Observable<WorkContext> {
    return this.api.get<WorkContext>(`/admin/works/${id}`).pipe(map((response) => response.data));
  }

  update(id: string, data: UpdateWorkRequest): Observable<WorkContext> {
    return this.api
      .patch<WorkContext, UpdateWorkRequest>(`/admin/works/${id}`, data)
      .pipe(map((response) => response.data));
  }

  createModule(workId: string, data: CreateModuleRequest): Observable<WorkModule> {
    return this.api
      .post<WorkModule, CreateModuleRequest>(`/admin/works/${workId}/modules`, data)
      .pipe(map((response) => response.data));
  }

  updateModule(moduleId: string, data: UpdateModuleRequest): Observable<WorkModule> {
    return this.api
      .patch<WorkModule, UpdateModuleRequest>(`/admin/modules/${moduleId}`, data)
      .pipe(map((response) => response.data));
  }

  createLesson(moduleId: string, data: CreateLessonRequest): Observable<WorkLesson> {
    return this.api
      .post<WorkLesson, CreateLessonRequest>(`/admin/modules/${moduleId}/lessons`, data)
      .pipe(map((response) => response.data));
  }
  createWorkVersion(workId: string, data: CreateWorkVersionRequest) {
    return this.api
      .post<any, CreateWorkVersionRequest>(`/admin/works/${workId}/versions`, data)
      .pipe(map((response) => response.data));
  }
}
