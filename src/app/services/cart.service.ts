import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

export interface CartItem {
  id: number;
  customerId: number;
  productId: number;
  size: string;
  quantity: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class CartService {

  private readonly api = `${environment.apiUrl}${environment.endpoints.cart}`;
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  /** 👇 Reactive count of items in the cart. */
  private readonly _count = signal<number>(0);
  readonly count = computed(() => this._count());

  /** Fetch cart and update the reactive count. */
  refreshCount(): void {
    if (!this.authService.isCustomer()) {
      this._count.set(0);
      return;
    }

    this.getCart().subscribe({
      next: (items) => {
        const total = (items || []).reduce((s, i) => s + i.quantity, 0);
        this._count.set(total);
      },
      error: () => this._count.set(0)
    });
  }

  /** Reset count to 0 (used on logout). */
  clearCount(): void {
    this._count.set(0);
  }

  // ---------- HTTP calls ----------
  // Every mutation pipes through refreshCount() so the
  // navbar badge updates instantly across the app.

  getCart(): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(this.api);
  }

  addToCart(productId: number, size: string, quantity: number): Observable<CartItem> {
    return this.http.post<CartItem>(this.api, { productId, size, quantity }).pipe(
      tap(() => this.refreshCount())
    );
  }

  updateQuantity(itemId: number, quantity: number): Observable<CartItem> {
    return this.http.put<CartItem>(`${this.api}/${itemId}`, { quantity }).pipe(
      tap(() => this.refreshCount())
    );
  }

  remove(itemId: number): Observable<{ message: string; id: number }> {
    return this.http.delete<{ message: string; id: number }>(`${this.api}/${itemId}`).pipe(
      tap(() => this.refreshCount())
    );
  }

  clear(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(this.api).pipe(
      tap(() => this._count.set(0))
    );
  }
}