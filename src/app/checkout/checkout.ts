import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PaymentService, VerifyPaymentRequest } from '../services/payment.service';
import { CartService, CartItem as ApiCartItem } from '../services/cart.service';
import { ProductService, ProductResponse } from '../services/product.service';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

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
  private cartService = inject(CartService);
  private productService = inject(ProductService);
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

    // 👇 NEW — cart mode: check for sold-out items before proceeding
    if (this.mode === 'cart') {
      this.validateCartStock(() => this.proceedWithSubmit());
      return;
    }

    // Buy-now mode: single-item stock is checked by the backend on place
    this.proceedWithSubmit();
  }

  /** Runs the actual payment/order flow after validation. */
  private proceedWithSubmit(): void {
    // ✅ TRIAL MODE — save order without payment
    if (this.trialMode()) {
      this.placeTrialOrder();
      return;
    }

    // ✅ REAL RAZORPAY FLOW
    this.startRazorpayPayment();
  }

  // ============================================================
  // 👇 NEW — Cart sold-out validation
  // ============================================================
  /**
   * Re-fetches the cart and checks each item's product for sold-out sizes.
   * If any item is sold out, sets the error and does NOT call `onValid`.
   * Otherwise calls `onValid()` (which proceeds with payment/order).
   */
  private validateCartStock(onValid: () => void): void {
    this.submitting.set(true);

    this.cartService.getCart().pipe(
      switchMap((items: ApiCartItem[]) => {
        if (!items || items.length === 0) {
          return of<{ item: ApiCartItem; product: ProductResponse | null }[]>([]);
        }
        const requests: Observable<{ item: ApiCartItem; product: ProductResponse | null }>[] =
          items.map(item =>
            this.productService.getById(item.productId).pipe(
              map(p => ({ item, product: p as ProductResponse })),
              catchError(() => of({ item, product: null }))
            )
          );
        return forkJoin(requests);
      })
    ).subscribe({
      next: (list) => {
        const soldOut: string[] = [];

        list.forEach(({ item, product }) => {
          if (!product) return;

          const soldOutSizes: string[] = (product as any).soldOutSizes || [];
          if (soldOutSizes.includes(item.size)) {
            soldOut.push(product.dressName);
            return;
          }

          // Also treat 0 stock as sold out (defense in depth)
          const sizes: any[] = (product as any).sizes || [];
          const match = sizes.find(s => s.size === item.size);
          const qty =
            match?.quantity ?? match?.qty ?? match?.stock ?? 0;
          if (qty <= 0) {
            soldOut.push(product.dressName);
          }
        });

        if (soldOut.length > 0) {
          this.submitting.set(false);
          this.error.set(
            'Some items in your cart are sold out: ' +
            soldOut.join(', ') +
            '. Please remove them and try again.'
          );
          return;
        }

        // All good — proceed with payment
        onValid();
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.error || 'Failed to verify cart. Please try again.');
      }
    });
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
    const amount = 100;   // backend recomputes for cart

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