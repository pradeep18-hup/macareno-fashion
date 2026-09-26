import { Injectable, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { BehaviorSubject, Observable, tap } from 'rxjs';

// ---------- Models ----------
export interface DressType {
  id: number;
  name: string;
}

export interface Toast {
  type: 'success' | 'error';
  message: string;
}

// ---------- Service ----------
@Injectable({ providedIn: 'root' })
export class DressTypeService {

  private readonly api = 'http://localhost:8080/api/dress-types';
  private http = inject(HttpClient);

  private typesSubject = new BehaviorSubject<DressType[]>([]);
  dressTypes$ = this.typesSubject.asObservable();

  loadAll(): void {
    this.http.get<DressType[]>(this.api).subscribe({
      next: (list) => this.typesSubject.next(list),
      error: () => console.error('Load failed')
    });
  }

  add(name: string): Observable<DressType> {
    return this.http.post<DressType>(this.api, { name }).pipe(tap(() => this.loadAll()));
  }

  update(id: number, name: string): Observable<DressType> {
    return this.http.put<DressType>(`${this.api}/${id}`, { name }).pipe(tap(() => this.loadAll()));
  }

  remove(id: number): Observable<{ message: string; id: number }> {
    return this.http
      .delete<{ message: string; id: number }>(`${this.api}/${id}`)
      .pipe(tap(() => this.loadAll()));
  }
}

// ---------- Component ----------
@Component({
  selector: 'app-dress-type',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dress-type.html',
  styleUrls: ['./dress-type.css']
})
export class DressType implements OnInit {

  private dressTypeService = inject(DressTypeService);

  dressTypes$ = this.dressTypeService.dressTypes$;

  toasts: Toast[] = [];
  editingId: number | null = null;
  pendingDelete: DressType | null = null;   // for custom delete confirm

  nameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(30)]
  });

  ngOnInit(): void {
    this.dressTypeService.loadAll();
  }

  // ---------- Add / Update ----------
  add(): void {
    const value = this.nameControl.value.trim();
    if (!value) {
      this.notify('error', 'Please enter a dress type name.');
      return;
    }

    if (this.editingId !== null) {
      this.dressTypeService.update(this.editingId, value).subscribe({
        next: () => {
          this.nameControl.reset('');
          this.editingId = null;
          this.notify('success', 'Dress type updated successfully.');
        },
        error: (err) => this.notify('error', err.error?.error || 'Failed to update.')
      });
      return;
    }

    this.dressTypeService.add(value).subscribe({
      next: () => {
        this.nameControl.reset('');
        this.notify('success', 'Dress type added successfully.');
      },
      error: (err) => this.notify('error', err.error?.error || 'That dress type already exists.')
    });
  }

  // ---------- Edit ----------
  edit(type: DressType): void {
    this.editingId = type.id;
    this.nameControl.setValue(type.name);
  }

  cancelEdit(): void {
    this.editingId = null;
    this.nameControl.reset('');
  }

  // ---------- Delete (custom confirm) ----------
  askDelete(type: DressType, event: Event): void {
    event.stopPropagation();
    this.pendingDelete = type;
  }

  confirmDelete(): void {
    if (!this.pendingDelete) return;
    const target = this.pendingDelete;
    this.pendingDelete = null;

    this.dressTypeService.remove(target.id).subscribe({
      next: (res) => this.notify('success', res.message || 'Dress type deleted successfully.'),
      error: (err) => this.notify('error', err.error?.error || 'Failed to delete.')
    });
  }

  cancelDelete(): void {
    this.pendingDelete = null;
  }

  // ---------- Toast helpers ----------
  private notify(type: 'success' | 'error', message: string): void {
    const toast: Toast = { type, message };
    this.toasts.push(toast);

    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t !== toast);
    }, 3000);
  }

  dismiss(toast: Toast): void {
    this.toasts = this.toasts.filter(t => t !== toast);
  }

  trackByToast(index: number, toast: Toast): string {
    return toast.message + index;
  }
}