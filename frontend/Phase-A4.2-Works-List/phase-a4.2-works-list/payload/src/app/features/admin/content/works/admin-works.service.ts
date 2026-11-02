import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClient } from '../../../../core/api/api-client';
import { AdminWorkListItem } from './admin-works.models';
@Injectable({ providedIn: 'root' })
export class AdminWorksService {
  private readonly api = inject(ApiClient);
  list(): Observable<AdminWorkListItem[]> {
    return this.api.get<AdminWorkListItem[]>('/admin/works').pipe(map((r) => r.data));
  }
}
