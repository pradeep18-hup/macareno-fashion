import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface CartItem {
  id: string;
  name: string;
  image: string;
  price: number;
  offerPrice?: number;
  qty: number;
}

@Component({
  selector: 'app-cart-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shop-cart.html',
  styleUrl: './shop-cart.css'
})
export class ShopCartComponent {
  /* ---- fake cart, already filled with 6 items ---- */
  cartItems: CartItem[] = [
   
    {
      id: 'p006',
      name: 'Woven Jute Area Rug',
      image: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=1000&q=90',
      price: 300,
      offerPrice: 199,
      qty: 1
    }
  ];

  hasOffer(item: CartItem): boolean {
    return item.offerPrice !== undefined && item.offerPrice < item.price;
  }

  unitPrice(item: CartItem): number {
    return item.offerPrice ?? item.price;
  }

  lineTotal(item: CartItem): number {
    return this.unitPrice(item) * item.qty;
  }

  get totalCount(): number {
    return this.cartItems.reduce((sum, i) => sum + i.qty, 0);
  }

  get originalTotal(): number {
    return this.cartItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  get payableTotal(): number {
    return this.cartItems.reduce((sum, i) => sum + this.unitPrice(i) * i.qty, 0);
  }

  get savings(): number {
    return this.originalTotal - this.payableTotal;
  }

  increase(item: CartItem): void {
    item.qty += 1;
  }

  decrease(item: CartItem): void {
    if (item.qty > 1) {
      item.qty -= 1;
    }
  }

  remove(item: CartItem): void {
    this.cartItems = this.cartItems.filter((i) => i.id !== item.id);
  }
}