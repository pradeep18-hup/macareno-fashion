import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface Courier {
  id: number;
  companyName: string;
  phoneNumber: string;
}

@Component({
  selector: 'app-courier-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './courier.html',
  styleUrl: './courier.css'
})
export class CourierForm {
  couriers: Courier[] = [];
  private nextId = 1;

  form!: ReturnType<FormBuilder['group']>;   // declare only

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      companyName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]]
    });
  }

  submit() {
    if (this.form.invalid) return;
    const { companyName, phoneNumber } = this.form.value;
    this.couriers.push({ id: this.nextId++, companyName: companyName!, phoneNumber: phoneNumber! });
    this.form.reset();
  }

  remove(id: number) {
    this.couriers = this.couriers.filter(c => c.id !== id);
  }
}