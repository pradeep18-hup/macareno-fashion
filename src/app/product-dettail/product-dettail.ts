import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { ProductService, ProductResponse } from '../services/product.service';
import { CartService, CartItem as ApiCartItem } from '../services/cart.service';
import { LikesService } from '../services/likes.service';

export interface Product {
  id: number;
  name: string;
  price: number;
  mrp: number;
  images: string[];
  category: string;
  rating: number;
  ratingCount: number;
  isFavorite: boolean;
  description: string;
  highlights: string[];
  sizes: string[];
  sizeStock: Record<string, number>;
  deliveryCharge: number;
  deliveryDays: number;
}

const EMPTY_PRODUCT: Product = {
  id: 0,
  name: '',
  price: 0,
  mrp: 0,
  images: [],
  category: '',
  rating: 0,
  ratingCount: 0,
  isFavorite: false,
  description: '',
  highlights: [],
  sizes: [],
  sizeStock: {},
  deliveryCharge: 0,
  deliveryDays: 5
};

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-dettail.html',
  styleUrl: './product-dettail.css'
})
export class ProductDetailComponent implements OnInit {

  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private likesService = inject(LikesService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  product = signal<Product>({ ...EMPTY_PRODUCT });
  loading = signal(true);
  loadError = signal('');

  activeImageIndex = signal(0);
  selectedSize = signal<string | null>(null);
  quantity = signal(1);
  addingToCart = signal(false);
  liking = signal(false);

  /** How many of this product+size are already in the cart. */
  alreadyInCart = signal<number>(0);

  toastMessage = signal('');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  discount = computed(() => {
    const p = this.product();
    return p.mrp > p.price
      ? Math.round(((p.mrp - p.price) / p.mrp) * 100)
      : 0;
  });

  totalPrice = computed(() => this.product().price * this.quantity());

  isLiked = computed<boolean>(() => {
    const id = this.product().id;
    return id > 0 && this.likesService.isLiked(id);
  });

  selectedSizeStock = computed<number>(() => {
    const size = this.selectedSize();
    if (!size) return 0;
    return this.product().sizeStock[size] ?? 0;
  });

  /**
   * Max you can ADD NOW = total stock − what's already in the cart.
   */
  maxQuantity = computed<number>(() => {
    const p = this.product();
    if (!p.sizes.length) return 99;

    // "One Size" product
    if (p.sizes.length === 1 && p.sizes[0] === 'One Size') {
      const totalStock = p.sizeStock['One Size'] ?? 99;
      return Math.max(0, totalStock - this.alreadyInCart());
    }

    // Multi-size
    if (!this.selectedSize()) return 0;
    const totalStock = this.selectedSizeStock();
    return Math.max(0, totalStock - this.alreadyInCart());
  });

  ngOnInit(): void {
    window.scrollTo({ top: 0, behavior: 'auto' });
    this.likesService.loadLikes();

    const idParam = this.route.snapshot.paramMap.get('id');
    const id = idParam ? Number(idParam) : null;

    if (!id || Number.isNaN(id)) {
      this.router.navigate(['/']);
      return;
    }
    this.loadProduct(id);
  }

  private loadProduct(id: number): void {
    this.loading.set(true);
    this.loadError.set('');

    this.productService.getById(id).subscribe({
      next: (p: ProductResponse) => {
        const uiProduct = this.mapToUiProduct(p);
        this.product.set(uiProduct);

        if (uiProduct.sizes.length === 1) {
          this.selectedSize.set(uiProduct.sizes[0]);
        }

        this.loading.set(false);
        window.scrollTo({ top: 0, behavior: 'auto' });

        // Load cart to compute remaining addable qty
        this.refreshCartCount();
      },
      error: (err: any) => {
        console.error('Failed to load product', err);
        this.loadError.set(err?.error?.error || 'Failed to load product.');
        this.loading.set(false);
      }
    });
  }

  private refreshCartCount(): void {
    this.cartService.getCart().subscribe({
      next: (items: ApiCartItem[]) => this.updateAlreadyInCart(items || []),
      error: () => this.alreadyInCart.set(0)
    });
  }

  private updateAlreadyInCart(items: ApiCartItem[]): void {
    const p = this.product();
    if (!p.id) { this.alreadyInCart.set(0); return; }

    const size = this.selectedSize();

    // One Size
    if (p.sizes.length === 1 && p.sizes[0] === 'One Size') {
      const match = items.find(i => i.productId === p.id);
      this.alreadyInCart.set(match ? match.quantity : 0);
      return;
    }

    // Multi-size
    if (!size) { this.alreadyInCart.set(0); return; }
    const match = items.find(i => i.productId === p.id && i.size === size);
    this.alreadyInCart.set(match ? match.quantity : 0);
  }

  private mapToUiProduct(p: ProductResponse): Product {
    const images = (p.photoUrls || []).map(u => this.productService.imageUrl(u));
    const firstImage = images[0] || 'assets/placeholder-product.svg';
    const mrp = p.price;
    const sellingPrice = (p.offerPrice && p.offerPrice > 0) ? p.offerPrice : p.price;

    const rawSizes: any[] = p.sizes || [];
    const sizeLabels: string[] = rawSizes.map(s => s.size);
    const sizeStock: Record<string, number> = {};
    rawSizes.forEach(s => {
      sizeStock[s.size] =
        s.quantity ?? s.stock ?? s.availableQty ?? s.available ?? s.qty ?? s.count ?? 0;
    });

    return {
      id: p.id,
      name: p.dressName,
      price: sellingPrice,
      mrp: mrp,
      images: images.length ? images : [firstImage],
      category: p.dressTypeName || 'Uncategorised',
      rating: 0,
      ratingCount: 0,
      isFavorite: false,
      description: '',
      highlights: [],
      sizes: sizeLabels,
      sizeStock,
      deliveryCharge: 0,
      deliveryDays: 5
    };
  }

  setActiveImage(i: number): void { this.activeImageIndex.set(i); }

  selectSize(size: string): void {
    const stock = this.product().sizeStock[size] ?? 0;
    if (stock <= 0) return;

    this.selectedSize.set(size);
    this.refreshCartCount();

    const remaining = Math.max(0, stock - this.alreadyInCart());
    if (this.quantity() > remaining && remaining > 0) {
      this.quantity.set(remaining);
    } else if (remaining <= 0) {
      this.quantity.set(1);
    }
  }

  stockFor(size: string): number {
    return this.product().sizeStock[size] ?? 0;
  }

  increaseQuantity(): void {
    const max = this.maxQuantity();
    if (this.quantity() < max) this.quantity.update(q => q + 1);
  }

  decreaseQuantity(): void {
    if (this.quantity() > 1) this.quantity.update(q => q - 1);
  }

  // ---------- Favorite ----------
  toggleFavorite(): void {
    const id = this.product().id;
    if (!id) return;

    this.liking.set(true);
    this.likesService.toggle(id).subscribe({
      next: () => this.liking.set(false),
      error: () => {
        this.liking.set(false);
        this.showToast('Could not update likes. Please try again.');
      }
    });
  }

  formatPrice(price: number): string {
    return '₹' + price.toLocaleString('en-IN');
  }

  // ---------- Validation ----------
  private validateSelection(): string | null {
    const p = this.product();

    if (p.sizes.length && p.sizes[0] !== 'One Size' && !this.selectedSize()) {
      return 'Please select a size first.';
    }

    const max = this.maxQuantity();

    if (max <= 0) {
      if (this.alreadyInCart() > 0) {
        return 'You already have the maximum available quantity in your cart.';
      }
      return 'This item is out of stock.';
    }

    if (this.quantity() > max) {
      return `Only ${max} more can be added (you already have ${this.alreadyInCart()} in your cart).`;
    }

    return null;
  }

  addToCart(): void {
    const error = this.validateSelection();
    if (error) { this.showToast(error); return; }

    const p = this.product();
    const size = this.selectedSize() ?? 'One Size';
    this.addingToCart.set(true);

    this.cartService.addToCart(p.id, size, this.quantity()).subscribe({
      next: () => {
        this.addingToCart.set(false);
        this.showToast(`Added ${this.quantity()} × ${p.name} (${size}) to cart ✓`);
        this.refreshCartCount();   // recompute remaining
      },
      error: (err) => {
        this.addingToCart.set(false);
        this.showToast(err?.error?.error || 'Failed to add to cart.');
      }
    });
  }

  private showToast(message: string): void {
    this.toastMessage.set(message);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage.set(''), 3000);
  }
}