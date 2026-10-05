import { Injectable, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';

const HOME_URL = '/';
const DETAIL_PREFIX = '/product-detail';

type RestoreTarget =
  | { type: 'y'; y: number }
  | { type: 'card'; id: number };

/**
 * Automatically remembers the home-page scroll position when a product
 * is opened, and restores it when the user comes back (Back / See more).
 * No code needed in the home component for Back to work.
 */
@Injectable({ providedIn: 'root' })
export class ListScrollService {

  private router = inject(Router);

  private savedY = 0;
  private target: RestoreTarget | null = null;
  private fromDetail = false;

  constructor() {
    this.router.events.subscribe(ev => {

      // 1) Leaving HOME → open a product: save scroll position
      if (ev instanceof NavigationStart) {
        const current = this.path(this.router.url);
        const next = this.path(ev.url);

        if (current === HOME_URL && next.startsWith(DETAIL_PREFIX)) {
          this.savedY = window.scrollY;
          this.target = null;
        }
        // Leaving a product page → HOME
        this.fromDetail = current.startsWith(DETAIL_PREFIX) && next === HOME_URL;
      }

      // 2) Arrived at HOME from a product page → restore
      if (ev instanceof NavigationEnd) {
        const url = this.path(ev.urlAfterRedirects);
        if (url === HOME_URL && this.fromDetail) {
          const t: RestoreTarget = this.target ?? { type: 'y', y: this.savedY };
          this.fromDetail = false;
          this.target = null;
          this.restoreWhenReady(t);
        }
      }
    });
  }

  /** Back button */
  setBackTarget(): void {
    this.target = { type: 'y', y: this.savedY };
  }

  /** See more → scroll to the card after the 10 shown */
  setSeeMoreTarget(cardId: number): void {
    this.target = { type: 'card', id: cardId };
  }

  // Old methods (no longer needed) — kept so old calls don't break the build
  save(): void {}
  restore(): void {}

  private path(url: string): string {
    return url.split('?')[0].split('#')[0] || '/';
  }

  /** Home loads products asynchronously, so keep trying until the page is tall enough. */
  private restoreWhenReady(t: RestoreTarget): void {
    let tries = 0;
    const maxTries = 60;   // ~3 seconds

    const attempt = () => {
      tries++;

      if (t.type === 'card') {
        const el = document.getElementById('product-card-' + t.id);
        if (el) {
          el.scrollIntoView({ block: 'start' });
          return;
        }
      } else {
        const tallEnough =
          document.documentElement.scrollHeight >= t.y + window.innerHeight;
        if (tallEnough) {
          window.scrollTo(0, t.y);
          return;
        }
      }

      if (tries < maxTries) {
        setTimeout(attempt, 50);
      } else if (t.type === 'card') {
        window.scrollTo(0, this.savedY);   // card id illana fallback
      } else {
        window.scrollTo(0, t.y);
      }
    };

    // small delay so Angular's own scroll-to-top finishes first
    setTimeout(attempt, 80);
  }
}