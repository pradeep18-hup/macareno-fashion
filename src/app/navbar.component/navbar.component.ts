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
  readonly showUserMenu = signal(false);

  readonly isLoggedIn = signal(false);
  readonly userName   = signal('');
  readonly isAdmin    = signal(false);

  /** Live cart count. */
  readonly cartCount = this.cartService.count;

  /** Live likes count. */
  readonly likesCount = this.likesService.likedCount;

  /** 👇 Logout confirmation modal visibility. */
  readonly showLogoutConfirm = signal(false);

  /** 👇 Toast for success/error feedback. */
  readonly toastMessage = signal('');
  readonly toastKind = signal<'success' | 'error'>('success');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  readonly links: NavLink[] = [];

  ngOnInit(): void {
    this.refreshAuth();
    this.cartService.refreshCount();
    this.likesService.loadLikes();

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.refreshAuth();
        this.cartService.refreshCount();
        this.closeUserMenu();
      });
  }

  private refreshAuth(): void {
    const user = this.authService.getUser();
    this.isLoggedIn.set(!!user);
    this.userName.set(user?.name || '');
    this.isAdmin.set(user?.userType === 'admin');
  }

  // ---------- Navigation ----------
  goToHome(): void { this.router.navigate(['/']); }
  goToCart(): void { this.router.navigate(['/cart']); }
  goToLikes(): void { this.router.navigate(['/liked-products']); }
  goToMyOrders(): void { this.router.navigate(['/my-orders']); }
  goToProfile(): void { this.router.navigate(['/user-profile']); }
  goToContact(): void { this.router.navigate(['/contact']); }
  goToLogin(): void { this.router.navigate(['/login']); }
  goToRegister(): void { this.router.navigate(['/register']); }
  goToAdmin(): void { this.router.navigate(['/admin']); }

  // ---------- Logout ----------
  /** Called by "Sign out" button — opens the confirm modal. */
  openLogoutConfirm(): void {
    this.closeUserMenu();
    this.showLogoutConfirm.set(true);
  }

  cancelLogout(): void {
    this.showLogoutConfirm.set(false);
  }

  /** Called when user confirms the logout in the modal. */
  confirmLogout(): void {
    this.showLogoutConfirm.set(false);

    const name = (this.userName() || '').split(' ')[0] || 'there';

    this.authService.logout();
    this.refreshAuth();
    this.cartService.clearCount();
    this.likesService.loadLikes();

    this.showToast(`Goodbye, ${name}. You've been signed out.`, 'success');
    this.router.navigate(['/login']);
  }

  // ---------- Toast ----------
  private showToast(message: string, kind: 'success' | 'error' = 'success'): void {
    this.toastMessage.set(message);
    this.toastKind.set(kind);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage.set(''), 3500);
  }

  // ---------- User menu ----------
  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.showUserMenu.update(v => !v);
  }

  closeUserMenu(): void { this.showUserMenu.set(false); }

  @HostListener('document:click')
  onDocumentClick(): void { this.closeUserMenu(); }

  // ---------- Mobile menu ----------
  toggleMenu(): void { this.isMenuOpen.update(open => !open); }
  closeMenu(): void { this.isMenuOpen.set(false); }

  @HostListener('window:scroll')
  onWindowScroll(): void { this.isScrolled.set(window.scrollY > 12); }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.showLogoutConfirm()) { this.cancelLogout(); return; }
    this.closeMenu();
    this.closeUserMenu();
  }
}