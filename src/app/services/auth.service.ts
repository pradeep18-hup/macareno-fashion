import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

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

  private readonly api = `${environment.apiUrl}${environment.endpoints.auth}`;
  private readonly TOKEN_KEY = environment.storageKeys.token;
  private readonly USER_KEY  = environment.storageKeys.user;

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

  // ---------- Forgot password ----------
  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/forgot-password`, { email });
  }

  verifyOtp(email: string, otp: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/verify-otp`, { email, otp });
  }

  resetPassword(
    email: string,
    otp: string,
    newPassword: string,
    confirmPassword: string
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.api}/reset-password`, {
      email,
      otp,
      newPassword,
      confirmPassword,
    });
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

  /** Reads the "exp" claim from the JWT. No exp claim = treated as not expired. */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(
        atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))
      );
      if (!payload.exp) return false;
      return Date.now() >= payload.exp * 1000;   // exp is in seconds
    } catch {
      return true;                               // cannot decode = invalid
    }
  }

  /** True only if a valid, non-expired token exists. Deletes bad tokens. */
  isLoggedIn(): boolean {
    const t = this.getToken();
    if (!t || t === 'undefined' || t === 'null') return false;

    if (this.isTokenExpired(t)) {
      this.logout();
      return false;
    }
    return true;
  }

  isAdmin(): boolean {
    return this.isLoggedIn() && this.getUser()?.userType === 'admin';
  }

  isCustomer(): boolean {
    return this.isLoggedIn() && this.getUser()?.userType === 'customer';
  }
}