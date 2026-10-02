import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from './order.service';
import { environment } from '../../environments/environment.development';

export interface CreateCashfreeOrderResponse {
  paymentSessionId: string;   // 👈 returned by Cashfree create-order
  orderId: string;            // Cashfree's internal order id
}

export interface VerifyPaymentRequest {
  cashfreeOrderId: string;    // 👈 Cashfree order id (not razorpay)

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

  private readonly api = `${environment.apiUrl}/payments`;
  private http = inject(HttpClient);

  /** Creates a Cashfree order and returns the payment session id */
  createCashfreeOrder(amount: number): Observable<CreateCashfreeOrderResponse> {
    return this.http.post<CreateCashfreeOrderResponse>(
      `${this.api}/cashfree/create-order`,
      { amount }
    );
  }

  /** Verifies payment with backend and places the order */
  verify(payload: VerifyPaymentRequest): Observable<Order> {
    return this.http.post<Order>(`${this.api}/cashfree/verify`, payload);
  }

  /** Trial — save order without payment (dev only) */
  trialPlaceOrder(payload: VerifyPaymentRequest): Observable<Order> {
    return this.http.post<Order>(`${this.api}/trial-place-order`, payload);
  }
}