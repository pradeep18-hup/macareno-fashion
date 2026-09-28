import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';   // 👈 unga path

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const p = group.get('newPassword')?.value;
  const c = group.get('confirmPassword')?.value;
  return p && c && p !== c ? { mismatch: true } : null;
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  step = signal<1 | 2 | 3>(1);
  loading = signal(false);
  error = signal('');
  info = signal('');

  emailForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  otpForm = this.fb.group({
    otp: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  passForm = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: passwordsMatch }
  );

  private get email(): string {
    return this.emailForm.value.email!.trim();
  }

  // Step 1: OTP anuppu
  sendOtp(): void {
    if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    this.auth.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.info.set(`OTP sent to ${this.email}`);
        this.step.set(2);
      },
      
  error: (err) => {
  this.loading.set(false);
  console.error('forgot-password failed', err);
  this.error.set(err?.error?.error || `Could not send OTP (status ${err?.status}).`);
},
    });
  }

  

  resendOtp(): void {
    this.loading.set(true);
    this.error.set('');
    this.auth.forgotPassword(this.email).subscribe({
      next: () => { this.loading.set(false); this.info.set('New OTP sent.'); },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error || 'Could not resend OTP.');
      },
    });
  }

  // Step 2: OTP verify
  verifyOtp(): void {
    if (this.otpForm.invalid) { this.otpForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    this.auth.verifyOtp(this.email, this.otpForm.value.otp!).subscribe({
      next: () => {
        this.loading.set(false);
        this.info.set('');
        this.step.set(3);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.error || 'Invalid OTP.');
      },
    });
  }

  // Step 3: New password
  resetPassword(): void {
    if (this.passForm.invalid) { this.passForm.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const { newPassword, confirmPassword } = this.passForm.value;
    this.auth
      .resetPassword(this.email, this.otpForm.value.otp!, newPassword!, confirmPassword!)
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.info.set('Password changed! Redirecting to login…');
          setTimeout(() => this.router.navigate(['/login']), 1500);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.error?.error || 'Could not reset password.');
        },
      });
  }

  back(): void {
    this.error.set('');
    this.info.set('');
    this.step.set(this.step() === 3 ? 2 : 1);
  }
}