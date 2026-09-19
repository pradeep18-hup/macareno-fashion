import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

interface SizeQty {
  size: string;
  qty: number | null;
}

@Component({
  selector: 'app-dress-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dress-form.html',
  styleUrl: './dress-form.css'
})
export class DressForm {

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
  // ✅ ippo qty kuda store aagum ovvoru selected size-kkum
  selectedSizes: SizeQty[] = [];

  dressForm: FormGroup;
  offerPercentage = 0;
  submitAttempted = false;

  constructor(private fb: FormBuilder) {
    this.dressForm = this.fb.group({
      dressName: ['', Validators.required],
      dressType: ['', Validators.required],
      price:      [null, [Validators.required, Validators.min(1)]],
      offerPrice: [null, [Validators.required, Validators.min(0)]],
      sizeType:   ['', Validators.required]
      // ❌ single 'qty' field removed - ippo per-size qty
    });

    this.dressForm.get('price')?.valueChanges.subscribe(() => this.calculateOffer());
    this.dressForm.get('offerPrice')?.valueChanges.subscribe(() => this.calculateOffer());
    this.dressForm.get('sizeType')?.valueChanges.subscribe(val => this.onSizeTypeChange(val));
  }

  calculateOffer(): void {
    const price = this.dressForm.get('price')?.value;
    const offerPrice = this.dressForm.get('offerPrice')?.value;

    if (price && offerPrice && price > 0 && offerPrice <= price) {
      const discount = ((price - offerPrice) / price) * 100;
      this.offerPercentage = Math.round(discount * 100) / 100;
    } else {
      this.offerPercentage = 0;
    }
  }

  onSizeTypeChange(type: string): void {
    this.availableSizes = type === 'number' ? this.numberSizes : this.alphabetSizes;
    this.selectedSizes = [];
  }

  toggleSize(size: string): void {
    const existing = this.selectedSizes.find(s => s.size === size);
    if (existing) {
      // already selected -> remove pannunga
      this.selectedSizes = this.selectedSizes.filter(s => s.size !== size);
    } else {
      // pudhusa select pannunga, qty null-a start aagum
      this.selectedSizes = [...this.selectedSizes, { size, qty: null }];
    }
  }

  isSizeSelected(size: string): boolean {
    return this.selectedSizes.some(s => s.size === size);
  }

  getSizeQty(size: string): number | null {
    return this.selectedSizes.find(s => s.size === size)?.qty ?? null;
  }

  // ✅ small box la qty type panna idhu trigger aagum
  updateSizeQty(size: string, value: string): void {
    const qty = value === '' ? null : Number(value);
    this.selectedSizes = this.selectedSizes.map(s =>
      s.size === size ? { ...s, qty } : s
    );
  }

  get totalQty(): number {
    return this.selectedSizes.reduce((sum, s) => sum + (s.qty || 0), 0);
  }

  // ✅ ella selected size-kum valid qty (> 0) irukka nu check
  get hasInvalidSizeQty(): boolean {
    return this.selectedSizes.some(s => !s.qty || s.qty <= 0);
  }

  onSubmit(): void {
    this.submitAttempted = true;
    this.dressForm.markAllAsTouched();

    if (this.dressForm.invalid || this.selectedSizes.length === 0 || this.hasInvalidSizeQty) {
      return;
    }

    const payload = {
      ...this.dressForm.value,
      offerPercentage: this.offerPercentage,
      sizes: this.selectedSizes,   // [{ size: 'M', qty: 10 }, { size: 'L', qty: 5 }]
      totalQty: this.totalQty
    };

    console.log('Dress payload:', payload);
    // TODO: DressService.saveDress(payload).subscribe(...)
  }

  resetForm(): void {
    this.dressForm.reset();
    this.selectedSizes = [];
    this.availableSizes = [];
    this.offerPercentage = 0;
    this.submitAttempted = false;
  }
}