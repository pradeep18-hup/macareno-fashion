import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';

interface Profile {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt?: string;
}

interface PasswordForm {
  current: string;
  new: string;
  confirm: string;
}

type ProfileTab = 'profile' | 'password';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfile implements OnInit {

  private http = inject(HttpClient);
  private authService = inject(AuthService);

  userType: 'customer' | 'admin' | null = null;

  private get apiBase(): string {
    return this.userType === 'admin'
      ? 'http://localhost:8080/api/admin-profile'
      : 'http://localhost:8080/api/profile';
  }

  activeTab: ProfileTab = 'profile';

  profile: Profile = {
    id: 0,
    fullName: '',
    email: '',
    phoneNumber: ''
  };

  editing = false;
  loading = signal(true);
  saving = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  passwordForm: PasswordForm = { current: '', new: '', confirm: '' };
  passwordError = '';
  passwordSuccess = false;
  changingPassword = false;

  get isAdmin(): boolean {
    return this.userType === 'admin';
  }

  get initials(): string {
    if (!this.profile.fullName) return '?';
    return this.profile.fullName
      .split(' ')
      .map(p => p.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  ngOnInit(): void {
    const user = this.authService.getUser();
    this.userType = user?.userType ?? 'customer';

    if (user) {
      this.profile.id = user.id;
      this.profile.fullName = user.name || '';
      this.profile.email = user.email || '';
    }

    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.http.get<any>(this.apiBase).subscribe({
      next: (p) => {
        this.profile = {
          id: p.id,
          fullName: p.fullName ?? p.name ?? '',
          email: p.email ?? '',
          phoneNumber: p.phoneNumber ?? '',
          createdAt: p.createdAt
        };
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.error || 'Failed to load profile.');
      }
    });
  }

  reload(): void { this.load(); }

  setTab(tab: ProfileTab): void {
    this.activeTab = tab;
    this.passwordError = '';
    this.passwordSuccess = false;
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  save(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.saving.set(true);

    const body = this.isAdmin
      ? { name: this.profile.fullName.trim(), email: this.profile.email.trim().toLowerCase() }
      : {
          fullName: this.profile.fullName.trim(),
          email: this.profile.email.trim().toLowerCase(),
          phoneNumber: this.profile.phoneNumber.trim()
        };

    this.http.put<any>(this.apiBase, body).subscribe({
      next: (updated) => {
        this.profile = {
          id: updated.id,
          fullName: updated.fullName ?? updated.name ?? '',
          email: updated.email ?? '',
          phoneNumber: updated.phoneNumber ?? '',
          createdAt: updated.createdAt
        };
        this.editing = false;
        this.saving.set(false);
        this.successMessage.set('Profile updated successfully.');
        this.autoHide();
        this.updateLocalStorage();
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMessage.set(err?.error?.error || 'Failed to update profile.');
      }
    });
  }

  cancel(): void {
    this.editing = false;
    this.errorMessage.set('');
    this.load();
  }

  changePassword(): void {
    this.passwordError = '';
    this.passwordSuccess = false;

    if (!this.passwordForm.current || !this.passwordForm.new || !this.passwordForm.confirm) {
      this.passwordError = 'Please fill in all password fields.';
      return;
    }
    if (this.passwordForm.new.length < 6) {
      this.passwordError = 'New password must be at least 6 characters.';
      return;
    }
    if (this.passwordForm.new !== this.passwordForm.confirm) {
      this.passwordError = 'New password and confirmation do not match.';
      return;
    }

    this.changingPassword = true;

    this.http.put<{ message: string }>(`${this.apiBase}/password`, {
      currentPassword: this.passwordForm.current,
      newPassword: this.passwordForm.new,
      confirmPassword: this.passwordForm.confirm
    }).subscribe({
      next: () => {
        this.changingPassword = false;
        this.passwordSuccess = true;
        this.passwordForm = { current: '', new: '', confirm: '' };
        setTimeout(() => this.passwordSuccess = false, 3000);
      },
      error: (err) => {
        this.changingPassword = false;
        this.passwordError = err?.error?.error || 'Failed to update password.';
      }
    });
  }

  private autoHide(): void {
    setTimeout(() => this.successMessage.set(''), 3000);
  }

  private updateLocalStorage(): void {
    const raw = localStorage.getItem('macarena_user');
    if (!raw) return;
    try {
      const user = JSON.parse(raw);
      user.name = this.profile.fullName;
      user.email = this.profile.email;
      localStorage.setItem('macarena_user', JSON.stringify(user));
    } catch { /* ignore */ }
  }
}