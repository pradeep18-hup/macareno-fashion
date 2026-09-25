import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

export interface Product {
  id: number;
  name: string;
  price: number;
  mrp: number;
  image: string;
  images: string[];
  category: string;
  rating: number;
  ratingCount: number;
  isFavorite: boolean;
  quantity: number;
  description: string;
  highlights: string[];
  sizes: string[];
  deliveryCharge: number;
  deliveryDays: number;
  codAvailable: boolean;
  returnPolicyDays: number;
}

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.css'
})
export class HeroComponent {
  categories = ['All', 'Dresses', 'Tops', 'Outerwear', 'Sets', 'Accessories'];
  activeCategory = signal('All');

  // ===== FAKE DATA (no backend, no API) =====
  products = signal<Product[]>([
    {
      id: 1,
      name: 'Seoul Silk Midi Dress',
      price: 199,
      mrp: 399,
      image: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=600&q=80',
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
      quantity: 1,
      description:
        'A fluid silk-blend midi dress cut for everyday ease. Soft drape, bias-inspired seaming and a relaxed silhouette that moves with you.',
      highlights: ['100% mulberry silk blend', 'Bias-cut, relaxed fit', 'Hidden side-zip closure', 'Dry clean only'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      deliveryCharge: 0,
      deliveryDays: 4,
      codAvailable: true,
      returnPolicyDays: 14
    },
    {
      id: 2,
      name: 'Korean Oversized Blazer',
      price: 299,
      mrp: 599,
      image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=90',
        'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1000&q=90',
        'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1000&q=90'
      ],
      category: 'Outerwear',
      rating: 4.9,
      ratingCount: 876,
      isFavorite: false,
      quantity: 1,
      description:
        'Structured shoulders, an oversized drop-shoulder cut and a longline hem give this blazer its signature Seoul-street silhouette.',
      highlights: ['Wool-blend outer shell', 'Oversized, drop-shoulder fit', 'Double-button front', 'Machine washable lining'],
      sizes: ['S', 'M', 'L', 'XL'],
      deliveryCharge: 0,
      deliveryDays: 5,
      codAvailable: true,
      returnPolicyDays: 14
    },
    {
      id: 4,
      name: 'Cashmere Knit Top',
      price: 149,
      mrp: 299,
      image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=90',
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1000&q=90'
      ],
      category: 'Tops',
      rating: 4.6,
      ratingCount: 512,
      isFavorite: false,
      quantity: 1,
      description:
        'A featherweight cashmere knit with a soft crew neck and gently cropped hem. Pairs easily with high-waist trousers.',
      highlights: ['100% cashmere', 'Cropped, relaxed fit', 'Ribbed cuffs and hem', 'Hand wash cold'],
      sizes: ['XS', 'S', 'M', 'L'],
      deliveryCharge: 40,
      deliveryDays: 3,
      codAvailable: true,
      returnPolicyDays: 10
    },
    {
      id: 5,
      name: 'Pleated Mini Skirt Set',
      price: 189,
      mrp: 379,
      image: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=1000&q=90',
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=90'
      ],
      category: 'Sets',
      rating: 4.5,
      ratingCount: 340,
      isFavorite: false,
      quantity: 1,
      description:
        'A two-piece set built around a crisp pleated mini skirt and a matching fitted top, finished in a lightweight twill.',
      highlights: ['Matching two-piece set', 'Pleated, A-line skirt', 'Concealed back zip', 'Machine washable'],
      sizes: ['XS', 'S', 'M', 'L'],
      deliveryCharge: 0,
      deliveryDays: 4,
      codAvailable: true,
      returnPolicyDays: 14
    },
    {
      id: 6,
      name: 'Seoul Street Coat',
      price: 279,
      mrp: 549,
      image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?auto=format&fit=crop&w=1000&q=90',
        'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?auto=format&fit=crop&w=1000&q=90'
      ],
      category: 'Outerwear',
      rating: 4.8,
      ratingCount: 601,
      isFavorite: false,
      quantity: 1,
      description:
        'A below-the-knee wool coat with a clean notch lapel. Roomy enough to layer over knitwear.',
      highlights: ['Wool-blend, brushed finish', 'Notch lapel collar', 'Interior chest pocket', 'Dry clean only'],
      sizes: ['S', 'M', 'L', 'XL'],
      deliveryCharge: 0,
      deliveryDays: 6,
      codAvailable: false,
      returnPolicyDays: 14
    },
    {
      id: 7,
      name: 'Floral Wrap Dress',
      price: 169,
      mrp: 329,
      image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1000&q=90',
        'https://images.unsplash.com/photo-1612336307429-8a898d10e223?auto=format&fit=crop&w=1000&q=90'
      ],
      category: 'Dresses',
      rating: 4.4,
      ratingCount: 289,
      isFavorite: false,
      quantity: 1,
      description:
        'A soft floral wrap dress with a self-tie waist and a flattering V-neckline.',
      highlights: ['Viscose-blend fabric', 'Self-tie wrap waist', 'V-neckline', 'Machine washable'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      deliveryCharge: 40,
      deliveryDays: 4,
      codAvailable: true,
      returnPolicyDays: 10
    },
    {
      id: 8,
      name: 'Silk Scarf Accessory',
      price: 99,
      mrp: 199,
      image: 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?auto=format&fit=crop&w=1000&q=90'
      ],
      category: 'Accessories',
      rating: 4.3,
      ratingCount: 154,
      isFavorite: false,
      quantity: 1,
      description:
        'A square silk scarf finished with hand-rolled edges. Wear it as a neck scarf, hair tie or bag accent.',
      highlights: ['100% silk', 'Hand-rolled edge', '70cm x 70cm', 'Dry clean only'],
      sizes: ['One Size'],
      deliveryCharge: 40,
      deliveryDays: 3,
      codAvailable: true,
      returnPolicyDays: 7
    },
    {
      id: 9,
      name: 'Tweed Jacket Set',
      price: 259,
      mrp: 519,
      image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1000&q=90',
        'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=1000&q=90'
      ],
      category: 'Sets',
      rating: 4.6,
      ratingCount: 402,
      isFavorite: false,
      quantity: 1,
      description:
        'A classic tweed two-piece — cropped jacket with gold-tone buttons, paired with a coordinating mini skirt.',
      highlights: ['Tweed-weave fabric', 'Cropped jacket + mini skirt', 'Gold-tone button detail', 'Dry clean only'],
      sizes: ['XS', 'S', 'M', 'L'],
      deliveryCharge: 0,
      deliveryDays: 5,
      codAvailable: true,
      returnPolicyDays: 14
    },
    {
      id: 10,
      name: 'Korean Ribbed Top',
      price: 129,
      mrp: 259,
      image: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1000&q=90',
        'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=90'
      ],
      category: 'Tops',
      rating: 4.5,
      ratingCount: 218,
      isFavorite: false,
      quantity: 1,
      description:
        'A fine-ribbed knit top with a close, second-skin fit. A wardrobe basic that layers cleanly under blazers and coats.',
      highlights: ['Ribbed knit fabric', 'Fitted silhouette', 'Crew neckline', 'Machine washable'],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      deliveryCharge: 40,
      deliveryDays: 3,
      codAvailable: true,
      returnPolicyDays: 10
    }
  ]);

  // ===== COMPUTED =====
  filteredProducts = computed(() => {
    const category = this.activeCategory();
    return this.products().filter(product => {
      return category === 'All' || product.category === category;
    });
  });

  constructor(private router: Router) {}

  // ===== METHODS =====
  toggleFavorite(product: Product, event: Event) {
    event.stopPropagation();
    product.isFavorite = !product.isFavorite;
    this.products.set([...this.products()]);
  }

  selectCategory(category: string) {
    this.activeCategory.set(category);
  }

  formatPrice(price: number): string {
    return '₹' + price.toLocaleString('en-IN');
  }

  getDiscount(product: Product): number {
    if (!product.mrp || product.mrp <= product.price) return 0;
    return Math.round(((product.mrp - product.price) / product.mrp) * 100);
  }

  openProduct(product: Product) {
    this.router.navigate(['/product', product.id]);
  }
}