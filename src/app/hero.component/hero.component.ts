import { Component, computed, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  ProductService,
  ProductResponse,
  DressType
} from '../services/product.service';
import { LikesService } from '../services/likes.service';
import { AuthService } from '../services/auth.service';

const LOGIN_ROUTE = '/login';
const LOGIN_REDIRECT_MS = 2000;

export interface Product {
  id: number;
  name: string;
  price: number;
  mrp: number;
  image: string;
  images: string[];
  category: string;
  rating: number;
  ratingCount: number;
  isFavorite: boolean;
  quantity: number;
  description: string;
  highlights: string[];
  sizes: string[];
  deliveryCharge: number;
  deliveryDays: number;
  codAvailable: boolean;
  returnPolicyDays: number;
  soldOutSizes: string[];
  totalQty: number;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements OnInit, OnDestroy {

  private productService = inject(ProductService);
  private likesService = inject(LikesService);
  private auth = inject(AuthService);
  private router = inject(Router);

  categories = signal<string[]>(['All']);
  activeCategory = signal('All');

  products = signal<Product[]>([]);
  loading = signal(true);
  loadError = signal('');

  // ---------- Login prompt popup ----------
  showLoginPrompt = signal(false);
  loginPromptMessage = signal('');
  private loginTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    // Guests have no likes; skip the API call (it would return 401)
    if (this.auth.isLoggedIn()) {
      this.likesService.loadLikes();
    }
    this.loadDressTypes();
    this.loadProducts();
  }

  ngOnDestroy(): void {
    if (this.loginTimer) clearTimeout(this.loginTimer);
  }

  // ---------- Login prompt ----------
  /**
   * Returns true if logged in.
   * Otherwise shows the popup and auto-redirects to /login after 2 seconds.
   */
  private requireLogin(message: string): boolean {
    if (this.auth.isLoggedIn()) return true;

    this.loginPromptMessage.set(message);
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

  // ---------- Data ----------
  private loadDressTypes(): void {
    this.productService.getDressTypes().subscribe({
      next: (list: DressType[]) => {
        const names = (list || []).map(d => d.name).filter(n => !!n);
        this.categories.set(['All', ...names]);
      },
      error: (err: any) => {
        console.error('Failed to load dress types', err);
      }
    });
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.productService.getAll().subscribe({
      next: (list: ProductResponse[]) => {
        const mapped = (list || []).map(p => this.mapToUiProduct(p));
        this.products.set(mapped);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Failed to load products', err);
        this.loadError.set(err?.error?.error || 'Failed to load products.');
        this.loading.set(false);
      }
    });
  }

  reload(): void {
    this.loadDressTypes();
    this.loadProducts();
    if (this.auth.isLoggedIn()) {
      this.likesService.loadLikes();
    }
  }

  private mapToUiProduct(p: ProductResponse): Product {
    const images = (p.photoUrls || []).map(u => this.productService.imageUrl(u));
    const firstImage = images[0] || 'assets/placeholder-product.svg';
    const mrp = Number(p.price) || 0;
    const offer = Number(p.offerPrice) || 0;
    const sellingPrice = offer > 0 ? offer : mrp;

    return {
      id: p.id,
      name: p.dressName,
      price: sellingPrice,
      mrp: mrp,
      image: firstImage,
      images: images.length ? images : [firstImage],
      category: p.dressTypeName || 'Uncategorised',
      rating: 0,
      ratingCount: 0,
      isFavorite: false,
      quantity: 1,
      description: '',
      highlights: [],
      sizes: (p.sizes || []).map(s => s.size),
      deliveryCharge: 0,
      deliveryDays: 4,
      codAvailable: true,
      returnPolicyDays: 14,
      soldOutSizes: (p as any).soldOutSizes || [],
      totalQty: p.totalQty ?? 0
    };
  }

  isLiked(productId: number): boolean {
    return this.likesService.isLiked(productId);
  }

  toggleFavorite(product: Product, event: Event): void {
    // Always stop the click from opening the product page
    event.stopPropagation();
    event.preventDefault();

    if (!this.requireLogin('Please login to like this product.')) return;

    this.likesService.toggle(product.id).subscribe({
      next: () => { /* reactive signal updates the UI */ },
      error: (err) => {
        console.error('Like toggle failed', err);
      }
    });
  }

  /** Sold out ONLY when total stock across all sizes is 0. */
  isSoldOut(product: Product): boolean {
    return product.totalQty === 0;
  }

  trackById(_: number, product: Product): number {
    return product.id;
  }

  selectCategory(category: string): void {
    this.activeCategory.set(category);
  }

  /** Shows decimals (₹13.5) instead of rounding to ₹13 */
  formatPrice(price: number): string {
    return '₹' + price.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  getDiscount(product: Product): number {
    if (!product.mrp || product.mrp <= product.price) return 0;
    return Math.round(((product.mrp - product.price) / product.mrp) * 100);
  }

  openProduct(product: Product): void {
    this.router.navigate(['/product-detail', product.id]);
  }

  filteredProducts = computed(() => {
    const category = this.activeCategory();
    return this.products().filter(p =>
      category === 'All' || p.category === category
    );
  });
}