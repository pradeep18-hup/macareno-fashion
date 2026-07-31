import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-location-popup',
  standalone: true,
  imports: [],
  templateUrl: './popup.html',
  styleUrl: './popup.css',
})
export class PopupComponent {
  readonly isOpen = signal(true);
  readonly locationError = signal('');

  // Shop location (origin)
  private readonly shopLat = 8.242975;
  private readonly shopLng = 77.324607;

  // Contact links
  readonly phoneHref = 'tel:+91 94879 87731';
  readonly instagramUrl = 'https://instagram.com/your_username'; // <-- replace with your actual Instagram username

  closePopup(): void {
    this.isOpen.set(false);
  }

  viewLocation(): void {
    this.locationError.set('');

    if (!navigator.geolocation) {
      this.openShopLocationOnly();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const customerLat = position.coords.latitude;
        const customerLng = position.coords.longitude;
        this.openRoute(customerLat, customerLng);
      },
      () => {
        this.openShopLocationOnly();
      },
      {
        enableHighAccuracy: false,
        timeout: 3000,
        maximumAge: 60000,
      }
    );
  }

  private openRoute(customerLat: number, customerLng: number): void {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${this.shopLat},${this.shopLng}&destination=${customerLat},${customerLng}`;
    window.open(mapsUrl, '_blank');
    this.closePopup();
  }

  private openShopLocationOnly(): void {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${this.shopLat},${this.shopLng}`;
    window.open(mapsUrl, '_blank');
    this.closePopup();
  }
}