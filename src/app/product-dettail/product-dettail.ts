import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

export interface Product {
  id: number;
  name: string;
  price: number;
  mrp: number;
  images: string[];
  category: string;
  rating: number;
  ratingCount: number;
  isFavorite: boolean;
  description: string;
  highlights: string[];
  sizes: string[];
  deliveryCharge: number;
  deliveryDays: number;
  codAvailable: boolean;
  returnPolicyDays: number;
}

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  houseNo: string;
  street: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
}

// ===== FAKE PRODUCT (no route, no API) =====
const FAKE_PRODUCT: Product = {
  id: 1,
  name: 'Seoul Silk Midi Dress',
  price: 199,
  mrp: 399,
  images: [
    'https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=1000&q=90',
    'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=90',
    'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=90',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=90'
  ],
  category: 'Dresses',
  rating: 4.8,
  ratingCount: 1243,
  isFavorite: false,
  description:
    'A fluid silk-blend midi dress cut for everyday ease. Soft drape, bias-inspired seaming and a relaxed silhouette that moves with you.',
  highlights: [
    '100% mulberry silk blend',
    'Bias-cut, relaxed fit',
    'Hidden side-zip closure',
    'Dry clean only'
  ],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  deliveryCharge: 0,
  deliveryDays: 4,
  codAvailable: true,
  returnPolicyDays: 14
};

const EMPTY_ADDRESS: DeliveryAddress = {
  fullName: '',
  phone: '',
  houseNo: '',
  street: '',
  landmark: '',
  city: '',
  state: '',
  pincode: ''
};

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './product-dettail.html',
  styleUrl: './product-dettail.css'
})
export class ProductDetailComponent {
  product = signal<Product>({ ...FAKE_PRODUCT });

  activeImageIndex = signal(0);
  selectedSize = signal<string | null>(null);
  quantity = signal(1);
  pincode = signal('');
  deliveryChecked = signal(false);

  discount = computed(() => {
    const p = this.product();
    return p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
  });

  totalPrice = computed(() => this.product().price * this.quantity());

  setActiveImage(i: number) {
    this.activeImageIndex.set(i);
  }

  selectSize(size: string) {
    this.selectedSize.set(size);
  }

  increaseQuantity() {
    this.quantity.update(q => q + 1);
  }

  decreaseQuantity() {
    if (this.quantity() > 1) this.quantity.update(q => q - 1);
  }

  toggleFavorite() {
    this.product.update(p => ({ ...p, isFavorite: !p.isFavorite }));
  }

  checkDelivery() {
    if (this.pincode().trim().length >= 4) this.deliveryChecked.set(true);
  }

  formatPrice(price: number): string {
    return '₹' + price.toLocaleString('en-IN');
  }

  addToCart() {
    const p = this.product();
    if (p.sizes.length && p.sizes[0] !== 'One Size' && !this.selectedSize()) {
      alert('Please select a size first.');
      return;
    }
    alert(
      `Added ${this.quantity()} x ${p.name} (${this.selectedSize() ?? 'One Size'}) to cart!\nTotal: ${this.formatPrice(this.totalPrice())}`
    );
  }

  buyNow() {
    this.addToCart();
  }

  // ===================== DELIVERY ADDRESS MODULE =====================

  /** The address the customer has saved, or null if none saved yet */
  savedAddress = signal<DeliveryAddress | null>(null);

  /** Whether the "enter address" form is currently open */
  showAddressForm = signal(false);

  /** Draft values while the form is open (only committed on save) */
  addressDraft = signal<DeliveryAddress>({ ...EMPTY_ADDRESS });

  /** Validation message for the address form, empty when valid */
  addressError = signal('');

  addressField<K extends keyof DeliveryAddress>(key: K, value: string) {
    this.addressDraft.update(a => ({ ...a, [key]: value }));
  }

  openAddressForm() {
    // Pre-fill the form with the saved address if the user is editing
    this.addressDraft.set(this.savedAddress() ? { ...this.savedAddress()! } : { ...EMPTY_ADDRESS });
    this.addressError.set('');
    this.showAddressForm.set(true);
  }

  cancelAddressForm() {
    this.showAddressForm.set(false);
    this.addressError.set('');
  }

  saveAddress() {
    const a = this.addressDraft();

    if (!a.houseNo.trim() || !a.street.trim() || !a.city.trim() || !a.pincode.trim()) {
      this.addressError.set('House no, street, city and pincode are required.');
      return;
    }
    if (!/^\d{6}$/.test(a.pincode.trim())) {
      this.addressError.set('Enter a valid 6-digit pincode.');
      return;
    }

    this.savedAddress.set({ ...a });
    this.pincode.set(a.pincode.trim());
    this.deliveryChecked.set(true);
    this.showAddressForm.set(false);
    this.addressError.set('');
  }

  removeAddress() {
    this.savedAddress.set(null);
    this.deliveryChecked.set(false);
  }
}