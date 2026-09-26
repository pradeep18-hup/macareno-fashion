import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomerService } from '../services/customer.service';

export interface Customer {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  message?: string | null;
}

type SortKey = 'fullName' | 'email' | 'phoneNumber' | 'id';
type SortDir = 'asc' | 'desc';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer.html',
  styleUrl: './customer.css'
})
export class Customers implements OnInit {

  private customerService = inject(CustomerService);
  private cdr = inject(ChangeDetectorRef);     // ✅ ADDED

  customers: Customer[] = [];
  loading = true;
  loadError = '';

  columns: { key: SortKey; label: string }[] = [
    { key: 'fullName',    label: 'Name' },
    { key: 'email',       label: 'Email' },
    { key: 'phoneNumber', label: 'Phone' }
  ];

  searchTerm = '';
  sortKey: SortKey = 'id';
  sortDir: SortDir = 'desc';
  pageSize = 10;
  pageSizeOptions = [5, 10, 25];
  currentPage = 1;

  visibleCustomers: Customer[] = [];
  filteredCount = 0;
  totalPages = 1;
  pages: number[] = [];
  startIndex = 0;

  ngOnInit(): void {
    this.loadCustomers();
  }

  private loadCustomers(): void {
    this.loading = true;
    this.loadError = '';
    this.cdr.detectChanges();

    this.customerService.getAll().subscribe({
      next: (list) => {
        this.customers = Array.isArray(list) ? [...list] : [];
        this.loading = false;
        this.updateView();
        this.cdr.detectChanges();              // ✅ force table to render
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.error
          || err?.message
          || 'Failed to load customers.';
        this.customers = [];
        this.updateView();
        this.cdr.detectChanges();
      }
    });
  }

  reload(): void {
    this.loadCustomers();
  }

  private updateView(): void {
    const term = this.searchTerm.trim().toLowerCase();

    const rows = term
      ? this.customers.filter(c =>
          c.fullName?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.phoneNumber?.includes(term))
      : [...this.customers];

    const dir = this.sortDir === 'asc' ? 1 : -1;
    rows.sort((a, b) => {
      const x = (a as any)[this.sortKey];
      const y = (b as any)[this.sortKey];
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
    this.cdr.detectChanges();
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
    this.cdr.detectChanges();
  }

  onPageSizeChange(value: string): void {
    this.pageSize = Number(value);
    this.currentPage = 1;
    this.updateView();
    this.cdr.detectChanges();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updateView();
    this.cdr.detectChanges();
  }

  get rangeEnd(): number {
    return this.startIndex + this.visibleCustomers.length;
  }
}