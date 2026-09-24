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
    { label: 'Add Dress',  icon: 'bi bi-plus-circle',  route: 'dress-form' },
    { label: 'Dress Type', icon: 'bi bi-tags',         route: 'dress-types' },
    { label: 'Admin',      icon: 'bi bi-person-badge', route: 'admin' },
    { label: 'Customer',   icon: 'bi bi-people',       route: 'customer-list' },
    { label: 'Orders',     icon: 'bi bi-bag-check',    route: 'orders' },
    { label: 'Add Dress',  icon: 'bi bi-plus-circle',   route: 'dress-form' },
    { label: 'Dress Type', icon: 'bi bi-tags',          route: 'dress-types' },
    { label: 'Admin',      icon: 'bi bi-person-badge',  route: 'admin' },
    { label: 'Customer',   icon: 'bi bi-people',        route: 'customer-list' },
    { label: 'Orders',     icon: 'bi bi-bag-check',     route: 'orders' },
      { label: 'Courier',     icon: 'bi bi-bag-check',     route: 'courier' },
  { label: 'Order Amount set',     icon: 'bi bi-bag-check',     route: 'deliver-charge-settings' },
  ];
}