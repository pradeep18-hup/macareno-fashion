import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  ProductService,
  ProductResponse,
  DressType
} from '../services/product.service';

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
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent implements OnInit {

  private productService = inject(ProductService);
  private router = inject(Router);

  // ---------- UI state ----------
  categories = signal<string[]>(['All']);
  activeCategory = signal('All');

  products = signal<Product[]>([]);
  loading = signal(true);
  loadError = signal('');

  // ---------- Lifecycle ----------
  ngOnInit(): void {
    this.loadDressTypes();
    this.loadProducts();
  }

  // ---------- Load dress types (for filter tabs) ----------
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

  // ---------- Load products (for cards) ----------
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
  }

  // ---------- Map backend → UI ----------
  private mapToUiProduct(p: ProductResponse): Product {
    const images = (p.photoUrls || []).map(u => this.productService.imageUrl(u));
    const firstImage = images[0] || 'assets/placeholder-product.jpg';
    const mrp = p.price;
    const sellingPrice = (p.offerPrice && p.offerPrice > 0) ? p.offerPrice : p.price;

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
      returnPolicyDays: 14
    };
  }

  // ---------- UI events ----------
  toggleFavorite(product: Product, event: Event): void {
    event.stopPropagation();
    product.isFavorite = !product.isFavorite;
    this.products.set([...this.products()]);
  }

  selectCategory(category: string): void {
    this.activeCategory.set(category);
  }

  formatPrice(price: number): string {
    return '₹' + price.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  getDiscount(product: Product): number {
    if (!product.mrp || product.mrp <= product.price) return 0;
    return Math.round(((product.mrp - product.price) / product.mrp) * 100);
  }

  openProduct(product: Product): void {
    this.router.navigate(['/product-detail', product.id]);
  }

  // ---------- Computed ----------
  filteredProducts = computed(() => {
    const category = this.activeCategory();
    return this.products().filter(p =>
      category === 'All' || p.category === category
    );
  });
}