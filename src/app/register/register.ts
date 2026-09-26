import { Component, EventEmitter, Output, input, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CustomerService } from '../services/customer.service';

export interface RegisterDetails {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {

  @Output() register = new EventEmitter<RegisterDetails>();

  // Optional hero image input (still supported if a parent passes one)
  heroImage = input('assets/images/register-hero.jpg');

  private customerService = inject(CustomerService);
  private router = inject(Router);

  // ---------- Signals ----------
  fullName = signal('');
  email = signal('');
  phoneNumber = signal('');
  password = signal('');
  confirmPassword = signal('');
  showPassword = signal(false);
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  // ---------- Submit ----------
  onSubmit(): void {
    this.errorMessage.set(null);

    const fullName = this.fullName().trim();
    const email = this.email().trim().toLowerCase();
    const phone = this.phoneNumber().trim();
    const password = this.password();
    const confirm = this.confirmPassword();

    // ---- Client-side validation ----
    if (!fullName || !email || !phone || !password || !confirm) {
      this.errorMessage.set('Fill in every field to create your account.');
      return;
    }

    if (!/^[0-9]{10,15}$/.test(phone)) {
      this.errorMessage.set('Phone number must be 10 to 15 digits.');
      return;
    }

    if (password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirm) {
      this.errorMessage.set("Passwords don't match.");
      return;
    }

    this.loading.set(true);

    // Emit for optional parent listeners
    this.register.emit({ fullName, email, phoneNumber: phone, password });

    // ---- Send to backend ----
    this.customerService.register({
      fullName,
      email,
      phoneNumber: phone,
      password,
      confirmPassword: confirm
    }).subscribe({
      next: (res) => {
        this.loading.set(false);
        console.log('Registered:', res);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(
          err?.error?.error || 'Registration failed. Please try again.'
        );
      }
    });
  }
}