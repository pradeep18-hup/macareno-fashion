import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderItem {
  productId: number;
  productName: string;
  productImage?: string | null;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Order {
  id: number;
  customerId: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentReference?: string | null;
  fullName: string;
  phoneNumber: string;
  addressLine: string;
  city?: string;
  state?: string;
  pincode: string;
  createdAt: string;
  items: OrderItem[];
}

export interface CheckoutRequest {
  fullName: string;
  phoneNumber: string;
  addressLine: string;
  city?: string;
  state?: string;
  pincode: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {

  private readonly api = 'http://localhost:8080/api/orders';
  private http = inject(HttpClient);

  list(): Observable<Order[]> {
    return this.http.get<Order[]>(this.api);
  }

  getById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.api}/${id}`);
  }

  checkout(payload: CheckoutRequest): Observable<Order> {
    return this.http.post<Order>(`${this.api}/checkout`, payload);
  }

  updateStatus(id: number, status: string): Observable<Order> {
    return this.http.put<Order>(`${this.api}/${id}/status`, { status });
  }
}