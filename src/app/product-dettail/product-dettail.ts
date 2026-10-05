import { Component, computed, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { ProductService, ProductResponse } from '../services/product.service';
import { CartService, CartItem as ApiCartItem } from '../services/cart.service';
import { LikesService } from '../services/likes.service';
import { ListScrollService } from '../services/list-scroll.service';
import { AuthService } from '../services/auth.service';

const PRODUCT_ROUTE = '/product-detail';
const HOME_ROUTE = '/';
const LOGIN_ROUTE = '/login';
const RELATED_COUNT = 10;
const LOGIN_REDIRECT_MS = 2000;

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
  soldOutSizes: string[];
  deliveryCharge: number;
  deliveryDays: number;
}

export interface RelatedCard {
  id: number;
  name: string;
  image: string;
  price: number;
  mrp: number;
  discount: number;
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
  soldOutSizes: [],
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
export class ProductDetailComponent implements OnInit, OnDestroy {

  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private likesService = inject(LikesService);
  private listScroll = inject(ListScrollService);
  private auth = inject(AuthService);
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

  alreadyInCart = signal<number>(0);

  toastMessage = signal('');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ---------- Login prompt popup ----------
  showLoginPrompt = signal(false);
  loginPromptMessage = signal('');
  private loginTimer: ReturnType<typeof setTimeout> | null = null;

  // ---------- Related ("next 10") ----------
  relatedProducts = signal<RelatedCard[]>([]);
  hasMore = signal(false);
  private seeMoreAnchorId: number | null = null;

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

  isFullySoldOut = computed<boolean>(() => {
    const p = this.product();
    if (!p.sizes.length) return false;
    return p.sizes.every(size =>
      p.soldOutSizes.includes(size) || (p.sizeStock[size] ?? 0) <= 0
    );
  });

  maxQuantity = computed<number>(() => {
    const p = this.product();
    if (!p.sizes.length) return 99;

    if (p.sizes.length === 1 && p.sizes[0] === 'One Size') {
      if (p.soldOutSizes.includes('One Size')) return 0;
      const totalStock = p.sizeStock['One Size'] ?? 99;
      return Math.max(0, totalStock - this.alreadyInCart());
    }

    if (!this.selectedSize()) return 0;
    if (this.isSizeSoldOut(this.selectedSize()!)) return 0;
    const totalStock = this.selectedSizeStock();
    return Math.max(0, totalStock - this.alreadyInCart());
  });

  // True when the cart already holds all available stock for the selected size
  isMaxReached = computed<boolean>(() =>
    this.alreadyInCart() > 0 && this.maxQuantity() <= 0
  );

  ngOnInit(): void {
    // Guests have no likes; skip the API call (it would return 401)
    if (this.auth.isLoggedIn()) {
      this.likesService.loadLikes();
    }

    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      const id = idParam ? Number(idParam) : null;

      if (!id || Number.isNaN(id)) {
        this.router.navigate([HOME_ROUTE]);
        return;
      }

      // reset UI state for the new product
      this.selectedSize.set(null);
      this.quantity.set(1);
      this.activeImageIndex.set(0);
      this.alreadyInCart.set(0);
      this.closeLoginPrompt();

      window.scrollTo({ top: 0, behavior: 'auto' });
      this.loadProduct(id);
      this.loadRelated(id);
    });
  }

  ngOnDestroy(): void {
    if (this.loginTimer) clearTimeout(this.loginTimer);
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  // ---------- Login prompt ----------
  /**
   * Returns true if the user is logged in.
   * Otherwise shows the popup and auto-redirects to /login after 2 seconds.
   */
  private requireLogin(action: 'cart' | 'like'): boolean {
    if (this.auth.isLoggedIn()) return true;

    this.loginPromptMessage.set(
      action === 'cart'
        ? 'Please login to add items to your cart.'
        : 'Please login to like this product.'
    );
    this.showLoginPrompt.set(true);

    if (this.loginTimer) clearTimeout(this.loginTimer);
    this.loginTimer = setTimeout(() => this.goToLogin(), LOGIN_REDIRECT_MS);
    return false;
  }

  goToLogin(): void {
    if (this.loginTimer) { clearTimeout(this.loginTimer); this.loginTimer = null; }
    this.showLoginPrompt.set(false);
    this.router.navigate([LOGIN_ROUTE], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  closeLoginPrompt(): void {
    if (this.loginTimer) { clearTimeout(this.loginTimer); this.loginTimer = null; }
    this.showLoginPrompt.set(false);
  }

  // ---------- Back / See more ----------
  goBack(): void {
    this.listScroll.setBackTarget();
    this.router.navigate([HOME_ROUTE]);
  }

  seeMore(): void {
    if (this.seeMoreAnchorId) {
      this.listScroll.setSeeMoreTarget(this.seeMoreAnchorId);
    } else {
      this.listScroll.setBackTarget();
    }
    this.router.navigate([HOME_ROUTE]);
  }

  openRelated(id: number): void {
    this.router.navigate([PRODUCT_ROUTE, id]);
  }

  /**
   * Next 10 cards AFTER the current product (same order as the home list).
   * The viewed product is never included.
   */
  private loadRelated(currentId: number): void {
    this.productService.getAll().subscribe({
      next: (all: ProductResponse[]) => {
        const list = (all || []).filter(p => !p.archivedAt);
        const idx = list.findIndex(p => p.id === currentId);
        const others = list.filter(p => p.id !== currentId);

        const following = idx >= 0 ? others.slice(idx) : others;

        const shown = following.slice(0, RELATED_COUNT);
        this.relatedProducts.set(shown.map(p => this.toCard(p)));

        this.hasMore.set(following.length > RELATED_COUNT);
        this.seeMoreAnchorId = following[RELATED_COUNT]?.id ?? null;
      },
      error: () => {
        this.relatedProducts.set([]);
        this.hasMore.set(false);
      }
    });
  }

  private toCard(p: ProductResponse): RelatedCard {
    const price = (p.offerPrice && p.offerPrice > 0) ? p.offerPrice : p.price;
    const discount = p.price > price
      ? Math.round(((p.price - price) / p.price) * 100)
      : 0;
    return {
      id: p.id,
      name: p.dressName,
      image: this.productService.imageUrl(p.photoUrls?.[0]),
      price,
      mrp: p.price,
      discount
    };
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/placeholder-product.svg';
  }

  // ---------- Product load ----------
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
    // Guests have no cart; skip the API call (it would return 401)
    if (!this.auth.isLoggedIn()) {
      this.alreadyInCart.set(0);
      return;
    }

    this.cartService.getCart().subscribe({
      next: (items: ApiCartItem[]) => this.updateAlreadyInCart(items || []),
      error: () => this.alreadyInCart.set(0)
    });
  }

  private updateAlreadyInCart(items: ApiCartItem[]): void {
    const p = this.product();
    if (!p.id) { this.alreadyInCart.set(0); return; }

    const size = this.selectedSize();

    if (p.sizes.length === 1 && p.sizes[0] === 'One Size') {
      const match = items.find(i => i.productId === p.id);
      this.alreadyInCart.set(match ? match.quantity : 0);
      return;
    }

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
        s.quantity ?? s.qty ?? s.stock ?? s.availableQty ?? s.available ?? s.count ?? 0;
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
      soldOutSizes: (p as any).soldOutSizes || [],
      deliveryCharge: 0,
      deliveryDays: 5
    };
  }

  setActiveImage(i: number): void { this.activeImageIndex.set(i); }

  // ---------- Sold-out detection ----------
  isSizeSoldOut(size: string): boolean {
    return this.product().soldOutSizes.includes(size);
  }

  get selectedSizeSoldOut(): boolean {
    const size = this.selectedSize();
    return size ? this.isSizeSoldOut(size) : false;
  }

  selectSize(size: string): void {
    if (this.isSizeSoldOut(size)) return;

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
    if (!this.requireLogin('like')) return;

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

    if (this.selectedSize() && this.isSizeSoldOut(this.selectedSize()!)) {
      return 'This size is sold out. Please choose another size.';
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
    if (this.isMaxReached()) return;
    if (!this.requireLogin('cart')) return;

    const error = this.validateSelection();
    if (error) { this.showToast(error); return; }

    const p = this.product();
    const size = this.selectedSize() ?? 'One Size';
    this.addingToCart.set(true);

    this.cartService.addToCart(p.id, size, this.quantity()).subscribe({
      next: () => {
        this.addingToCart.set(false);
        this.showToast(`Added ${this.quantity()} × ${p.name} (${size}) to cart ✓`);
        this.refreshCartCount();
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