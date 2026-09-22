import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

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

const SLA_HOURS = 48;          // Seller must dispatch within this time
const RETURN_WINDOW_DAYS = 7;  // Customer can return within this period after delivery
const HOUR = 3600000;

// Sample data helpers: a date N hours before now
const hoursAgo = (h: number): Date => new Date(Date.now() - h * HOUR);
const ev = (status: OrderStatus, h: number, note?: string): TimelineEvent => ({ status, at: hoursAgo(h), note });

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders.html',
  styleUrl: './orders.css'
})
export class Orders {
  // Sample data. Replace with real data later.
  orders: Order[] = [
    {
      id: 'ORD-1010', customer: 'Gokul Krishnan', phone: '9500987654', city: 'Salem',
      address: '12, Gandhi Road, Fairlands, Salem - 636016', paymentMode: 'Prepaid',
      items: [{ name: 'Cotton Kurti', size: 'M', qty: 2, price: 1249.5 }], amount: 2499,
      status: 'new', orderedAt: hoursAgo(2), trackingId: null, courier: null, timeline: [ev('new', 2)]
    },
    {
      id: 'ORD-1009', customer: 'Nisha Fathima', phone: '9003456712', city: 'Vellore',
      address: '45, Anna Salai, Katpadi, Vellore - 632007', paymentMode: 'COD',
      items: [{ name: 'Denim Jacket', size: 'L', qty: 1, price: 1299 }], amount: 1299,
      status: 'new', orderedAt: hoursAgo(20), trackingId: null, courier: null, timeline: [ev('new', 20)]
    },
    {
      id: 'ORD-1008', customer: 'Lavanya R', phone: '9791234567', city: 'Chennai',
      address: '7, Lake View Street, T Nagar, Chennai - 600017', paymentMode: 'Prepaid',
      items: [
        { name: 'Silk Saree', size: 'Free', qty: 1, price: 3200 },
        { name: 'Blouse Piece', size: 'Free', qty: 1, price: 950 }
      ], amount: 4150,
      status: 'new', orderedAt: hoursAgo(52), trackingId: null, courier: null, timeline: [ev('new', 52)]
    },
    {
      id: 'ORD-1007', customer: 'Vignesh M', phone: '9600123456', city: 'Coimbatore',
      address: '88, Race Course Road, Coimbatore - 641018', paymentMode: 'Prepaid',
      items: [{ name: 'Slim Fit Shirt', size: '40', qty: 1, price: 899 }], amount: 899,
      status: 'packed', orderedAt: hoursAgo(30), trackingId: null, courier: null,
      timeline: [ev('new', 30), ev('packed', 12)]
    },
    {
      id: 'ORD-1006', customer: 'Anitha Selvam', phone: '9871234560', city: 'Tiruppur',
      address: '3, Kumaran Road, Tiruppur - 641601', paymentMode: 'COD',
      items: [{ name: 'Cotton Frock', size: 'S', qty: 2, price: 1600 }], amount: 3200,
      status: 'dispatched', orderedAt: hoursAgo(70), trackingId: 'TRK482915067', courier: 'Delhivery',
      timeline: [ev('new', 70), ev('packed', 60), ev('dispatched', 46, 'Courier: Delhivery, Tracking ID: TRK482915067')]
    },
    {
      id: 'ORD-1005', customer: 'Suresh Babu', phone: '9988776655', city: 'Erode',
      address: '21, Perundurai Road, Erode - 638011', paymentMode: 'Prepaid',
      items: [
        { name: 'Jeans', size: '32', qty: 2, price: 1890 },
        { name: 'T-Shirt', size: 'L', qty: 2, price: 555 }
      ], amount: 4890,
      status: 'delivered', orderedAt: hoursAgo(120), trackingId: 'TRK193746205', courier: 'DTDC',
      timeline: [ev('new', 120), ev('packed', 110), ev('dispatched', 100, 'Courier: DTDC, Tracking ID: TRK193746205'), ev('delivered', 48)]
    },
    {
      id: 'ORD-1004', customer: 'Meena Devi', phone: '9123456780', city: 'Trichy',
      address: '9, Srirangam Main Road, Trichy - 620006', paymentMode: 'Prepaid',
      items: [{ name: 'Lehenga', size: 'M', qty: 1, price: 6750 }], amount: 6750,
      status: 'delivered', orderedAt: hoursAgo(300), trackingId: 'TRK550281934', courier: 'Xpressbees',
      timeline: [ev('new', 300), ev('packed', 290), ev('dispatched', 280, 'Courier: Xpressbees, Tracking ID: TRK550281934'), ev('delivered', 240)]
    },
    {
      id: 'ORD-1003', customer: 'Priya Sharma', phone: '9876543210', city: 'Coimbatore',
      address: '15, Avinashi Road, Coimbatore - 641037', paymentMode: 'Prepaid',
      items: [{ name: 'Gown', size: 'M', qty: 1, price: 2100 }], amount: 2100,
      status: 'cancelled', orderedAt: hoursAgo(90), trackingId: null, courier: null,
      timeline: [ev('new', 90), ev('cancelled', 80, 'Customer requested cancellation')]
    },
    {
      id: 'ORD-1002', customer: 'Karthik Raj', phone: '9445098765', city: 'Salem',
      address: '60, Omalur Main Road, Salem - 636009', paymentMode: 'COD',
      items: [{ name: 'Trousers', size: '34', qty: 1, price: 1450 }], amount: 1450,
      status: 'returned', orderedAt: hoursAgo(200), trackingId: 'TRK730164882', courier: 'Delhivery',
      timeline: [ev('new', 200), ev('packed', 190), ev('dispatched', 180, 'Courier: Delhivery, Tracking ID: TRK730164882'), ev('returned', 130, 'Delivery failed: Customer refused delivery')]
    }
  ];

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

  // Tracking page templates. {id} is replaced with the tracking ID.
  // Verify these URLs, couriers change their tracking pages sometimes.
  private readonly trackingUrls: Record<string, string> = {
    'Delhivery':  'https://www.delhivery.com/track-v2/package/{id}',
    'DTDC':       'https://www.dtdc.in/tracking.html',
    'Xpressbees': 'https://www.xpressbees.com/shipment/tracking',
    'Blue Dart':  'https://www.bluedart.com/tracking'
  };

  activeTab: OrderTab = 'recent';
  searchTerm = '';

  // Modal state
  detailOrder: Order | null = null;
  reasonOrder: Order | null = null;
  reasonType: ReasonType = 'cancel';
  selectedReason = '';

  // Dispatch popup state
  dispatchOrder: Order | null = null;
  courierName = '';
  trackingInput = '';
  dispatchError = '';

  toastMessage = '';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ---------- Derived data ----------

  count(tab: OrderTab): number {
    return tab === 'recent'
      ? this.orders.length
      : this.orders.filter(o => o.status === tab).length;
  }

  get overdueCount(): number {
    return this.orders.filter(o => this.isOverdue(o)).length;
  }

  // Orders for the active tab, filtered by search, latest activity first
  get visibleOrders(): Order[] {
    const term = this.searchTerm.trim().toLowerCase();

    return this.orders
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
    return order.timeline[order.timeline.length - 1].at;
  }

  private eventTime(order: Order, status: OrderStatus): Date | null {
    return order.timeline.find(e => e.status === status)?.at ?? null;
  }

  lastNote(order: Order): string | undefined {
    return order.timeline[order.timeline.length - 1].note;
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

  // ---------- Dispatch SLA ----------

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

  // ---------- Return window ----------

  canReturn(order: Order): boolean {
    if (order.status !== 'delivered') return false;
    const deliveredAt = this.eventTime(order, 'delivered');
    if (!deliveredAt) return false;
    return Date.now() - deliveredAt.getTime() <= RETURN_WINDOW_DAYS * 24 * HOUR;
  }

  // ---------- Status actions ----------

  private addEvent(order: Order, status: OrderStatus, note?: string): void {
    order.status = status;
    order.timeline = [...order.timeline, { status, at: new Date(), note }];
  }

  // New -> Packed
  pack(order: Order): void {
    if (order.status !== 'new') return;
    this.addEvent(order, 'packed');
    this.showToast(`${order.id} marked as packed`);
  }

  // Dispatched -> Delivered
  markDelivered(order: Order): void {
    if (order.status !== 'dispatched') return;
    this.addEvent(order, 'delivered');
    this.showToast(`${order.id} delivered to customer`);
  }

  // ---------- Dispatch with courier details (Packed -> Dispatched) ----------

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
    if (this.orders.some(o => o.id !== order.id && o.trackingId === id)) {
      this.dispatchError = 'This tracking ID is already used for another order';
      return;
    }

    order.courier = this.courierName;
    order.trackingId = id;
    this.addEvent(order, 'dispatched', `Courier: ${this.courierName}, Tracking ID: ${id}`);
    this.showToast(`${order.id} dispatched via ${this.courierName}`);
    this.closeDispatch();
  }

  // ---------- Tracking link and sharing ----------

  trackingUrl(order: Order): string | null {
    if (!order.trackingId) return null;
    const template = order.courier ? this.trackingUrls[order.courier] : undefined;
    if (template) {
      return template.replace('{id}', encodeURIComponent(order.trackingId));
    }
    // Fallback: search for the tracking ID
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

  // ---------- CSV export for courier bulk upload ----------

  // Orders that still need to be shipped
  get exportableCount(): number {
    return this.orders.filter(o => o.status === 'new' || o.status === 'packed').length;
  }

  exportCsv(): void {
    const rows = this.orders.filter(o => o.status === 'new' || o.status === 'packed');
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

    // BOM keeps Excel from breaking special characters
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

  // ---------- Reason modal (cancel, delivery failed, return) ----------

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

  // ---------- UI helpers ----------

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