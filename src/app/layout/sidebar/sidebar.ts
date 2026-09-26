import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

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
export class Sidebar {
  isCollapsed = false;

  toggle() {
    this.isCollapsed = !this.isCollapsed;
  }

  navItems: SidebarItem[] = [
    { label: 'Admin',        icon: 'bi bi-person-badge',  route: '/admin' },
    { label: 'Add Product',  icon: 'bi bi-plus-circle',   route: '/admin/dress-form' },
    { label: 'Product Type', icon: 'bi bi-tags',          route: '/admin/dress-type' },
    { label: 'Sizes',        icon: 'bi bi-grid-3x3-gap',  route: '/admin/size' },
    { label: 'Customer',     icon: 'bi bi-people',        route: '/admin/customer-list' },
    { label: 'Orders',       icon: 'bi bi-bag-check',     route: '/admin/orders' },
    { label: 'Courier',      icon: 'bi bi-truck',         route: '/admin/courier' },
    { label: 'Order Amount', icon: 'bi bi-credit-card',   route: '/admin/deliver-charge-settings' },
  ];
}