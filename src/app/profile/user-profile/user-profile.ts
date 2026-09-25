import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface PersonalInfo {
  name: string;
  email: string;
  mobile: string;
}

interface Address {
  line: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  type: 'Home' | 'Work' | 'Other';
}

interface PasswordForm {
  current: string;
  new: string;
  confirm: string;
}

type ProfileTab = 'profile' | 'address' | 'password';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css'
})
export class UserProfile {
  activeTab: ProfileTab = 'profile';

  editingProfile = false;
  editingAddress = false;

  /* ---- already-filled account data ---- */
  personalInfo: PersonalInfo = {
    name: 'Arun Kumar',
    email: 'arun.kumar@example.com',
    mobile: '+91 98765 43210'
  };

  address: Address = {
    line: '12, Kamaraj Street, Anna Nagar',
    landmark: 'Near Anna Nagar Tower Park',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600040',
    type: 'Home'
  };

  passwordForm: PasswordForm = {
    current: '',
    new: '',
    confirm: ''
  };

  passwordError = '';
  passwordSuccess = false;

  get initials(): string {
    return this.personalInfo.name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  setTab(tab: ProfileTab): void {
    this.activeTab = tab;
    this.passwordError = '';
    this.passwordSuccess = false;
  }

  saveProfile(): void {
    // TODO: call API to persist personalInfo
    this.editingProfile = false;
  }

  saveAddress(): void {
    // TODO: call API to persist address
    this.editingAddress = false;
  }

  changePassword(): void {
    this.passwordError = '';
    this.passwordSuccess = false;

    if (!this.passwordForm.current || !this.passwordForm.new || !this.passwordForm.confirm) {
      this.passwordError = 'Please fill in all password fields.';
      return;
    }

    if (this.passwordForm.new.length < 8) {
      this.passwordError = 'New password must be at least 8 characters.';
      return;
    }

    if (this.passwordForm.new !== this.passwordForm.confirm) {
      this.passwordError = 'New password and confirmation do not match.';
      return;
    }

    // TODO: call API to update password
    this.passwordSuccess = true;
    this.passwordForm = { current: '', new: '', confirm: '' };
  }
}