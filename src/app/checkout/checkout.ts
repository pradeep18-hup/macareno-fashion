import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PaymentService, VerifyPaymentRequest } from '../services/payment.service';

declare var Razorpay: any;

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css'
})
export class Checkout implements OnInit {

  private paymentService = inject(PaymentService);
  private route = inject(ActivatedRoute);
  router = inject(Router);

  mode: 'cart' | 'buy-now' = 'cart';
  buyNowProductId: number | null = null;
  buyNowSize = '';
  buyNowQty = 1;

  form = {
    fullName: '',
    phoneNumber: '',
    addressLine: '',
    city: '',
    state: '',
    pincode: ''
  };

  // ✅ Toggle this to false when Razorpay is live
  trialMode = signal(true);

  submitting = signal(false);
  error = signal('');

  ngOnInit(): void {
    const modeParam = this.route.snapshot.queryParamMap.get('mode');
    this.mode = modeParam === 'buy-now' ? 'buy-now' : 'cart';

    if (this.mode === 'buy-now') {
      this.buyNowProductId = Number(this.route.snapshot.queryParamMap.get('productId'));
      this.buyNowSize = this.route.snapshot.queryParamMap.get('size') || 'One Size';
      this.buyNowQty = Number(this.route.snapshot.queryParamMap.get('qty')) || 1;
    }
  }

  // ---------- Submit ----------
  submit(): void {
    this.error.set('');

    if (!this.form.fullName.trim() ||
        !this.form.phoneNumber.trim() ||
        !this.form.addressLine.trim() ||
        !this.form.pincode.trim()) {
      this.error.set('Please fill in all required address fields.');
      return;
    }

    if (this.mode === 'buy-now' && !this.buyNowProductId) {
      this.error.set('Product information missing.');
      return;
    }

    // ✅ TRIAL MODE — save order without payment
    if (this.trialMode()) {
      this.placeTrialOrder();
      return;
    }

    // ✅ REAL RAZORPAY FLOW
    this.startRazorpayPayment();
  }

  // ---------- Trial: no payment ----------
  private placeTrialOrder(): void {
    const payload: VerifyPaymentRequest = {
      razorpayOrderId: 'TRIAL',
      razorpayPaymentId: 'TRIAL',
      razorpaySignature: 'TRIAL',

      fullName: this.form.fullName.trim(),
      phoneNumber: this.form.phoneNumber.trim(),
      addressLine: this.form.addressLine.trim(),
      city: this.form.city.trim(),
      state: this.form.state.trim(),
      pincode: this.form.pincode.trim(),

      mode: this.mode
    };

    if (this.mode === 'buy-now' && this.buyNowProductId) {
      payload.productId = this.buyNowProductId;
      payload.size = this.buyNowSize;
      payload.quantity = this.buyNowQty;
    }

    this.submitting.set(true);

    this.paymentService.trialPlaceOrder(payload).subscribe({
      next: (order) => {
        this.submitting.set(false);
        this.router.navigate(['/order-success', order.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.error || 'Failed to place order.');
      }
    });
  }

  // ---------- Razorpay: create order ----------
  private startRazorpayPayment(): void {
    // Send a placeholder amount; backend computes from cart/buy-now if needed
    const amount = 100;   // backend recomputes for cart; for buy-now we can pass real total later

    this.submitting.set(true);

    this.paymentService.createOrder(amount).subscribe({
      next: (res) => this.openRazorpayModal(res),
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.error || 'Failed to initiate payment.');
      }
    });
  }

  // ---------- Razorpay: show modal ----------
  private openRazorpayModal(res: { key: string; razorpayOrderId: string; amount: number; currency: string }): void {
    if (typeof Razorpay === 'undefined') {
      this.submitting.set(false);
      this.error.set('Razorpay SDK not loaded. Check index.html.');
      return;
    }

    const options = {
      key: res.key,
      amount: res.amount,
      currency: res.currency,
      name: 'Macarena',
      description: this.mode === 'buy-now' ? 'Buy Now' : 'Cart Checkout',
      order_id: res.razorpayOrderId,
      prefill: {
        name: this.form.fullName,
        contact: this.form.phoneNumber
      },
      theme: { color: '#6b1f2a' },
      handler: (response: any) => this.verifyAndPlaceOrder(response, res.razorpayOrderId),
      modal: {
        ondismiss: () => this.submitting.set(false)
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();
  }

  // ---------- Razorpay: verify + place order ----------
  private verifyAndPlaceOrder(rzpResponse: any, razorpayOrderId: string): void {
    const payload: VerifyPaymentRequest = {
      razorpayOrderId: razorpayOrderId,
      razorpayPaymentId: rzpResponse.razorpay_payment_id,
      razorpaySignature: rzpResponse.razorpay_signature,

      fullName: this.form.fullName.trim(),
      phoneNumber: this.form.phoneNumber.trim(),
      addressLine: this.form.addressLine.trim(),
      city: this.form.city.trim(),
      state: this.form.state.trim(),
      pincode: this.form.pincode.trim(),

      mode: this.mode
    };

    if (this.mode === 'buy-now' && this.buyNowProductId) {
      payload.productId = this.buyNowProductId;
      payload.size = this.buyNowSize;
      payload.quantity = this.buyNowQty;
    }

    this.paymentService.verify(payload).subscribe({
      next: (order) => {
        this.submitting.set(false);
        this.router.navigate(['/order-success', order.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.error || 'Payment verification failed.');
      }
    });
  }
}