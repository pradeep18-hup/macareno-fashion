import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  id: number;
  email: string | null;
  name: string;
  userType: 'customer' | 'admin';
  token: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly api = 'http://localhost:8080/api/auth';
  private readonly TOKEN_KEY = 'macarena_token';
  private readonly USER_KEY  = 'macarena_user';

  private http = inject(HttpClient);

  // ---------- Login ----------
  login(payload: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.api}/login`, payload).pipe(
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(res));
      })
    );
  }

  // ---------- Logout ----------
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // ---------- Read state ----------
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): LoginResponse | null {
    const raw = localStorage.getItem(this.USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getUser()?.userType === 'admin';
  }

  isCustomer(): boolean {
    return this.getUser()?.userType === 'customer';
  }
}