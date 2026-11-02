import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClient } from '../../../../core/api/api-client';
import { CatalogueLanguage, CreatedWork, CreateWorkRequest } from './admin-create-work.models';

@Injectable({ providedIn: 'root' })
export class AdminCreateWorkService {
  private readonly api = inject(ApiClient);

  languages(): Observable<CatalogueLanguage[]> {
    return this.api
      .get<CatalogueLanguage[]>('/catalogue/languages')
      .pipe(map((response) => response.data.filter((language) => language.isActive)));
  }

  create(request: CreateWorkRequest): Observable<CreatedWork> {
    return this.api
      .post<CreatedWork, CreateWorkRequest>('/admin/works', request)
      .pipe(map((response) => response.data));
  }
}
