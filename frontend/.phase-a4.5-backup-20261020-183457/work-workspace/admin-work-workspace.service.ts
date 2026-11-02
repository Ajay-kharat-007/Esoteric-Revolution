import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClient } from '../../../../core/api/api-client';
import { UpdateWorkRequest, WorkContext } from './admin-work-workspace.models';
@Injectable({ providedIn: 'root' })
export class AdminWorkWorkspaceService {
  private readonly api = inject(ApiClient);
  get(id: string): Observable<WorkContext> {
    return this.api.get<WorkContext>(`/admin/works/${id}`).pipe(map((r) => r.data));
  }
  update(id: string, d: UpdateWorkRequest): Observable<WorkContext> {
    return this.api
      .patch<WorkContext, UpdateWorkRequest>(`/admin/works/${id}`, d)
      .pipe(map((r) => r.data));
  }
}
