import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface NavLink {
  label: string;
  routerLink: string;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  readonly isMenuOpen = signal(false);
  readonly isScrolled = signal(false);

  readonly links: NavLink[] = [
    { label: 'Orders', routerLink: '/orders' },
    { label: 'Admin', routerLink: '/admin' },
    { label: 'Users', routerLink: '/customer-list' },
    { label: 'Add product', routerLink: '/dress-form' },
    { label: 'Contact', routerLink: '/contact' },
  ];

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
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
  }
}