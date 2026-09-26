import { Component, OnInit, OnDestroy, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { SizeService, SizeOption } from '../services/size.service';

interface Toast {
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-size-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './size-form.html',
  styleUrl: './size-form.css'
})
export class SizeForm implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  private sizeService = inject(SizeService);
  private cdr = inject(ChangeDetectorRef);

  // ---------- State ----------
  activeTab: 'alphabet' | 'number' = 'alphabet';
  sizes: SizeOption[] = [];
  loading = false;
  submitting = false;
  loadError = '';

  toasts: Toast[] = [];
  pendingDelete: SizeOption | null = null;

  private subs = new Subscription();
  private hasLoaded = false;        // ✅ guard so it only loads once

  // ---------- Form ----------
  sizeForm = this.fb.group({
    label: ['', [Validators.required, Validators.maxLength(10)]],
    displayOrder: [null as number | null]
  });

  // ---------- Lifecycle ----------
  ngOnInit(): void {
    if (this.hasLoaded) return;      // ✅ prevents duplicate loads
    this.hasLoaded = true;
    this.load();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // ---------- Load ----------
  load(): void {
    this.loading = true;
    this.loadError = '';

    this.subs.add(
      this.sizeService.getByType(this.activeTab)
        .pipe(finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();   // ✅ force view update after HTTP
        }))
        .subscribe({
          next: (list) => {
            this.sizes = Array.isArray(list) ? [...list] : [];
          },
          error: (err) => {
            console.error('[SizeForm] load failed', err);
            this.sizes = [];
            this.loadError = err?.error?.error || err?.message || 'Failed to load sizes.';
            this.notify('error', this.loadError);
          }
        })
    );
  }

  // ---------- Tabs ----------
  switchTab(tab: 'alphabet' | 'number'): void {
    if (this.activeTab === tab) return;
    this.activeTab = tab;
    this.sizeForm.reset();
    this.load();
  }

  // ---------- Add ----------
  add(): void {
    if (this.sizeForm.invalid) {
      this.sizeForm.markAllAsTouched();
      return;
    }

    const label = (this.sizeForm.value.label ?? '').trim();
    if (!label) return;

    const payload = {
      sizeType: this.activeTab,
      label,
      displayOrder: this.sizeForm.value.displayOrder ?? 0
    };

    this.submitting = true;
    this.subs.add(
      this.sizeService.add(payload).subscribe({
        next: () => {
          this.submitting = false;
          this.sizeForm.reset();
          this.notify('success', `Size "${label}" added.`);
          this.load();
        },
        error: (err) => {
          this.submitting = false;
          this.notify('error', err.error?.error || 'Failed to add size.');
        }
      })
    );
  }

  // ---------- Delete ----------
  askDelete(size: SizeOption): void { this.pendingDelete = size; }
  cancelDelete(): void { this.pendingDelete = null; }

  confirmDelete(): void {
    if (!this.pendingDelete) return;
    const target = this.pendingDelete;
    this.pendingDelete = null;

    this.subs.add(
      this.sizeService.remove(target.id).subscribe({
        next: (res) => {
          this.notify('success', res.message || 'Size deleted.');
          this.load();
        },
        error: (err) => {
          this.notify('error', err.error?.error || 'Failed to delete.');
        }
      })
    );
  }

  // ---------- Toasts ----------
  private notify(type: 'success' | 'error', message: string): void {
    const t = { type, message };
    this.toasts.push(t);
    setTimeout(() => this.toasts = this.toasts.filter(x => x !== t), 3000);
  }

  dismissToast(t: Toast): void {
    this.toasts = this.toasts.filter(x => x !== t);
  }
}