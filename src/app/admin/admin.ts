import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { AdminService, AdminResponse } from '../services/admin.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm  = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {

  private fb = inject(FormBuilder);
  private adminService = inject(AdminService);
  private cdr = inject(ChangeDetectorRef);      // ✅ ADDED

  admins: AdminResponse[] = [];
  loading = true;
  loadError = '';

  adminForm: FormGroup;
  showForm = false;
  showPassword = false;
  error = '';
  submitting = false;

  constructor() {
    this.adminForm = this.fb.group(
      {
        name:            ['', [Validators.required, Validators.maxLength(30)]],
        password:        ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: passwordsMatch }
    );
  }

  ngOnInit(): void {
    this.loadAdmins();
  }

  // ============== Load ==============
  private loadAdmins(): void {
    this.loading = true;
    this.loadError = '';
    this.cdr.detectChanges();                    // ✅ render loading state

    this.adminService.getAll().subscribe({
      next: (list) => {
        this.admins = Array.isArray(list) ? [...list] : [];
        this.loading = false;
        this.cdr.detectChanges();                // ✅ force table to render
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.error
          || err?.message
          || 'Failed to load admins.';
        this.admins = [];
        this.cdr.detectChanges();                // ✅ force error to render
      }
    });
  }

  reload(): void {
    this.loadAdmins();
  }

  // ============== Modal ==============
  openForm(): void {
    this.showForm = true;
    this.cdr.detectChanges();
  }

  closeForm(): void {
    this.showForm = false;
    this.showPassword = false;
    this.error = '';
    this.adminForm.reset({ name: '', password: '', confirmPassword: '' });
    this.cdr.detectChanges();
  }

  // ============== Submit ==============
  onSubmit(): void {
    this.error = '';
    this.adminForm.markAllAsTouched();
    if (this.adminForm.invalid) return;

    const value = this.adminForm.value;
    this.submitting = true;

    this.adminService.create({
      name: value.name.trim(),
      password: value.password,
      confirmPassword: value.confirmPassword
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.closeForm();
        this.loadAdmins();
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.error || 'Failed to create admin.';
        this.cdr.detectChanges();
      }
    });
  }

  // ============== Delete ==============
  remove(admin: AdminResponse): void {
    if (!confirm(`Delete admin "${admin.name}"?`)) return;

    this.adminService.remove(admin.id).subscribe({
      next: () => this.loadAdmins(),
      error: (err) => {
        this.error = err?.error?.error || 'Failed to delete.';
        this.cdr.detectChanges();
      }
    });
  }

  // ============== Helpers ==============
  isInvalid(controlName: string): boolean {
    const c = this.adminForm.get(controlName);
    return !!c && c.touched && c.invalid;
  }
}