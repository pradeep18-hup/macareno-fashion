import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RegisterRequest {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export interface CustomerResponse {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {

  private readonly api = 'http://localhost:8080/api/customers';
  private http = inject(HttpClient);

  register(payload: RegisterRequest): Observable<CustomerResponse> {
    return this.http.post<CustomerResponse>(`${this.api}/register`, payload);
  }

  getAll(): Observable<CustomerResponse[]> {
    return this.http.get<CustomerResponse[]>(this.api);
  }

  getById(id: number): Observable<CustomerResponse> {
    return this.http.get<CustomerResponse>(`${this.api}/${id}`);
  }

  remove(id: number): Observable<{ message: string; id: number }> {
    return this.http.delete<{ message: string; id: number }>(`${this.api}/${id}`);
  }
}