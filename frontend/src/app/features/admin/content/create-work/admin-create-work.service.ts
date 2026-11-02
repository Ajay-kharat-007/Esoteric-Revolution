import { inject, Injectable } from '@angular/core';
import { Observable, of, map } from 'rxjs';
import { ApiClient } from '../../../../core/api/api-client';
import { CatalogueLanguage, CreatedWork, CreateWorkRequest } from './admin-create-work.models';

@Injectable({ providedIn: 'root' })
export class AdminCreateWorkService {
  private readonly api = inject(ApiClient);

  languages(): Observable<CatalogueLanguage[]> {
    return of([
      {
        id: 'catalogue-language-en',
        code: 'en',
        name: 'English',
        nativeName: 'English',
        isActive: true,
      },
    ]);
  }

  create(request: CreateWorkRequest): Observable<CreatedWork> {
    return this.api
      .post<CreatedWork, CreateWorkRequest>('/admin/works', request)
      .pipe(map((response) => response.data));
  }
}
