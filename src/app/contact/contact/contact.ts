import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

interface ContactForm {
  name: string;
  phone: string;
  email: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.css'
})
export class ContactComponent {
  readonly lat = 8.242975;
  readonly lng = 77.324607;

  // Your WhatsApp number with country code, no + , no spaces
  readonly whatsappNumber = '919487987731';
  readonly phoneNumber = '+91 94879 87731';
  readonly phoneHref = 'tel:+91 94879 87731';
  readonly email = 'fashionsmacarena@gmail.com';
  readonly emailHref = 'mailto:fashionsmacarena@gmail.com';
  readonly addressShort = 'Perumal kovil road thuckaly, Tamil Nadu';

  readonly businessHours = [
    { day: 'Mon – Sat', time: '9:00 AM – 6:00 PM' },
    { day: 'Sunday', time: '11:00 AM – 6:00 PM' }
  ];

  mapEmbedUrl: SafeResourceUrl;

  formData: ContactForm = {
    name: '',
    phone: '',
    email: '',
    message: ''
  };

  submitted = false;

  constructor(private sanitizer: DomSanitizer) {
    const url = `https://maps.google.com/maps?q=${this.lat},${this.lng}&z=16&output=embed`;
    this.mapEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  openDirections(): void {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${this.lat},${this.lng}`;
    window.open(url, '_blank');
  }

  sendToWhatsapp(form: NgForm): void {
    this.submitted = true;
    if (form.invalid) return;

    const { name, phone, email, message } = this.formData;
    const lines = [
      `*New Enquiry - Macarena Fashions*`,
      `Name: ${name}`,
      `Phone: ${phone}`,
      email ? `Email: ${email}` : null,
      `Message: ${message}`
    ].filter(Boolean) as string[];

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/${this.whatsappNumber}?text=${text}`, '_blank');

    form.resetForm();
    this.formData = { name: '', phone: '', email: '', message: '' };
    this.submitted = false;
  }
}