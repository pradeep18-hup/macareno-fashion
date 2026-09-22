import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

interface SizeQty {
  size: string;
  qty: number | null;
}

interface PhotoItem {
  file: File;
  url: string;
}

@Component({
  selector: 'app-dress-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dress-form.html',
  styleUrl: './dress-form.css'
})
export class DressForm implements OnDestroy {

  dressTypes = [
    'Shirt', 'T-Shirt', 'Jeans', 'Trousers', 'Skirt', 'Frock',
    'Kurti', 'Saree', 'Lehenga', 'Gown', 'Jacket', 'Shorts'
  ];

  sizeTypeOptions = [
    { value: 'number',   label: 'Number (28, 30, 32...)' },
    { value: 'alphabet', label: 'Alphabet (S, M, L...)' }
  ];

  numberSizes = ['26', '28', '30', '32', '34', '36', '38', '40', '42', '44'];
  alphabetSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

  availableSizes: string[] = [];
  selectedSizes: SizeQty[] = [];

  photos: PhotoItem[] = [];
  photoError = '';
  readonly maxPhotos = 5;
  readonly maxPhotoSizeMb = 2;

  dressForm: FormGroup;
  submitAttempted = false;

  constructor(private fb: FormBuilder) {
    this.dressForm = this.fb.group({
      dressName:       ['', Validators.required],
      dressType:       ['', Validators.required],
      price:           [null, [Validators.required, Validators.min(1)]],
      offerPercentage: [null, [Validators.min(0), Validators.max(100)]],
      offerPrice:      [null, [Validators.required, Validators.min(0)]],
      sizeType:        ['', Validators.required]
    });

    // emitEvent: false is used when patching to avoid infinite update loops
    this.dressForm.get('price')?.valueChanges.subscribe(() => this.onPriceChange());
    this.dressForm.get('offerPrice')?.valueChanges.subscribe(() => this.onOfferPriceChange());
    this.dressForm.get('offerPercentage')?.valueChanges.subscribe(() => this.onPercentageChange());
    this.dressForm.get('sizeType')?.valueChanges.subscribe(val => this.onSizeTypeChange(val));
  }

  // ---------- Price / offer logic ----------

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private toNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const n = Number(value);
    return isNaN(n) ? null : n;
  }

  // Price changed: keep offer price, recalculate percentage
  private onPriceChange(): void {
    const price = this.toNumber(this.dressForm.get('price')?.value);
    const offerPrice = this.toNumber(this.dressForm.get('offerPrice')?.value);
    const pct = this.toNumber(this.dressForm.get('offerPercentage')?.value);

    if (price && price > 0) {
      if (offerPrice !== null) {
        this.patchPercentageFromOffer(price, offerPrice);
      } else if (pct !== null) {
        this.patchOfferFromPercentage(price, pct);
      }
    } else {
      this.dressForm.get('offerPercentage')?.setValue(null, { emitEvent: false });
    }
  }

  // Offer price typed: calculate percentage
  private onOfferPriceChange(): void {
    const price = this.toNumber(this.dressForm.get('price')?.value);
    const offerPrice = this.toNumber(this.dressForm.get('offerPrice')?.value);

    if (price && price > 0 && offerPrice !== null) {
      this.patchPercentageFromOffer(price, offerPrice);
    } else {
      this.dressForm.get('offerPercentage')?.setValue(null, { emitEvent: false });
    }
  }

  // Percentage typed: calculate offer price
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

  // ---------- Sizes ----------

  onSizeTypeChange(type: string): void {
    this.availableSizes = type === 'number' ? this.numberSizes : this.alphabetSizes;
    this.selectedSizes = [];
  }

  toggleSize(size: string): void {
    const existing = this.selectedSizes.find(s => s.size === size);
    if (existing) {
      this.selectedSizes = this.selectedSizes.filter(s => s.size !== size);
    } else {
      this.selectedSizes = [...this.selectedSizes, { size, qty: null }];
    }
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
  }

  get totalQty(): number {
    return this.selectedSizes.reduce((sum, s) => sum + (s.qty || 0), 0);
  }

  get hasInvalidSizeQty(): boolean {
    return this.selectedSizes.some(s => !s.qty || s.qty <= 0);
  }

  // ---------- Photos ----------

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

    // Clear the input so the same file can be selected again later
    input.value = '';
  }

  removePhoto(index: number): void {
    URL.revokeObjectURL(this.photos[index].url);
    this.photos = this.photos.filter((_, i) => i !== index);
    this.photoError = '';
  }

  private clearPhotos(): void {
    this.photos.forEach(p => URL.revokeObjectURL(p.url));
    this.photos = [];
    this.photoError = '';
  }

  ngOnDestroy(): void {
    this.clearPhotos();
  }

  // ---------- Submit / reset ----------

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
      return;
    }

    const payload = {
      ...this.dressForm.value,
      sizes: this.selectedSizes,
      totalQty: this.totalQty,
      photos: this.photos.map(p => p.file)
    };

    // Build multipart form data for the API upload
    const formData = new FormData();
    const { photos, sizes, ...rest } = payload;
    Object.entries(rest).forEach(([key, value]) => formData.append(key, String(value)));
    formData.append('sizes', JSON.stringify(sizes));
    photos.forEach((file: File) => formData.append('photos', file));

    console.log('Dress payload:', payload);
    // TODO: this.dressService.saveDress(formData).subscribe(...)
  }

  resetForm(): void {
    this.dressForm.reset();
    this.selectedSizes = [];
    this.availableSizes = [];
    this.submitAttempted = false;
    this.clearPhotos();
  }
}