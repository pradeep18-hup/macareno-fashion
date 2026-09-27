import {
  Component, HostListener, signal, inject, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router, RouterLink, RouterLinkActive, NavigationEnd
} from '@angular/router';
import { filter } from 'rxjs/operators';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
import { LikesService } from '../services/likes.service';

interface NavLink {
  label: string;
  routerLink: string;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent implements OnInit {

  private cartService = inject(CartService);
  private authService = inject(AuthService);
  private likesService = inject(LikesService);
  private router = inject(Router);

  readonly isMenuOpen   = signal(false);
  readonly isScrolled   = signal(false);
  readonly cartCount    = signal(0);
  readonly showUserMenu = signal(false);

  readonly isLoggedIn = signal(false);
  readonly userName   = signal('');
  readonly isAdmin    = signal(false);

  /** Reactive like count for the badge. */
  readonly likesCount = this.likesService.likedCount;

  readonly links: NavLink[] = [];

  ngOnInit(): void {
    this.refreshAuth();
    this.refreshCartCount();
    this.likesService.loadLikes();       // 👈 load likes on navbar init

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.refreshAuth();
        this.refreshCartCount();
        this.closeUserMenu();
      });
  }

  private refreshAuth(): void {
    const user = this.authService.getUser();
    this.isLoggedIn.set(!!user);
    this.userName.set(user?.name || '');
    this.isAdmin.set(user?.userType === 'admin');
  }

  refreshCartCount(): void {
    if (!this.authService.isCustomer()) {
      this.cartCount.set(0);
      return;
    }

    this.cartService.getCart().subscribe({
      next: (items) => {
        const total = (items || []).reduce((sum, i) => sum + i.quantity, 0);
        this.cartCount.set(total);
      },
      error: () => this.cartCount.set(0)
    });
  }

  // ---------- Navigation ----------
  goToHome(): void {
    this.router.navigate(['/']);
  }

  goToCart(): void {
    this.router.navigate(['/cart']);
  }

  goToLikes(): void {
    this.router.navigate(['/liked-products']);
  }

  goToMyOrders(): void {
    this.router.navigate(['/my-orders']);
  }

  goToProfile(): void {
    this.router.navigate(['/user-profile']);
  }

  goToContact(): void {
    this.router.navigate(['/contact']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToAdmin(): void {
    this.router.navigate(['/admin']);
  }

  logout(): void {
    if (!confirm('Sign out?')) return;
    this.authService.logout();
    this.refreshAuth();
    this.cartCount.set(0);
    this.likesService.loadLikes();       // 👈 clears cache (guest)
    this.closeUserMenu();
    this.router.navigate(['/login']);
  }

  // ---------- User menu ----------
  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.showUserMenu.update(v => !v);
  }

  closeUserMenu(): void {
    this.showUserMenu.set(false);
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.closeUserMenu();
  }

  // ---------- Mobile menu ----------
  toggleMenu(): void {
    this.isMenuOpen.update(open => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.isScrolled.set(window.scrollY > 12);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
    this.closeUserMenu();
  }
}