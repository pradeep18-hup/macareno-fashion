import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of, map } from 'rxjs';
import { AuthService } from './auth.service';

export interface LikedProductDetails {
  productId: number;
  name?: string;
  image?: string;
  price?: number;
}

@Injectable({ providedIn: 'root' })
export class LikesService {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly api = 'http://localhost:8080/api/likes';

  /** Set of liked product IDs for the current user. */
  private readonly likedIds = signal<Set<number>>(new Set());

  /** Reactive count for the navbar badge. */
  readonly likedCount = computed(() => this.likedIds().size);

  /** Is the given product currently liked? */
  isLiked(productId: number): boolean {
    return this.likedIds().has(productId);
  }

  /** Load liked product IDs from the backend. Call on login / app init. */
  loadLikes(): void {
    if (!this.authService.isCustomer()) {
      this.likedIds.set(new Set());
      return;
    }

    this.http.get<number[]>(this.api).subscribe({
      next: (ids) => this.likedIds.set(new Set(ids || [])),
      error: () => this.likedIds.set(new Set())
    });
  }

  /** Toggle like state. Returns the NEW state (true = liked). */
  toggle(productId: number): Observable<boolean> {
    const wasLiked = this.likedIds().has(productId);

    const req$: Observable<unknown> = wasLiked
      ? this.http.delete<void>(`${this.api}/${productId}`)
      : this.http.post<void>(`${this.api}/${productId}`, {});

    return req$.pipe(
      map(() => !wasLiked),
      tap((nowLiked) => {
        const next = new Set(this.likedIds());
        if (nowLiked) next.add(productId);
        else next.delete(productId);
        this.likedIds.set(next);
      }),
      catchError((err) => {
        console.error('Like toggle failed', err);
        return of(wasLiked); // revert on failure
      })
    );
  }

  /** Explicit add. */
  add(productId: number): Observable<void> {
    return this.http.post<void>(`${this.api}/${productId}`, {}).pipe(
      tap(() => {
        const next = new Set(this.likedIds());
        next.add(productId);
        this.likedIds.set(next);
      })
    );
  }

  /** Explicit remove. */
  remove(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${productId}`).pipe(
      tap(() => {
        const next = new Set(this.likedIds());
        next.delete(productId);
        this.likedIds.set(next);
      })
    );
  }

  /** Fetch enriched liked products for the /liked-products page. */
  getLikedProductsDetailed(): Observable<LikedProductDetails[]> {
    return this.http.get<LikedProductDetails[]>(`${this.api}/details`);
  }
}