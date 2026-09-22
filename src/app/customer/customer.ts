import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  joinedAt: Date;
}

type SortKey = keyof Customer;
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer.html',
  styleUrl: './customer.css'
})
export class Customers {
  // Sample data. Replace with real data later.
  customers: Customer[] = [
    { id: 1,  name: 'Priya Sharma',   email: 'priya@example.com',   phone: '9876543210', city: 'Coimbatore', joinedAt: new Date('2026-01-12') },
    { id: 2,  name: 'Arun Kumar',     email: 'arun@example.com',    phone: '9876501234', city: 'Chennai',    joinedAt: new Date('2026-02-03') },
    { id: 3,  name: 'Divya Lakshmi',  email: 'divya@example.com',   phone: '9345612780', city: 'Madurai',    joinedAt: new Date('2026-02-18') },
    { id: 4,  name: 'Karthik Raj',    email: 'karthik@example.com', phone: '9445098765', city: 'Salem',      joinedAt: new Date('2026-03-07') },
    { id: 5,  name: 'Meena Devi',     email: 'meena@example.com',   phone: '9123456780', city: 'Trichy',     joinedAt: new Date('2026-03-25') },
    { id: 6,  name: 'Suresh Babu',    email: 'suresh@example.com',  phone: '9988776655', city: 'Erode',      joinedAt: new Date('2026-04-09') },
    { id: 7,  name: 'Anitha Selvam',  email: 'anitha@example.com',  phone: '9871234560', city: 'Tiruppur',   joinedAt: new Date('2026-04-30') },
    { id: 8,  name: 'Vignesh M',      email: 'vignesh@example.com', phone: '9600123456', city: 'Coimbatore', joinedAt: new Date('2026-05-14') },
    { id: 9,  name: 'Lavanya R',      email: 'lavanya@example.com', phone: '9791234567', city: 'Chennai',    joinedAt: new Date('2026-06-02') },
    { id: 10, name: 'Ramesh Pandian', email: 'ramesh@example.com',  phone: '9840012345', city: 'Madurai',    joinedAt: new Date('2026-06-21') },
    { id: 11, name: 'Nisha Fathima',  email: 'nisha@example.com',   phone: '9003456712', city: 'Vellore',    joinedAt: new Date('2026-07-15') },
    { id: 12, name: 'Gokul Krishnan', email: 'gokul@example.com',   phone: '9500987654', city: 'Salem',      joinedAt: new Date('2026-08-05') }
  ];

  columns: { key: SortKey; label: string }[] = [
    { key: 'name',     label: 'Name' },
    { key: 'email',    label: 'Email' },
    { key: 'phone',    label: 'Phone' },
    { key: 'city',     label: 'City' },
    { key: 'joinedAt', label: 'Joined' }
  ];

  // Table state
  searchTerm = '';
  sortKey: SortKey = 'joinedAt';
  sortDir: SortDir = 'desc';
  pageSize = 10;
  pageSizeOptions = [5, 10, 25];
  currentPage = 1;

  // Derived data used by the template
  visibleCustomers: Customer[] = [];
  filteredCount = 0;
  totalPages = 1;
  pages: number[] = [];
  startIndex = 0;

  constructor() {
    this.updateView();
  }

  // Recalculates filtered, sorted and paged rows. Call after any change.
  private updateView(): void {
    const term = this.searchTerm.trim().toLowerCase();

    const rows = term
      ? this.customers.filter(c =>
          c.name.toLowerCase().includes(term) ||
          c.email.toLowerCase().includes(term) ||
          c.phone.includes(term) ||
          c.city.toLowerCase().includes(term))
      : [...this.customers];

    const dir = this.sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const x = a[this.sortKey];
      const y = b[this.sortKey];
      if (x instanceof Date && y instanceof Date) {
        return (x.getTime() - y.getTime()) * dir;
      }
      return String(x).localeCompare(String(y), undefined, { numeric: true }) * dir;
    });

    this.filteredCount = rows.length;
    this.totalPages = Math.max(1, Math.ceil(rows.length / this.pageSize));
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    this.startIndex = (this.currentPage - 1) * this.pageSize;
    this.visibleCustomers = rows.slice(this.startIndex, this.startIndex + this.pageSize);
    this.pages = Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  onSearch(value: string): void {
    this.searchTerm = value;
    this.currentPage = 1;
    this.updateView();
  }

  sortBy(key: SortKey): void {
    if (this.sortKey === key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDir = 'asc';
    }
    this.currentPage = 1;
    this.updateView();
  }

  sortIcon(key: SortKey): string {
    if (this.sortKey !== key) return '⇅';
    return this.sortDir === 'asc' ? '▲' : '▼';
  }

  onPageSizeChange(value: string): void {
    this.pageSize = Number(value);
    this.currentPage = 1;
    this.updateView();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updateView();
  }

  get rangeEnd(): number {
    return this.startIndex + this.visibleCustomers.length;
  }
}