import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

export type OrderStatus = 'new' | 'packed' | 'dispatched' | 'delivered' | 'cancelled' | 'returned';
export type OrderTab = 'recent' | OrderStatus;
type ReasonType = 'cancel' | 'rto' | 'return';

export interface OrderItem {
  name: string;
  size: string;
  qty: number;
  price: number;
}

export interface TimelineEvent {
  status: OrderStatus;
  at: Date;
  note?: string;
}

export interface Order {
  id: string;
  customer: string;
  phone: string;
  city: string;
  address: string;
  paymentMode: 'Prepaid' | 'COD';
  items: OrderItem[];
  amount: number;
  status: OrderStatus;
  orderedAt: Date;
  trackingId: string | null;
  courier?: string | null;
  timeline: TimelineEvent[];
}

const SLA_HOURS = 48;
const RETURN_WINDOW_DAYS = 7;
const HOUR = 3600000;

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class Orders implements OnInit {

  private http = inject(HttpClient);
  private readonly api = 'http://localhost:8080/api/orders';

  // ✅ Real data (loaded from API) — now a signal so change detection fires reliably
  orders = signal<Order[]>([]);
  loading = signal(true);
  loadError = signal('');

  tabs: { key: OrderTab; label: string }[] = [
    { key: 'recent',     label: 'Recent' },
    { key: 'new',        label: 'New' },
    { key: 'packed',     label: 'Packed' },
    { key: 'dispatched', label: 'Dispatched' },
    { key: 'delivered',  label: 'Delivered' },
    { key: 'cancelled',  label: 'Cancelled' },
    { key: 'returned',   label: 'Returned' }
  ];

  reasons: Record<ReasonType, string[]> = {
    cancel: [
      'Out of stock',
      'Customer requested cancellation',
      'Unable to pack in time',
      'Wrong price listed',
      'Other'
    ],
    rto: [
      'Customer not available',
      'Customer refused delivery',
      'Address incorrect',
      'Other'
    ],
    return: [
      'Size or fit issue',
      'Damaged product',
      'Wrong item received',
      'Customer changed mind',
      'Other'
    ]
  };

  readonly returnWindowDays = RETURN_WINDOW_DAYS;

  readonly couriers = [
    'Delhivery', 'DTDC', 'Xpressbees', 'Blue Dart', 'India Post',
    'Professional Couriers', 'ST Courier', 'Local delivery', 'Other'
  ];

  private readonly trackingUrls: Record<string, string> = {
    'Delhivery':  'https://www.delhivery.com/track-v2/package/{id}',
    'DTDC':       'https://www.dtdc.in/tracking.html',
    'Xpressbees': 'https://www.xpressbees.com/shipment/tracking',
    'Blue Dart':  'https://www.bluedart.com/tracking'
  };

  activeTab: OrderTab = 'recent';
  searchTerm = '';

  detailOrder: Order | null = null;
  reasonOrder: Order | null = null;
  reasonType: ReasonType = 'cancel';
  selectedReason = '';

  dispatchOrder: Order | null = null;
  courierName = '';
  trackingInput = '';
  dispatchError = '';

  toastMessage = '';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ============================================================
  // Lifecycle
  // ============================================================
  ngOnInit(): void {
    this.loadOrders();
  }

  // ============================================================
  // Load orders from backend
  // ============================================================
  loadOrders(): void {
    this.loading.set(true);
    this.loadError.set('');

    this.http.get<any[]>(this.api).pipe(
      switchMap((list) => {
        if (!list || list.length === 0) return of<Order[]>([]);
        const enriched$ = list.map(order => this.enrichOrder(order));
        return forkJoin(enriched$);
      })
    ).subscribe({
      next: (orders) => {
        // Set as new array reference → signal emits → template re-renders
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.loadError.set(err?.error?.error || 'Failed to load orders.');
      }
    });
  }

  reload(): void {
    this.loadOrders();
  }

  // ============================================================
  // Map API order → UI Order
  // ============================================================
  private enrichOrder(apiOrder: any): Observable<Order> {
    const items: any[] = apiOrder.items || [];

    const uiItems: OrderItem[] = items.map(i => ({
      name: i.productName || `Product #${i.productId}`,
      size: i.size || 'One Size',
      qty: i.quantity || 1,
      price: i.unitPrice || 0
    }));

    const uiOrder: Order = {
      id: `ORD-${apiOrder.id}`,
      customer: apiOrder.fullName || 'Customer',
      phone: apiOrder.phoneNumber || '',
      city: apiOrder.city || '',
      address: [
        apiOrder.addressLine,
        apiOrder.city,
        apiOrder.state,
        apiOrder.pincode
      ].filter(Boolean).join(', '),
      paymentMode: (apiOrder.paymentMethod === 'COD' ? 'COD' : 'Prepaid'),
      items: uiItems,
      amount: apiOrder.totalAmount || 0,
      status: this.mapStatus(apiOrder.status),
      orderedAt: new Date(apiOrder.createdAt || Date.now()),
      trackingId: apiOrder.trackingId || null,
      courier: apiOrder.courier || null,
      timeline: this.buildTimeline(apiOrder)
    };

    return of(uiOrder);
  }

  private mapStatus(backendStatus: string): OrderStatus {
    const s = (backendStatus || '').toUpperCase();
    switch (s) {
      case 'PENDING':
      case 'TRIAL':
      case 'PAID':
        return 'new';
      case 'PACKED':
        return 'packed';
      case 'SHIPPED':
      case 'DISPATCHED':
        return 'dispatched';
      case 'DELIVERED':
        return 'delivered';
      case 'CANCELLED':
        return 'cancelled';
      case 'RETURNED':
        return 'returned';
      default:
        return 'new';
    }
  }

  private buildTimeline(apiOrder: any): TimelineEvent[] {
    const created = new Date(apiOrder.createdAt || Date.now());
    const events: TimelineEvent[] = [
      { status: 'new', at: created, note: `Order #${apiOrder.id} placed` }
    ];
    const current = this.mapStatus(apiOrder.status);
    if (current !== 'new') {
      events.push({ status: current, at: new Date(), note: `Status: ${apiOrder.status}` });
    }
    return events;
  }

  // ============================================================
  // Signal helper — force emit after in-place mutation
  // ============================================================
  private refreshOrders(): void {
    this.orders.set([...this.orders()]);
  }

  // ============================================================
  // Derived data
  // ============================================================
  count(tab: OrderTab): number {
    const list = this.orders();
    return tab === 'recent'
      ? list.length
      : list.filter(o => o.status === tab).length;
  }

  get overdueCount(): number {
    return this.orders().filter(o => this.isOverdue(o)).length;
  }

  get visibleOrders(): Order[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.orders()
      .filter(o => this.activeTab === 'recent' || o.status === this.activeTab)
      .filter(o =>
        !term ||
        o.id.toLowerCase().includes(term) ||
        o.customer.toLowerCase().includes(term) ||
        o.phone.includes(term) ||
        o.city.toLowerCase().includes(term) ||
        (o.trackingId ?? '').toLowerCase().includes(term))
      .sort((a, b) => this.lastUpdate(b).getTime() - this.lastUpdate(a).getTime());
  }

  lastUpdate(order: Order): Date {
    return order.timeline[order.timeline.length - 1]?.at ?? order.orderedAt;
  }

  private eventTime(order: Order, status: OrderStatus): Date | null {
    return order.timeline.find(e => e.status === status)?.at ?? null;
  }

  lastNote(order: Order): string | undefined {
    return order.timeline[order.timeline.length - 1]?.note;
  }

  statusLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      new: 'New',
      packed: 'Packed',
      dispatched: 'Dispatched',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      returned: 'Returned'
    };
    return labels[status];
  }

  timelineLabel(status: OrderStatus): string {
    const labels: Record<OrderStatus, string> = {
      new: 'Order placed',
      packed: 'Packed',
      dispatched: 'Dispatched from seller',
      delivered: 'Delivered to customer',
      cancelled: 'Cancelled',
      returned: 'Returned'
    };
    return labels[status];
  }

  // ============================================================
  // SLA (dispatch)
  // ============================================================
  private dispatchDeadline(order: Order): Date {
    return new Date(order.orderedAt.getTime() + SLA_HOURS * HOUR);
  }

  private awaitingDispatch(order: Order): boolean {
    return order.status === 'new' || order.status === 'packed';
  }

  isOverdue(order: Order): boolean {
    return this.awaitingDispatch(order) && Date.now() > this.dispatchDeadline(order).getTime();
  }

  slaText(order: Order): string {
    if (!this.awaitingDispatch(order)) return '';
    const diffH = Math.ceil(Math.abs(this.dispatchDeadline(order).getTime() - Date.now()) / HOUR);
    return this.isOverdue(order)
      ? `Overdue by ${diffH}h`
      : `Dispatch within ${diffH}h`;
  }

  // ============================================================
  // Return window
  // ============================================================
  canReturn(order: Order): boolean {
    if (order.status !== 'delivered') return false;
    const deliveredAt = this.eventTime(order, 'delivered');
    if (!deliveredAt) return false;
    return Date.now() - deliveredAt.getTime() <= RETURN_WINDOW_DAYS * 24 * HOUR;
  }

  // ============================================================
  // Status actions
  // ============================================================
  private addEvent(order: Order, status: OrderStatus, note?: string): void {
    order.status = status;
    order.timeline = [...order.timeline, { status, at: new Date(), note }];
    this.refreshOrders(); // ✅ force signal emit so template updates
  }

  pack(order: Order): void {
    if (order.status !== 'new') return;
    this.updateBackendStatus(order, 'PACKED');
  }

  markDelivered(order: Order): void {
    if (order.status !== 'dispatched') return;
    this.updateBackendStatus(order, 'DELIVERED');
  }

  private updateBackendStatus(order: Order, backendStatus: string): void {
    const id = Number(order.id.replace('ORD-', ''));
    this.http.put<any>(`${this.api}/${id}/status`, { status: backendStatus }).subscribe({
      next: () => {
        this.showToast(`${order.id} updated`);
        this.reload();
      },
      error: (err) => {
        this.showToast(err?.error?.error || 'Failed to update status');
      }
    });
  }

  // ============================================================
  // Dispatch popup
  // ============================================================
  openDispatch(order: Order): void {
    if (order.status !== 'packed') return;
    this.dispatchOrder = order;
    this.courierName = '';
    this.trackingInput = '';
    this.dispatchError = '';
  }

  closeDispatch(): void {
    this.dispatchOrder = null;
    this.dispatchError = '';
  }

  confirmDispatch(): void {
    const order = this.dispatchOrder;
    if (!order) return;

    const id = this.trackingInput.trim().toUpperCase();

    if (!this.courierName) {
      this.dispatchError = 'Please select a courier';
      return;
    }
    if (!/^[A-Z0-9-]{6,30}$/.test(id)) {
      this.dispatchError = 'Enter a valid tracking ID (6 to 30 letters or numbers)';
      return;
    }
    if (this.orders().some(o => o.id !== order.id && o.trackingId === id)) {
      this.dispatchError = 'This tracking ID is already used for another order';
      return;
    }

    order.courier = this.courierName;
    order.trackingId = id;
    this.addEvent(order, 'dispatched', `Courier: ${this.courierName}, Tracking ID: ${id}`);
    this.showToast(`${order.id} dispatched via ${this.courierName}`);
    this.closeDispatch();
  }

  // ============================================================
  // Tracking
  // ============================================================
  trackingUrl(order: Order): string | null {
    if (!order.trackingId) return null;
    const template = order.courier ? this.trackingUrls[order.courier] : undefined;
    if (template) {
      return template.replace('{id}', encodeURIComponent(order.trackingId));
    }
    const query = `${order.courier ?? ''} tracking ${order.trackingId}`.trim();
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }

  trackingMessage(order: Order): string {
    const firstName = order.customer.split(' ')[0];
    return (
      `Hi ${firstName}, your order ${order.id} from Macarena Fashions has been shipped ` +
      `via ${order.courier}. Tracking ID: ${order.trackingId}. ` +
      `Track here: ${this.trackingUrl(order)}`
    );
  }

  openTracking(order: Order): void {
    const url = this.trackingUrl(order);
    if (url) window.open(url, '_blank', 'noopener');
  }

  shareWhatsApp(order: Order): void {
    const phone = order.phone.replace(/\D/g, '').slice(-10);
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(this.trackingMessage(order))}`;
    window.open(url, '_blank', 'noopener');
  }

  async copyTrackingMessage(order: Order): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.trackingMessage(order));
      this.showToast('Tracking message copied');
    } catch {
      this.showToast('Could not copy. Please copy it manually');
    }
  }

  // ============================================================
  // CSV export
  // ============================================================
  get exportableCount(): number {
    return this.orders().filter(o => o.status === 'new' || o.status === 'packed').length;
  }

  exportCsv(): void {
    const rows = this.orders().filter(o => o.status === 'new' || o.status === 'packed');
    if (!rows.length) {
      this.showToast('No orders to export');
      return;
    }

    const header = [
      'Order ID', 'Customer Name', 'Phone', 'Address', 'City', 'Pincode',
      'Payment Mode', 'COD Amount', 'Order Value', 'Total Qty', 'Products', 'Weight (kg)'
    ];

    const cell = (value: string | number): string => {
      const text = String(value).replace(/"/g, '""');
      return `"${text}"`;
    };

    const lines = rows.map(o => {
      const pincode = o.address.match(/\b\d{6}\b/)?.[0] ?? '';
      const qty = o.items.reduce((sum, i) => sum + i.qty, 0);
      const products = o.items.map(i => `${i.name} (${i.size}) x${i.qty}`).join('; ');
      return [
        o.id, o.customer, o.phone, o.address, o.city, pincode,
        o.paymentMode, o.paymentMode === 'COD' ? o.amount : 0, o.amount,
        qty, products, ''
      ].map(cell).join(',');
    });

    const csv = '\uFEFF' + [header.map(cell).join(','), ...lines].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `orders-to-ship-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    this.showToast(`${rows.length} orders exported`);
  }

  // ============================================================
  // Reason modal
  // ============================================================
  openReason(order: Order, type: ReasonType): void {
    this.reasonOrder = order;
    this.reasonType = type;
    this.selectedReason = '';
  }

  closeReason(): void {
    this.reasonOrder = null;
    this.selectedReason = '';
  }

  get reasonTitle(): string {
    switch (this.reasonType) {
      case 'cancel': return 'Cancel order';
      case 'rto':    return 'Delivery failed';
      case 'return': return 'Return order';
    }
  }

  get reasonHelp(): string {
    switch (this.reasonType) {
      case 'cancel': return 'The customer will be refunded if the payment was already made.';
      case 'rto':    return 'The order will be sent back to the seller.';
      case 'return': return 'The product will be picked up from the customer and refunded.';
    }
  }

  confirmReason(): void {
    const order = this.reasonOrder;
    if (!order || !this.selectedReason) return;

    if (this.reasonType === 'cancel' && this.awaitingDispatch(order)) {
      this.addEvent(order, 'cancelled', this.selectedReason);
      this.showToast(`${order.id} cancelled`);
    } else if (this.reasonType === 'rto' && order.status === 'dispatched') {
      this.addEvent(order, 'returned', `Delivery failed: ${this.selectedReason}`);
      this.showToast(`${order.id} returned to seller`);
    } else if (this.reasonType === 'return' && this.canReturn(order)) {
      this.addEvent(order, 'returned', `Customer return: ${this.selectedReason}`);
      this.showToast(`${order.id} return initiated`);
    }
    this.closeReason();
  }

  // ============================================================
  // UI helpers
  // ============================================================
  setTab(tab: OrderTab): void {
    this.activeTab = tab;
  }

  onSearch(value: string): void {
    this.searchTerm = value;
  }

  openDetails(order: Order): void {
    this.detailOrder = order;
  }

  closeDetails(): void {
    this.detailOrder = null;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeReason();
    this.closeDetails();
    this.closeDispatch();
  }

  private showToast(message: string): void {
    this.toastMessage = message;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastMessage = ''), 3500);
  }

  trackById(_: number, order: Order): string {
    return order.id;
  }
}