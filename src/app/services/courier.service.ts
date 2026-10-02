import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.service';

export interface Courier {
  id: number;
  companyName: string;
  phoneNumber: string;
}

export interface CourierPayload {
  companyName: string;
  phoneNumber: string;
}

@Injectable({ providedIn: 'root' })
export class CourierService {
  private readonly api = `${environment.apiUrl}/couriers`;
  private http = inject(HttpClient);

  getAll(): Observable<Courier[]> {
    return this.http.get<Courier[]>(this.api);
  }

  create(payload: CourierPayload): Observable<Courier> {
    return this.http.post<Courier>(this.api, payload);
  }

  update(id: number, payload: CourierPayload): Observable<Courier> {
    return this.http.put<Courier>(`${this.api}/${id}`, payload);
  }

  delete(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.api}/${id}`);
  }
}