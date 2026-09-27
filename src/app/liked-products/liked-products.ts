import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LikesService, LikedProductDetails } from '../services/likes.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-liked-products',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  templateUrl: './liked-products.html',
  styleUrl: './liked-products.css'
})
export class LikedProductsComponent implements OnInit {

  private likesService = inject(LikesService);
  private productService = inject(ProductService);

  items = signal<LikedProductDetails[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.loadLikedProducts();
  }

  private loadLikedProducts(): void {
    this.loading.set(true);

    this.likesService.getLikedProductsDetailed().subscribe({
      next: (list) => {
        // Prefix relative photo paths with backend base URL
        const withUrls = (list || []).map(item => ({
          ...item,
          image: item.image ? this.productService.imageUrl(item.image) : undefined
        }));
        this.items.set(withUrls);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load liked products', err);
        this.items.set([]);
        this.loading.set(false);
      }
    });
  }

  /** 👈 Angular *ngFor trackBy — required by the template */
  trackById(_: number, item: LikedProductDetails): number {
    return item.productId;
  }

  /** 👈 Un-like button handler on each card */
  unlike(event: Event, productId: number): void {
    event.preventDefault();
    event.stopPropagation();

    this.likesService.remove(productId).subscribe({
      next: () => {
        this.items.update(list => list.filter(i => i.productId !== productId));
      },
      error: (err) => {
        console.error('Failed to unlike', err);
        alert('Could not remove from likes. Please try again.');
      }
    });
  }
}