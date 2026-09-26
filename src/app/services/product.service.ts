import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SizeOption {
  id: number;
  sizeType: 'alphabet' | 'number';
  label: string;
  displayOrder: number;
}

export interface DressType {
  id: number;
  name: string;
}

export interface ProductResponse {
  id: number;
  dressName: string;
  dressTypeId: number;
  dressTypeName: string;
  price: number;
  offerPercentage?: number;
  offerPrice: number;
  sizeType: string;
  totalQty: number;
  sizes: { size: string; qty: number }[];
  photoUrls: string[];
}

@Injectable({ providedIn: 'root' })
export class ProductService {

  private readonly baseUrl = 'http://localhost:8080/api';
  private http = inject(HttpClient);

  getDressTypes(): Observable<DressType[]> {
    return this.http.get<DressType[]>(`${this.baseUrl}/dress-types`);
  }

  getSizes(type?: 'alphabet' | 'number'): Observable<SizeOption[]> {
    const url = type
      ? `${this.baseUrl}/sizes?type=${type}`
      : `${this.baseUrl}/sizes`;
    return this.http.get<SizeOption[]>(url);
  }

  getProducts(): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(`${this.baseUrl}/products`);
  }

  createProduct(formData: FormData): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(`${this.baseUrl}/products`, formData);
  }

  deleteProduct(id: number): Observable<{ message: string; id: number }> {
    return this.http.delete<{ message: string; id: number }>(
      `${this.baseUrl}/products/${id}`
    );
  }
}