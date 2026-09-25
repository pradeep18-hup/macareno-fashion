// login.component.ts
import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = signal('');
  password = signal('');
  rememberMe = signal(false);
  showPassword = signal(false);
  loading = signal(false);
  errorMessage = signal('');

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  onSubmit(): void {
    this.errorMessage.set('');

    if (!this.email() || !this.password()) {
      this.errorMessage.set('Please enter your email and password.');
      return;
    }

    this.loading.set(true);

    // TODO: replace with real auth call
    setTimeout(() => {
      this.loading.set(false);
    }, 1200);
  }

  continueWithGoogle(): void {
    // TODO: wire up Google OAuth
  }

  continueWithApple(): void {
    // TODO: wire up Apple OAuth
  }
}