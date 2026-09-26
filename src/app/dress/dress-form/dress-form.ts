import { Component, OnDestroy, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators
} from '@angular/forms';
import {
  ProductService, DressType, SizeOption
} from '../../services/product.service';

interface SizeQty {
  size: string;
  qty: number | null;
}

interface PhotoItem {
  file: File;
  url: string;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-dress-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dress-form.html',
  styleUrl: './dress-form.css'
})
export class DressForm implements OnInit, OnDestroy {

  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private cdr = inject(ChangeDetectorRef);   // ✅ ADDED

  // Guards & cache
  private dressTypesLoaded = false;
  private sizeCache = new Map<string, string[]>();

  dressTypes: DressType[] = [];
  sizeTypeOptions = [
    { value: 'number',   label: 'Number (28, 30, 32...)' },
    { value: 'alphabet', label: 'Alphabet (S, M, L...)' }
  ];

  availableSizes: string[] = [];
  selectedSizes: SizeQty[] = [];

  photos: PhotoItem[] = [];
  photoError = '';
  readonly maxPhotos = 5;
  readonly maxPhotoSizeMb = 2;

  dressForm: FormGroup;
  submitAttempted = false;
  submitting = false;

  toasts: Toast[] = [];

  constructor() {
    this.dressForm = this.fb.group({
      dressName:       ['', Validators.required],
      dressTypeId:     [null as number | null, Validators.required],
      price:           [null, [Validators.required, Validators.min(1)]],
      offerPercentage: [null, [Validators.min(0), Validators.max(100)]],
      offerPrice:      [null, [Validators.required, Validators.min(0)]],
      sizeType:        ['', Validators.required]
    });

    this.dressForm.get('price')?.valueChanges.subscribe(() => this.onPriceChange());
    this.dressForm.get('offerPrice')?.valueChanges.subscribe(() => this.onOfferPriceChange());
    this.dressForm.get('offerPercentage')?.valueChanges.subscribe(() => this.onPercentageChange());
    this.dressForm.get('sizeType')?.valueChanges.subscribe(
      val => this.onSizeTypeChange(val)
    );
  }

  ngOnInit(): void {
    if (this.dressTypesLoaded) return;
    this.dressTypesLoaded = true;
    this.loadDressTypes();
  }

  // ============== Load dress types ==============
  private loadDressTypes(): void {
    this.productService.getDressTypes().subscribe({
      next: (list: DressType[]) => {
        this.dressTypes = list;
        this.cdr.markForCheck();       // ✅ force view update
      },
      error: () => this.notify('error', 'Failed to load dress types.')
    });
  }

  // ============== Price / Offer logic ==============
  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return isNaN(n) ? null : n;
  }

  private onPriceChange(): void {
    const price = this.toNumber(this.dressForm.get('price')?.value);
    const offerPrice = this.toNumber(this.dressForm.get('offerPrice')?.value);
    const pct = this.toNumber(this.dressForm.get('offerPercentage')?.value);

    if (price && price > 0) {
      if (offerPrice !== null) this.patchPercentageFromOffer(price, offerPrice);
      else if (pct !== null) this.patchOfferFromPercentage(price, pct);
    } else {
      this.dressForm.get('offerPercentage')?.setValue(null, { emitEvent: false });
    }
  }

  private onOfferPriceChange(): void {
    const price = this.toNumber(this.dressForm.get('price')?.value);
    const offerPrice = this.toNumber(this.dressForm.get('offerPrice')?.value);

    if (price && price > 0 && offerPrice !== null) {
      this.patchPercentageFromOffer(price, offerPrice);
    } else {
      this.dressForm.get('offerPercentage')?.setValue(null, { emitEvent: false });
    }
  }

  private onPercentageChange(): void {
    const price = this.toNumber(this.dressForm.get('price')?.value);
    const pct = this.toNumber(this.dressForm.get('offerPercentage')?.value);

    if (price && price > 0 && pct !== null) {
      this.patchOfferFromPercentage(price, pct);
    } else if (pct === null) {
      this.dressForm.get('offerPrice')?.setValue(null, { emitEvent: false });
    }
  }

  private patchPercentageFromOffer(price: number, offerPrice: number): void {
    if (offerPrice > price) {
      this.dressForm.get('offerPercentage')?.setValue(null, { emitEvent: false });
      return;
    }
    const pct = this.round2(((price - offerPrice) / price) * 100);
    this.dressForm.get('offerPercentage')?.setValue(pct, { emitEvent: false });
  }

  private patchOfferFromPercentage(price: number, pct: number): void {
    const safePct = Math.min(Math.max(pct, 0), 100);
    const offerPrice = this.round2(price - (price * safePct) / 100);
    this.dressForm.get('offerPrice')?.setValue(offerPrice, { emitEvent: false });
  }

  get offerExceedsPrice(): boolean {
    const price = this.toNumber(this.dressForm.get('price')?.value);
    const offerPrice = this.toNumber(this.dressForm.get('offerPrice')?.value);
    return price !== null && offerPrice !== null && offerPrice > price;
  }

  get savedAmount(): number {
    const price = this.toNumber(this.dressForm.get('price')?.value);
    const offerPrice = this.toNumber(this.dressForm.get('offerPrice')?.value);
    if (price !== null && offerPrice !== null && offerPrice <= price) {
      return this.round2(price - offerPrice);
    }
    return 0;
  }

  // ============== Sizes — loaded from backend (with cache + view refresh) ==============
  onSizeTypeChange(type: string): void {
    this.selectedSizes = [];
    this.availableSizes = [];
    this.cdr.markForCheck();             // ✅ update immediately

    if (!type) return;

    // Cached → instant
    const cached = this.sizeCache.get(type);
    if (cached) {
      this.availableSizes = cached;
      this.cdr.markForCheck();           // ✅ update with cached list
      return;
    }

    this.productService.getSizes(type as 'alphabet' | 'number').subscribe({
      next: (list: SizeOption[]) => {
        const labels = list.map((s: SizeOption) => s.label);
        this.sizeCache.set(type, labels);
        this.availableSizes = labels;
        this.cdr.markForCheck();         // ✅ force view update after HTTP
      },
      error: () => {
        this.notify('error', `Failed to load ${type} sizes.`);
        this.cdr.markForCheck();
      }
    });
  }

  toggleSize(size: string): void {
    const existing = this.selectedSizes.find(s => s.size === size);
    if (existing) {
      this.selectedSizes = this.selectedSizes.filter(s => s.size !== size);
    } else {
      this.selectedSizes = [...this.selectedSizes, { size, qty: null }];
    }
    this.cdr.markForCheck();
  }

  isSizeSelected(size: string): boolean {
    return this.selectedSizes.some(s => s.size === size);
  }

  getSizeQty(size: string): number | null {
    return this.selectedSizes.find(s => s.size === size)?.qty ?? null;
  }

  updateSizeQty(size: string, value: string): void {
    const qty = value === '' ? null : Number(value);
    this.selectedSizes = this.selectedSizes.map(s =>
      s.size === size ? { ...s, qty } : s
    );
    this.cdr.markForCheck();
  }

  get totalQty(): number {
    return this.selectedSizes.reduce((sum, s) => sum + (s.qty || 0), 0);
  }

  get hasInvalidSizeQty(): boolean {
    return this.selectedSizes.some(s => !s.qty || s.qty <= 0);
  }

  // ============== Photos ==============
  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.photoError = '';

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        this.photoError = `"${file.name}" is not an image file.`;
        continue;
      }
      if (file.size > this.maxPhotoSizeMb * 1024 * 1024) {
        this.photoError = `"${file.name}" is larger than ${this.maxPhotoSizeMb} MB.`;
        continue;
      }
      if (this.photos.length >= this.maxPhotos) {
        this.photoError = `You can add up to ${this.maxPhotos} photos.`;
        break;
      }
      this.photos = [...this.photos, { file, url: URL.createObjectURL(file) }];
    }

    this.cdr.markForCheck();
    input.value = '';
  }

  removePhoto(index: number): void {
    URL.revokeObjectURL(this.photos[index].url);
    this.photos = this.photos.filter((_, i) => i !== index);
    this.photoError = '';
    this.cdr.markForCheck();
  }

  private clearPhotos(): void {
    this.photos.forEach(p => URL.revokeObjectURL(p.url));
    this.photos = [];
    this.photoError = '';
  }

  ngOnDestroy(): void {
    this.clearPhotos();
  }

  // ============== Submit ==============
  onSubmit(): void {
    this.submitAttempted = true;
    this.dressForm.markAllAsTouched();

    if (
      this.dressForm.invalid ||
      this.offerExceedsPrice ||
      this.photos.length === 0 ||
      this.selectedSizes.length === 0 ||
      this.hasInvalidSizeQty
    ) {
      this.notify('error', 'Please fix the form errors and try again.');
      return;
    }

    const v = this.dressForm.value;
    const formData = new FormData();
    formData.append('dressName', v.dressName);
    formData.append('dressTypeId', String(v.dressTypeId));
    formData.append('price', String(v.price));
    if (v.offerPercentage !== null && v.offerPercentage !== undefined) {
      formData.append('offerPercentage', String(v.offerPercentage));
    }
    formData.append('offerPrice', String(v.offerPrice));
    formData.append('sizeType', v.sizeType);
    formData.append('totalQty', String(this.totalQty));

    this.selectedSizes.forEach(s => {
      formData.append('sizeLabels', s.size);
      formData.append('sizeQty', String(s.qty));
    });

    this.photos.forEach(p => formData.append('photos', p.file, p.file.name));

    this.submitting = true;
    this.productService.createProduct(formData).subscribe({
      next: () => {
        this.submitting = false;
        this.notify('success', 'Product added successfully.');
        this.resetForm();
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.submitting = false;
        this.notify('error', err.error?.error || 'Failed to save product.');
        this.cdr.markForCheck();
      }
    });
  }

  resetForm(): void {
    this.dressForm.reset();
    this.selectedSizes = [];
    this.availableSizes = [];
    this.submitAttempted = false;
    this.clearPhotos();
    this.cdr.markForCheck();
  }

  // ============== Toasts ==============
  private notify(type: 'success' | 'error', message: string): void {
    const t = { type, message };
    this.toasts.push(t);
    setTimeout(() => {
      this.toasts = this.toasts.filter(x => x !== t);
      this.cdr.markForCheck();
    }, 3000);
  }

  dismissToast(t: Toast): void {
    this.toasts = this.toasts.filter(x => x !== t);
    this.cdr.markForCheck();
  }
}