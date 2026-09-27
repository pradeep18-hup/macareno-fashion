import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { CartService, CartItem as ApiCartItem } from '../services/cart.service';
import { ProductService, ProductResponse } from '../services/product.service';

interface CartItemView {
  id: number;
  productId: number;
  name: string;
  image: string;
  price: number;
  offerPrice?: number;
  size: string;
  qty: number;
}

@Component({
  selector: 'app-cart-preview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './shop-cart.html',
  styleUrl: './shop-cart.css'
})
export class ShopCartComponent implements OnInit {

  private cartService = inject(CartService);
  private productService = inject(ProductService);
  private router = inject(Router);

  cartItems = signal<CartItemView[]>([]);
  loading = signal(true);
  loadError = signal('');

  // ✅ Minimum order quantity
  readonly minOrderQty = 5;

  ngOnInit(): void {
    this.loadCart();
  }

  private loadCart(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.cartService.getCart().pipe(
      switchMap((items: ApiCartItem[]) => {
        if (!items || items.length === 0) {
          return of<CartItemView[]>([]);
        }

        const requests: Observable<CartItemView>[] = items.map(item =>
          this.productService.getById(item.productId).pipe(
            map((p: ProductResponse) => this.enrich(item, p)),
            catchError(() => of(this.fallback(item)))
          )
        );

        return forkJoin(requests);
      })
    ).subscribe({
      next: (view) => {
        this.cartItems.set(view);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(err?.error?.error || 'Failed to load cart.');
      }
    });
  }

  reload(): void {
    this.loadCart();
  }

  private enrich(item: ApiCartItem, p: ProductResponse): CartItemView {
    const image = (p.photoUrls || [])
      .map(u => this.productService.imageUrl(u))[0]
      || 'assets/placeholder-product.jpg';

    const selling = (p.offerPrice && p.offerPrice > 0 && p.offerPrice < p.price)
      ? p.offerPrice
      : undefined;

    return {
      id: item.id,
      productId: item.productId,
      name: p.dressName,
      image,
      price: p.price,
      offerPrice: selling,
      size: item.size,
      qty: item.quantity
    };
  }

  private fallback(item: ApiCartItem): CartItemView {
    return {
      id: item.id,
      productId: item.productId,
      name: `Product #${item.productId}`,
      image: 'assets/placeholder-product.jpg',
      price: 0,
      offerPrice: undefined,
      size: item.size,
      qty: item.quantity
    };
  }

  // ---------- Display helpers ----------
  hasOffer(item: CartItemView): boolean {
    return item.offerPrice !== undefined && item.offerPrice < item.price;
  }

  unitPrice(item: CartItemView): number {
    return item.offerPrice ?? item.price;
  }

  lineTotal(item: CartItemView): number {
    return this.unitPrice(item) * item.qty;
  }

  get totalCount(): number {
    return this.cartItems().reduce((s, i) => s + i.qty, 0);
  }

  get originalTotal(): number {
    return this.cartItems().reduce((s, i) => s + i.price * i.qty, 0);
  }

  get payableTotal(): number {
    return this.cartItems().reduce((s, i) => s + this.unitPrice(i) * i.qty, 0);
  }

  get savings(): number {
    return this.originalTotal - this.payableTotal;
  }

  // ✅ Minimum check
  get meetsMinimum(): boolean {
    return this.totalCount >= this.minOrderQty;
  }

  get itemsNeeded(): number {
    return Math.max(0, this.minOrderQty - this.totalCount);
  }

  // ---------- Actions ----------
  increase(item: CartItemView): void {
    const newQty = item.qty + 1;
    this.cartService.updateQuantity(item.id, newQty).subscribe({
      next: () => this.loadCart(),
      error: (err) => alert(err?.error?.error || 'Failed to update quantity.')
    });
  }

  decrease(item: CartItemView): void {
    if (item.qty <= 1) return;
    const newQty = item.qty - 1;
    this.cartService.updateQuantity(item.id, newQty).subscribe({
      next: () => this.loadCart(),
      error: (err) => alert(err?.error?.error || 'Failed to update quantity.')
    });
  }

  remove(item: CartItemView): void {
    if (!confirm(`Remove "${item.name}" (${item.size}) from your cart?`)) return;

    this.cartService.remove(item.id).subscribe({
      next: () => this.loadCart(),
      error: (err) => alert(err?.error?.error || 'Failed to remove item.')
    });
  }

  // ✅ Buy Now guard
  goToCheckout(): void {
    if (!this.meetsMinimum) {
      return; // guard — button is disabled anyway
    }
    this.router.navigate(['/checkout'], {
      queryParams: { mode: 'cart' }
    });
  }
}