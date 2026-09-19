import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  @Output() login = new EventEmitter<LoginCredentials>();

  email = signal('');
  password = signal('');
  rememberMe = signal(false);
  showPassword = signal(false);
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  constructor(private router: Router) {}

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    if (!this.email().trim() || !this.password().trim()) {
      this.errorMessage.set('Enter your email and password to continue.');
      return;
    }

    this.loading.set(true);

    this.login.emit({
      email: this.email().trim(),
      password: this.password(),
      rememberMe: this.rememberMe(),
    });

    // TODO: replace with your real auth call. This simulates success
    // so the redirect works today — swap it for your service's response.
    setTimeout(() => {
      this.loading.set(false);
      this.router.navigate(['/home']);
    }, 400);
  }
}