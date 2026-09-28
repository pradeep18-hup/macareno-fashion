import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ProductService, ProductResponse, DressType, SizeOption,
} from '../../services/product.service';

interface SizeQty { size: string; qty: number | null; }
interface NewPhoto { file: File; url: string; }
interface Toast { type: 'success' | 'error'; message: string; }

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.css'],
})
export class ProductListComponent implements OnInit {
  private productService = inject(ProductService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  products = signal<ProductResponse[]>([]);
  loading = signal(true);
  errorMessage = signal('');

  // Delete
  pendingDeleteId = signal<number | null>(null);
  deletingId = signal<number | null>(null);

  // Edit modal
  editingProduct: ProductResponse | null = null;
  editForm!: FormGroup;
  dressTypes: DressType[] = [];
  availableSizes: string[] = [];
  selectedSizes: SizeQty[] = [];
  newPhotos: NewPhoto[] = [];
  photoError = '';
  submitAttempted = false;
  saving = false;
  modalError = '';
  readonly maxPhotos = 5;
  readonly maxPhotoSizeMb = 2;
  private sizeCache = new Map<string, string[]>();

  sizeTypeOptions = [
    { value: 'number', label: 'Number (28, 30, 32...)' },
    { value: 'alphabet', label: 'Alphabet (S, M, L...)' },
  ];

  toasts: Toast[] = [];

  ngOnInit(): void {
    this.fetchProducts();
    this.productService.getDressTypes().subscribe({
      next: (l) => { this.dressTypes = l; this.cdr.markForCheck(); },
    });
  }

  fetchProducts(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.productService.getAll().subscribe({
      next: (p) => { this.products.set(p); this.loading.set(false); },
      error: (err) => {
        console.error('Load products failed', err);
        this.errorMessage.set('Could not load products. Please try again.');
        this.loading.set(false);
      },
    });
  }

  imageUrl(path: string): string {
    return this.productService.imageUrl(path);
  }

  trackByProductId(_i: number, p: ProductResponse): number { return p.id; }

  // ================= Edit: open / close =================
  openEdit(product: ProductResponse): void {
    this.editingProduct = product;
    this.modalError = '';
    this.submitAttempted = false;
    this.photoError = '';
    this.newPhotos = [];

    this.editForm = this.fb.group({
      dressName: [product.dressName, Validators.required],
      dressTypeId: [product.dressTypeId as number | null, Validators.required],
      price: [product.price, [Validators.required, Validators.min(1)]],
      offerPercentage: [product.offerPercentage ?? null, [Validators.min(0), Validators.max(100)]],
      offerPrice: [product.offerPrice, [Validators.required, Validators.min(0)]],
      sizeType: [product.sizeType, Validators.required],
    });

    this.editForm.get('price')?.valueChanges.subscribe(() => this.onPriceChange());
    this.editForm.get('offerPrice')?.valueChanges.subscribe(() => this.onOfferPriceChange());
    this.editForm.get('offerPercentage')?.valueChanges.subscribe(() => this.onPercentageChange());
    this.editForm.get('sizeType')?.valueChanges.subscribe((v) => {
      this.selectedSizes = [];
      this.loadSizes(v);
    });

    // existing sizes preselect
    this.selectedSizes = (product.sizes ?? []).map((s) => ({ size: s.size, qty: s.qty }));
    this.loadSizes(product.sizeType);
  }

  closeEdit(): void {
    this.newPhotos.forEach((p) => URL.revokeObjectURL(p.url));
    this.newPhotos = [];
    this.editingProduct = null;
    this.saving = false;
    this.modalError = '';
  }

  // ================= Sizes =================
  private loadSizes(type: string): void {
    this.availableSizes = [];
    if (!type) return;

    const cached = this.sizeCache.get(type);
    if (cached) { this.availableSizes = cached; return; }

    this.productService.getSizes(type as 'alphabet' | 'number').subscribe({
      next: (list: SizeOption[]) => {
        const labels = list.map((s) => s.label);
        this.sizeCache.set(type, labels);
        this.availableSizes = labels;
        this.cdr.markForCheck();
      },
      error: () => { this.notify('error', `Failed to load ${type} sizes.`); },
    });
  }

  toggleSize(size: string): void {
    if (this.isSizeSelected(size)) {
      this.selectedSizes = this.selectedSizes.filter((s) => s.size !== size);
    } else {
      this.selectedSizes = [...this.selectedSizes, { size, qty: null }];
    }
  }

  isSizeSelected(size: string): boolean {
    return this.selectedSizes.some((s) => s.size === size);
  }

  getSizeQty(size: string): number | null {
    return this.selectedSizes.find((s) => s.size === size)?.qty ?? null;
  }

  updateSizeQty(size: string, value: string): void {
    const qty = value === '' ? null : Number(value);
    this.selectedSizes = this.selectedSizes.map((s) => (s.size === size ? { ...s, qty } : s));
  }

  get totalQty(): number {
    return this.selectedSizes.reduce((sum, s) => sum + (s.qty || 0), 0);
  }

get hasInvalidSizeQty(): boolean {
  // 0 allowed (out of stock). Empty illa negative mattum invalid
  return this.selectedSizes.some(s => s.qty === null || s.qty < 0);
}

  // ================= Price / offer logic =================
  private round2(v: number): number { return Math.round(v * 100) / 100; }

  private toNumber(v: unknown): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }

  private onPriceChange(): void {
    const price = this.toNumber(this.editForm.get('price')?.value);
    const offerPrice = this.toNumber(this.editForm.get('offerPrice')?.value);
    const pct = this.toNumber(this.editForm.get('offerPercentage')?.value);
    if (price && price > 0) {
      if (offerPrice !== null) this.pctFromOffer(price, offerPrice);
      else if (pct !== null) this.offerFromPct(price, pct);
    } else {
      this.editForm.get('offerPercentage')?.setValue(null, { emitEvent: false });
    }
  }

  private onOfferPriceChange(): void {
    const price = this.toNumber(this.editForm.get('price')?.value);
    const offerPrice = this.toNumber(this.editForm.get('offerPrice')?.value);
    if (price && price > 0 && offerPrice !== null) this.pctFromOffer(price, offerPrice);
    else this.editForm.get('offerPercentage')?.setValue(null, { emitEvent: false });
  }

  private onPercentageChange(): void {
    const price = this.toNumber(this.editForm.get('price')?.value);
    const pct = this.toNumber(this.editForm.get('offerPercentage')?.value);
    if (price && price > 0 && pct !== null) this.offerFromPct(price, pct);
    else if (pct === null) this.editForm.get('offerPrice')?.setValue(null, { emitEvent: false });
  }

  private pctFromOffer(price: number, offerPrice: number): void {
    if (offerPrice > price) {
      this.editForm.get('offerPercentage')?.setValue(null, { emitEvent: false });
      return;
    }
    this.editForm.get('offerPercentage')
      ?.setValue(this.round2(((price - offerPrice) / price) * 100), { emitEvent: false });
  }

  private offerFromPct(price: number, pct: number): void {
    const safe = Math.min(Math.max(pct, 0), 100);
    this.editForm.get('offerPrice')
      ?.setValue(this.round2(price - (price * safe) / 100), { emitEvent: false });
  }

  get offerExceedsPrice(): boolean {
    const price = this.toNumber(this.editForm?.get('price')?.value);
    const offer = this.toNumber(this.editForm?.get('offerPrice')?.value);
    return price !== null && offer !== null && offer > price;
  }

  get savedAmount(): number {
    const price = this.toNumber(this.editForm?.get('price')?.value);
    const offer = this.toNumber(this.editForm?.get('offerPrice')?.value);
    return price !== null && offer !== null && offer <= price ? this.round2(price - offer) : 0;
  }

  // ================= Photos (optional new photos) =================
  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.photoError = '';

    for (const file of files) {
      if (!file.type.startsWith('image/')) { this.photoError = `"${file.name}" is not an image.`; continue; }
      if (file.size > this.maxPhotoSizeMb * 1024 * 1024) {
        this.photoError = `"${file.name}" is larger than ${this.maxPhotoSizeMb} MB.`; continue;
      }
      if (this.newPhotos.length >= this.maxPhotos) {
        this.photoError = `You can add up to ${this.maxPhotos} photos.`; break;
      }
      this.newPhotos = [...this.newPhotos, { file, url: URL.createObjectURL(file) }];
    }
    input.value = '';
  }

  removeNewPhoto(i: number): void {
    URL.revokeObjectURL(this.newPhotos[i].url);
    this.newPhotos = this.newPhotos.filter((_, idx) => idx !== i);
  }

  // ================= Save =================
  saveEdit(): void {
    if (!this.editingProduct) return;
    this.submitAttempted = true;
    this.editForm.markAllAsTouched();

    if (
      this.editForm.invalid ||
      this.offerExceedsPrice ||
      this.selectedSizes.length === 0 ||
      this.hasInvalidSizeQty
    ) {
      this.modalError = 'Please fix the form errors and try again.';
      return;
    }

    const v = this.editForm.value;
    const fd = new FormData();
    fd.append('dressName', v.dressName);
    fd.append('dressTypeId', String(v.dressTypeId));
    fd.append('price', String(v.price));
    if (v.offerPercentage !== null && v.offerPercentage !== undefined) {
      fd.append('offerPercentage', String(v.offerPercentage));
    }
    fd.append('offerPrice', String(v.offerPrice));
    fd.append('sizeType', v.sizeType);
    fd.append('totalQty', String(this.totalQty));
    this.selectedSizes.forEach((s) => {
      fd.append('sizeLabels', s.size);
      fd.append('sizeQty', String(s.qty));
    });
    this.newPhotos.forEach((p) => fd.append('photos', p.file, p.file.name));

    this.saving = true;
    this.modalError = '';
    const id = this.editingProduct.id;

    this.productService.updateProduct(id, fd).subscribe({
      next: (updated) => {
        this.products.update((list) => list.map((p) => (p.id === id ? { ...p, ...updated } : p)));
        this.saving = false;
        this.closeEdit();
        this.notify('success', 'Product updated successfully.');
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Update failed', err);
        this.saving = false;
        const detail = err?.error?.error || err?.error?.message || '';
        this.modalError = `Could not save (status ${err?.status ?? '?'}). ${detail}`;
        this.cdr.markForCheck();
      },
    });
  }

  // ================= Delete =================
  requestDelete(id: number): void { this.pendingDeleteId.set(id); }
  cancelDelete(): void { this.pendingDeleteId.set(null); }

  confirmDelete(id: number): void {
    this.deletingId.set(id);
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products.update((list) => list.filter((p) => p.id !== id));
        this.deletingId.set(null);
        this.pendingDeleteId.set(null);
        this.notify('success', 'Product deleted.');
      },
      error: (err) => {
        this.deletingId.set(null);
        this.errorMessage.set(`Could not delete (status ${err?.status ?? '?'}).`);
      },
    });
  }

  // ================= Toasts =================
  private notify(type: 'success' | 'error', message: string): void {
    const t = { type, message };
    this.toasts.push(t);
    setTimeout(() => {
      this.toasts = this.toasts.filter((x) => x !== t);
      this.cdr.markForCheck();
    }, 3000);
  }

  dismissToast(t: Toast): void {
    this.toasts = this.toasts.filter((x) => x !== t);
  }
}