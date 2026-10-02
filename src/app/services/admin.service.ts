import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface AdminRequest {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AdminResponse {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  message?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminService {

  private readonly api = `${environment.apiUrl}${environment.endpoints.admins}`;
  private http = inject(HttpClient);

  getAll(): Observable<AdminResponse[]> {
    return this.http.get<AdminResponse[]>(this.api);
  }

  create(payload: AdminRequest): Observable<AdminResponse> {
    return this.http.post<AdminResponse>(this.api, payload);
  }

  remove(id: number): Observable<{ message: string; id: number }> {
    return this.http.delete<{ message: string; id: number }>(`${this.api}/${id}`);
  }
}