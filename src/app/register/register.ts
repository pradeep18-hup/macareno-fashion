import { Component, EventEmitter, Output, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface RegisterDetails {
  fullName: string;
  email: string;
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

  // Swap the default for your own asset path, e.g. 'assets/images/register-hero.jpg'
  heroImage = input('assets/images/register-hero.jpg');

  fullName = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  showPassword = signal(false);
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(private router: Router) {}

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    if (!this.fullName().trim() || !this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('Fill in every field to create your account.');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.errorMessage.set('Passwords don\'t match.');
      return;
    }

    this.loading.set(true);

    this.register.emit({
      fullName: this.fullName().trim(),
      email: this.email().trim(),
      password: this.password(),
    });

    // TODO: replace with your real auth call.
    setTimeout(() => {
      this.loading.set(false);
      this.router.navigate(['/home']);
    }, 400);
  }
}