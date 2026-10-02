import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SizeOption {
  id: number;
  sizeType: 'alphabet' | 'number';
  label: string;
  displayOrder: number;
}

@Injectable({ providedIn: 'root' })
export class SizeService {

  private readonly api = `${environment.apiUrl}/sizes`;
  private http = inject(HttpClient);

  getAll(): Observable<SizeOption[]> {
    return this.http.get<SizeOption[]>(this.api);
  }

  getByType(type: 'alphabet' | 'number'): Observable<SizeOption[]> {
    return this.http.get<SizeOption[]>(`${this.api}?type=${type}`);
  }

  add(payload: { sizeType: string; label: string; displayOrder?: number }): Observable<SizeOption> {
    return this.http.post<SizeOption>(this.api, payload);
  }

  remove(id: number): Observable<{ message: string; id: number }> {
    return this.http.delete<{ message: string; id: number }>(`${this.api}/${id}`);
  }
}