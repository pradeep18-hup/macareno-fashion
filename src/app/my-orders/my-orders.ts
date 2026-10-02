import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

interface OrderItem {
  productId: number;
  productName: string;
  productImage?: string | null;
  size: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface Order {
  id: number;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentReference?: string | null;
  fullName: string;
  phoneNumber: string;
  addressLine: string;
  city?: string;
  state?: string;
  pincode: string;
  createdAt: string;
  items: OrderItem[];
}

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './my-orders.html',
  styleUrl: './my-orders.css'
})
export class MyOrders implements OnInit {

  private http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/orders`;
  private readonly base = `${environment.baseUrl}`;

  orders = signal<Order[]>([]);
  loading = signal(true);
  loadError = signal('');
  openOrderId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.http.get<Order[]>(this.api).subscribe({
      next: (list) => {
        this.orders.set(Array.isArray(list) ? list : []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(err?.error?.error || 'Failed to load your orders.');
      }
    });
  }

  reload(): void {
    this.loadOrders();
  }

  toggleOrder(order: Order): void {
    this.openOrderId.update(id => id === order.id ? null : order.id);
  }

  isOpen(order: Order): boolean {
    return this.openOrderId() === order.id;
  }

  // ---------- Display helpers ----------
  statusLabel(status: string): string {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PENDING':   return 'Order Placed';
      case 'TRIAL':     return 'Placed (Trial)';
      case 'PAID':      return 'Confirmed';
      case 'PACKED':    return 'Packed';
      case 'SHIPPED':
      case 'DISPATCHED':return 'Shipped';
      case 'DELIVERED': return 'Delivered';
      case 'CANCELLED': return 'Cancelled';
      case 'RETURNED':  return 'Returned';
      default:          return s;
    }
  }

  statusClass(status: string): string {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PAID':
      case 'DELIVERED':  return 'badge--green';
      case 'PENDING':
      case 'TRIAL':      return 'badge--blue';
      case 'PACKED':
      case 'SHIPPED':
      case 'DISPATCHED': return 'badge--amber';
      case 'CANCELLED':
      case 'RETURNED':   return 'badge--red';
      default:           return 'badge--blue';
    }
  }

  productImage(path?: string | null): string {
    if (!path) return 'assets/placeholder-product.jpg';
    if (path.startsWith('http')) return path;
    return this.base + path;
  }

  totalItems(order: Order): number {
    return (order.items || []).reduce((s, i) => s + i.quantity, 0);
  }

  formatPrice(n: number): string {
    return '₹' + (n || 0).toLocaleString('en-IN');
  }
}