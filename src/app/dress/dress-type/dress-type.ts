import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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