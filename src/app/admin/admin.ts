import { Component, OnInit, inject, ChangeDetectorRef, signal } from '@angular/core';
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
  private cdr = inject(ChangeDetectorRef);

  admins: AdminResponse[] = [];
  loading = true;
  loadError = '';

  adminForm: FormGroup;
  showForm = false;
  showPassword = false;
  error = '';
  submitting = false;

  /** 👇 Delete confirmation modal state */
  readonly showDeleteConfirm = signal(false);
  readonly deleteTarget = signal<AdminResponse | null>(null);

  /** 👇 Toast feedback */
  readonly toastMessage = signal('');
  readonly toastKind = signal<'success' | 'error'>('success');
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.adminForm = this.fb.group(
      {
        name:            ['', [Validators.required, Validators.maxLength(30)]],
        email:           ['', [Validators.required, Validators.email]],
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
    this.cdr.detectChanges();

    this.adminService.getAll().subscribe({
      next: (list) => {
        this.admins = Array.isArray(list) ? [...list] : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.loadError = err?.error?.error
          || err?.message
          || 'Failed to load admins.';
        this.admins = [];
        this.cdr.detectChanges();
      }
    });
  }

  reload(): void {
    this.loadAdmins();
  }

  // ============== Modal (Add) ==============
  openForm(): void {
    this.showForm = true;
    this.cdr.detectChanges();
  }

  closeForm(): void {
    this.showForm = false;
    this.showPassword = false;
    this.error = '';
    this.adminForm.reset({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
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
      email: value.email.trim().toLowerCase(),
      password: value.password,
      confirmPassword: value.confirmPassword
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.closeForm();
        this.loadAdmins();
        this.showToast('Admin created successfully.', 'success');
      },
      error: (err) => {
        this.submitting = false;
        this.error = err?.error?.error || 'Failed to create admin.';
        this.cdr.detectChanges();
        this.showToast(this.error, 'error');
      }
    });
  }

  // ============== Delete (custom modal) ==============
  /** Called by the Delete button on a row — opens the confirm modal. */
  openDeleteConfirm(admin: AdminResponse): void {
    this.deleteTarget.set(admin);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
    this.deleteTarget.set(null);
  }

  /** Called when user confirms in the modal. */
  confirmDelete(): void {
    const admin = this.deleteTarget();
    if (!admin) return;

    this.showDeleteConfirm.set(false);
    this.deleteTarget.set(null);

    this.adminService.remove(admin.id).subscribe({
      next: () => {
        this.loadAdmins();
        this.showToast(`Admin "${admin.name}" has been deleted.`, 'success');
      },
      error: (err) => {
        const msg = err?.error?.error || 'Failed to delete.';
        this.error = msg;
        this.cdr.detectChanges();
        this.showToast(msg, 'error');
      }
    });
  }

  // ============== Toast ==============
  private showToast(message: string, kind: 'success' | 'error' = 'success'): void {
    this.toastMessage.set(message);
    this.toastKind.set(kind);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage.set(''), 3000);
  }

  // ============== Helpers ==============
  isInvalid(controlName: string): boolean {
    const c = this.adminForm.get(controlName);
    return !!c && c.touched && c.invalid;
  }
}