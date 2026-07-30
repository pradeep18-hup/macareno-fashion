import { Component, HostListener, signal } from '@angular/core';

interface NavLink {
  label: string;
  href: string;
}

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css',
})
export class NavbarComponent {
  readonly isMenuOpen = signal(false);
  readonly isScrolled = signal(false);

  readonly links: NavLink[] = [
    { label: 'New In', href: '#new-in' },
    { label: 'Women', href: '#women' },
    { label: 'Men', href: '#men' },
    { label: 'Collections', href: 'contact' },
    { label: 'Sale', href: '#sale' },
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