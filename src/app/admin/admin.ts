import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';

export interface AdminUser {
  id: number;
  name: string;
  createdAt: Date;
}

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin {
  admins: AdminUser[] = [];
  private nextId = 1;

  adminForm: FormGroup;
  showForm = false;
  showPassword = false;
  error = '';

  constructor(private fb: FormBuilder) {
    this.adminForm = this.fb.group(
      {
        name:            ['', [Validators.required, Validators.maxLength(30)]],
        password:        ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required]
      },
      { validators: passwordsMatch }
    );
  }

  openForm(): void {
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.showPassword = false;
    this.error = '';
    this.adminForm.reset({ name: '', password: '', confirmPassword: '' });
  }

  onSubmit(): void {
    this.error = '';
    this.adminForm.markAllAsTouched();
    if (this.adminForm.invalid) return;

    const name = (this.adminForm.value.name as string).trim();

    const exists = this.admins.some(a => a.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      this.error = `"${name}" already exists`;
      return;
    }

    this.admins = [
      ...this.admins,
      { id: this.nextId++, name, createdAt: new Date() }
    ];

    this.closeForm();
  }

  remove(admin: AdminUser): void {
    if (confirm(`Delete admin "${admin.name}"?`)) {
      this.admins = this.admins.filter(a => a.id !== admin.id);
    }
  }

  isInvalid(controlName: string): boolean {
    const c = this.adminForm.get(controlName);
    return !!c && c.touched && c.invalid;
  }
}