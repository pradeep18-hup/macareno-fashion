import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from './order.service';

export interface CreatePaymentResponse {
  key: string;
  razorpayOrderId: string;
  amount: number;      // paise
  currency: string;
}

export interface VerifyPaymentRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;

  // Address
  fullName: string;
  phoneNumber: string;
  addressLine: string;
  city?: string;
  state?: string;
  pincode: string;

  // Order info
  mode: 'cart' | 'buy-now';
  productId?: number;
  size?: string;
  quantity?: number;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {

  private readonly api = 'http://localhost:8080/api/payments';
  private http = inject(HttpClient);

  createOrder(amount: number): Observable<CreatePaymentResponse> {
    return this.http.post<CreatePaymentResponse>(`${this.api}/create-order`, { amount });
  }

  verify(payload: VerifyPaymentRequest): Observable<Order> {
    return this.http.post<Order>(`${this.api}/verify`, payload);
  }

  /** Trial — save order without payment (dev only) */
  trialPlaceOrder(payload: VerifyPaymentRequest): Observable<Order> {
    return this.http.post<Order>(`${this.api}/trial-place-order`, payload);
  }
}