import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  isFavorite: boolean;
  quantity: number;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent {
  // ===== FILTER PROPERTIES =====
  categories = ['All', 'Dresses', 'Tops', 'Outerwear', 'Sets', 'Accessories'];
  activeCategory = signal('All');

  // Korean Fashion Women's Dresses with prices ₹99-₹299
  products = signal<Product[]>([
    {
      id: 1,
      name: 'Seoul Silk Midi Dress',
      price: 199,
      image: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=600&q=80',
      category: 'Dresses',
      rating: 4.8,
      isFavorite: false,
      quantity: 1
    },
    {
      id: 2,
      name: 'Korean Oversized Blazer',
      price: 299,
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80',
      category: 'Outerwear',
      rating: 4.9,
      isFavorite: false,
      quantity: 1
    },
   
    {
      id: 4,
      name: 'Cashmere Knit Top',
      price: 149,
      image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80',
      category: 'Tops',
      rating: 4.6,
      isFavorite: false,
      quantity: 1
    },
    {
      id: 5,
      name: 'Pleated Mini Skirt Set',
      price: 189,
      image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80',
      category: 'Sets',
      rating: 4.5,
      isFavorite: false,
      quantity: 1
    },
    {
      id: 6,
      name: 'Seoul Street Coat',
      price: 279,
      image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=80',
      category: 'Outerwear',
      rating: 4.8,
      isFavorite: false,
      quantity: 1
    },
    {
      id: 7,
      name: 'Floral Wrap Dress',
      price: 169,
      image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80',
      category: 'Dresses',
      rating: 4.4,
      isFavorite: false,
      quantity: 1
    },
    {
      id: 8,
      name: 'Silk Scarf Accessory',
      price: 99,
      image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80',
      category: 'Accessories',
      rating: 4.3,
      isFavorite: false,
      quantity: 1
    },
    {
      id: 9,
      name: 'Tweed Jacket Set',
      price: 259,
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
      category: 'Sets',
      rating: 4.6,
      isFavorite: false,
      quantity: 1
    },
    {
      id: 10,
      name: 'Korean Ribbed Top',
      price: 129,
      image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80',
      category: 'Tops',
      rating: 4.5,
      isFavorite: false,
      quantity: 1
    }
  ]);

  // ===== COMPUTED VALUES =====
  filteredProducts = computed(() => {
    const category = this.activeCategory();
    return this.products().filter(product => {
      return category === 'All' || product.category === category;
    });
  });

  // ===== PRODUCT METHODS =====
  toggleFavorite(product: Product) {
    product.isFavorite = !product.isFavorite;
    this.products.set([...this.products()]);
  }

  increaseQuantity(product: Product) {
    product.quantity++;
    this.products.set([...this.products()]);
  }

  decreaseQuantity(product: Product) {
    if (product.quantity > 1) {
      product.quantity--;
      this.products.set([...this.products()]);
    }
  }

  buyNow(product: Product) {
    alert(`Added ${product.quantity} x ${product.name} to cart!\nTotal: ₹${(product.price * product.quantity).toLocaleString('en-IN')}`);
  }

  seeAll() {
    this.activeCategory.set('All');
  }

  selectCategory(category: string) {
    this.activeCategory.set(category);
  }

  formatPrice(price: number): string {
    return '₹' + price.toLocaleString('en-IN');
  }
}