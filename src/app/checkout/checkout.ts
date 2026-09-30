import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PaymentService, VerifyPaymentRequest } from '../services/payment.service';
import { CartService, CartItem as ApiCartItem } from '../services/cart.service';
import { ProductService, ProductResponse } from '../services/product.service';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

// 👇 Cashfree SDK — loaded via script tag in index.html
declare var Cashfree: any;

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

  // ✅ Cashfree payment is now live — trial mode off
  trialMode = signal(false);

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

    // Cart mode: check for sold-out items before proceeding
    if (this.mode === 'cart') {
      this.validateCartStock(() => this.proceedWithSubmit());
      return;
    }

    // Buy-now mode: single-item stock is checked by the backend on place
    this.proceedWithSubmit();
  }

  /** Runs the actual payment/order flow after validation. */
  private proceedWithSubmit(): void {
    if (this.trialMode()) {
      this.placeTrialOrder();
      return;
    }

    // 👇 Cashfree flow
    this.startCashfreePayment();
  }

  // ============================================================
  // Cart sold-out validation
  // ============================================================
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

          const sizes: any[] = (product as any).sizes || [];
          const match = sizes.find(s => s.size === item.size);
          const qty = match?.quantity ?? match?.qty ?? match?.stock ?? 0;
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
      cashfreeOrderId: 'TRIAL',
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
      next: () => {
        this.submitting.set(false);
        // 👇 Redirect to My Orders
        this.router.navigate(['/my-orders']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.error || 'Failed to place order.');
      }
    });
  }

  // ============================================================
  // CASHFREE: create order + open checkout
  // ============================================================
  private startCashfreePayment(): void {
    const amount = 100; // backend recomputes for cart mode

    this.submitting.set(true);

    this.paymentService.createCashfreeOrder(amount).subscribe({
      next: (res) => this.openCashfreeCheckout(res),
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.error || 'Failed to initiate payment.');
      }
    });
  }

  /** Opens the Cashfree checkout with the payment session id */
  private openCashfreeCheckout(res: { paymentSessionId: string; orderId: string }): void {
    if (typeof Cashfree === 'undefined') {
      this.submitting.set(false);
      this.error.set('Cashfree SDK not loaded. Check index.html.');
      return;
    }

    const cashfree = Cashfree({
      mode: 'production' // 👈 LIVE — real money
    });

    cashfree.checkout({
      paymentSessionId: res.paymentSessionId,
      redirectTarget: '_modal',
    }).then((result: any) => {
      if (result?.error) {
        this.submitting.set(false);
        this.error.set(result.error.message || 'Payment failed.');
        return;
      }

      // Ask backend to verify the payment
      this.verifyAndPlaceOrder(res.orderId);
    });
  }

  // ---------- Cashfree: verify + place order ----------
  private verifyAndPlaceOrder(cashfreeOrderId: string): void {
    const payload: VerifyPaymentRequest = {
      cashfreeOrderId: cashfreeOrderId,
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
      next: () => {
        this.submitting.set(false);
        // 👇 Redirect to My Orders after successful payment
        this.router.navigate(['/my-orders']);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err?.error?.error || 'Payment verification failed.');
      }
    });
  }
}