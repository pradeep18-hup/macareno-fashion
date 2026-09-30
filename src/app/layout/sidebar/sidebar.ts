import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {

  private authService = inject(AuthService);
  private router = inject(Router);

  isCollapsed = false;
  showLogoutConfirm = false;

  // Live admin info from localStorage (populated at login)
  adminName = '';
  adminEmail = '';
  adminInitial = '';

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.adminName = user.name || 'Admin';
      this.adminEmail = user.email || '';
      this.adminInitial = this.adminName.charAt(0).toUpperCase();
    }
  }

  toggle(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  // ---------- Logout popup ----------
  openLogoutConfirm(): void {
    this.showLogoutConfirm = true;
  }

  cancelLogout(): void {
    this.showLogoutConfirm = false;
  }

  confirmLogout(): void {
    this.showLogoutConfirm = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.showLogoutConfirm = false;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  navItems: SidebarItem[] = [
    { label: 'Admin',        icon: 'bi bi-person-badge',  route: '/admin' },
    { label: 'Add Product',  icon: 'bi bi-plus-circle',   route: '/admin/dress-form' },
    { label: 'Product Type', icon: 'bi bi-tags',          route: '/admin/dress-type' },
    { label: 'Product List', icon: 'bi bi-tags',          route: '/admin/product-list' },
    { label: 'Sizes',        icon: 'bi bi-grid-3x3-gap',  route: '/admin/size' },
    { label: 'Customer',     icon: 'bi bi-people',        route: '/admin/customer-list' },
    { label: 'Orders',       icon: 'bi bi-bag-check',     route: '/admin/orders' },
    { label: 'Courier',      icon: 'bi bi-truck',         route: '/admin/courier' },
    { label: 'Order Amount', icon: 'bi bi-credit-card',   route: '/admin/deliver-charge-settings' },
  ];
}