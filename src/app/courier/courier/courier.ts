import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Courier, CourierService } from '../../services/courier.service';


@Component({
  selector: 'app-courier-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './courier.html',
  styleUrl: './courier.css'
})
export class CourierForm implements OnInit {
  couriers: Courier[] = [];
  editingId: number | null = null;
  errorMessage = '';

  form!: ReturnType<FormBuilder['group']>;

  constructor(private fb: FormBuilder, private api: CourierService) {
    this.form = this.fb.group({
      companyName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
    });
  }

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.getAll().subscribe({
      next: data => (this.couriers = data),
      error: () => (this.errorMessage = 'Could not load couriers')
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.errorMessage = '';

    const payload = {
      companyName: this.form.value.companyName!,
      phoneNumber: this.form.value.phoneNumber!
    };

    const request$ = this.editingId
      ? this.api.update(this.editingId, payload)
      : this.api.create(payload);

    request$.subscribe({
      next: () => {
        this.cancelEdit();
        this.load();
      },
      error: err => (this.errorMessage = err.error?.error || 'Something went wrong')
    });
  }

  edit(c: Courier) {
    this.editingId = c.id;
    this.errorMessage = '';
    this.form.patchValue({ companyName: c.companyName, phoneNumber: c.phoneNumber });
  }

  cancelEdit() {
    this.editingId = null;
    this.form.reset();
  }

  remove(id: number) {
    if (!confirm('Delete this courier?')) return;
    this.api.delete(id).subscribe({
      next: () => {
        if (this.editingId === id) this.cancelEdit();
        this.load();
      },
      error: err => (this.errorMessage = err.error?.error || 'Delete failed')
    });
  }
}