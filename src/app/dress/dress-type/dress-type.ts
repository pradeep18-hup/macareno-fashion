import { Injectable, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';

// ---------- Service ----------
@Injectable({ providedIn: 'root' })
export class DressTypeService {
  private typesSubject = new BehaviorSubject<string[]>([
    'Shirt', 'T-Shirt', 'Jeans', 'Trousers', 'Skirt', 'Frock',
    'Kurti', 'Saree', 'Lehenga', 'Gown', 'Jacket', 'Shorts'
  ]);

  dressTypes$ = this.typesSubject.asObservable();

  // Returns false if the name already exists (case-insensitive)
  add(name: string): boolean {
    const trimmed = name.trim();
    const exists = this.typesSubject.value.some(
      t => t.toLowerCase() === trimmed.toLowerCase()
    );
    if (!trimmed || exists) return false;

    this.typesSubject.next([...this.typesSubject.value, trimmed]);
    // TODO: call the API here to save the type
    return true;
  }

  remove(name: string): void {
    this.typesSubject.next(this.typesSubject.value.filter(t => t !== name));
    // TODO: call the API here to delete the type
  }
}

// ---------- Component ----------
@Component({
  selector: 'app-dress-type',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dress-type.html',
  styleUrls: ['./dress-type.css']
})
export class DressType {
  private dressTypeService = inject(DressTypeService);

  dressTypes$ = this.dressTypeService.dressTypes$;

  nameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(30)]
  });

  error = '';

  add(): void {
    this.error = '';
    const value = this.nameControl.value.trim();

    if (!value) {
      this.error = 'Please enter a dress type name.';
      return;
    }

    const ok = this.dressTypeService.add(value);
    if (!ok) {
      this.error = 'That dress type already exists.';
      return;
    }

    this.nameControl.reset('');
  }

  remove(name: string): void {
    this.dressTypeService.remove(name);
  }
}