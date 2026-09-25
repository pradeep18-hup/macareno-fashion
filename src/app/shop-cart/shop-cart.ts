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
  /* ---- fake cart, already filled with 5 items ---- */
  cartItems: CartItem[] = [
    {
      id: 'p001',
      name: 'Handwoven Silk Runner',
      image: 'https://picsum.photos/seed/p001/200/200',
      price: 2400,
      offerPrice: 1899,
      qty: 1
    },
    {
      id: 'p002',
      name: 'Terracotta Table Lamp',
      image: 'https://picsum.photos/seed/p002/200/200',
      price: 1450,
      qty: 2
    },
    {
      id: 'p003',
      name: 'Brass Wall Mirror',
      image: 'https://picsum.photos/seed/p003/200/200',
      price: 3200,
      offerPrice: 2650,
      qty: 1
    },
    {
      id: 'p004',
      name: 'Hand-block Print Cushion Cover',
      image: 'https://picsum.photos/seed/p004/200/200',
      price: 850,
      offerPrice: 699,
      qty: 3
    },
    {
      id: 'p005',
      name: 'Rattan Storage Basket',
      image: 'https://picsum.photos/seed/p005/200/200',
      price: 1200,
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