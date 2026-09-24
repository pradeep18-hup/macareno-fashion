import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
interface Courier {
  id: number;
  companyName: string;
  phoneNumber: string;
}

interface DeliveryCharge {
  id: number;
  courierName: string;
  weightKg: number;
  amount: number;
}

@Component({
  selector: 'app-delivery-charge-form',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './delivery-charge-form.html',
  styleUrl: './delivery-charge-form.css'
})
export class DeliveryChargeForm {
  private fb = inject(FormBuilder);

  couriers: Courier[] = [
    { id: 1, companyName: 'DTDC', phoneNumber: '9876543210' },
    { id: 2, companyName: 'BlueDart', phoneNumber: '9123456780' }
  ];

  charges: DeliveryCharge[] = [];
  private nextId = 1;

  form = this.fb.group({
    courierId: [null as number | null, Validators.required],
    weightKg: [null, [Validators.required, Validators.min(0.1)]],
    amount: [null, [Validators.required, Validators.min(0)]]
  });

  submit() {
    // ... same as before
  }

  remove(id: number) {
    // ... same as before
  }
}