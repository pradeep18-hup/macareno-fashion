import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  fullName = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  showPassword = signal(false);
  loading = signal(false);
  errorMessage = signal<string | null>(null);

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

    // Caller is responsible for clearing `loading` once the request settles.
  }
}