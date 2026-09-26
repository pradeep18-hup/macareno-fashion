import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminRequest {
  name: string;
  password: string;
  confirmPassword: string;
}

export interface AdminResponse {
  id: number;
  name: string;
  createdAt: string;
  message?: string | null;
}

@Injectable({ providedIn: 'root' })
export class AdminService {

  private readonly api = 'http://localhost:8080/api/admins';
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