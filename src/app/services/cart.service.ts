import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  private readonly api = 'http://localhost:8080/api/cart';
  private http = inject(HttpClient);

  getCart(): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(this.api);
  }

  addToCart(productId: number, size: string, quantity: number): Observable<CartItem> {
    return this.http.post<CartItem>(this.api, { productId, size, quantity });
  }

  updateQuantity(itemId: number, quantity: number): Observable<CartItem> {
    return this.http.put<CartItem>(`${this.api}/${itemId}`, { quantity });
  }

  remove(itemId: number): Observable<{ message: string; id: number }> {
    return this.http.delete<{ message: string; id: number }>(`${this.api}/${itemId}`);
  }

  clear(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(this.api);
  }
}