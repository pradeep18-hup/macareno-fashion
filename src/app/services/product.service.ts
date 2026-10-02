import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment.development';

export interface ProductSizeDto {
  size: string;
  qty: number;
}

export interface ProductResponse {
  id: number;
  dressName: string;
  dressTypeId: number;
  dressTypeName: string;
  price: number;
  offerPercentage?: number;
  offerPrice?: number;
  sizeType: string;
  totalQty: number;
  sizes: { size: string; qty: number }[];
  photoUrls: string[];
  soldOutSizes?: string[];
  archivedAt?: string | null;    // 👈 NEW
}

/** Payload for editing an existing product (no photo re-upload). */
export interface ProductUpdateRequest {
  dressName: string;
  dressTypeId: number;
  price: number;
  offerPercentage?: number | null;
  offerPrice: number;
  sizeType: string;
  totalQty: number;
  sizes: ProductSizeDto[];
}

export interface DressType {
  id: number;
  name: string;
}

export interface SizeOption {
  id: number;
  sizeType: 'alphabet' | 'number';
  label: string;
  displayOrder: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {

  private readonly base = `${environment.baseUrl}`;
  private readonly productsApi = `${this.base}/api/products`;
  private readonly dressTypesApi = `${this.base}/api/dress-types`;
  private readonly sizesApi = `${this.base}/api/sizes`;

  private http = inject(HttpClient);

  // ---------- Products ----------
  getAll(): Observable<ProductResponse[]> {
    return this.http.get<ProductResponse[]>(this.productsApi);
  }

  getById(id: number): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.productsApi}/${id}`);
  }

  createProduct(formData: FormData): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.productsApi, formData);
  }

  update(id: number, payload: ProductUpdateRequest): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${this.productsApi}/${id}`, payload);
  }
    // Edit with same multipart format as create (photos optional)
  updateProduct(id: number, formData: FormData): Observable<ProductResponse> {
    return this.http.put<ProductResponse>(`${this.productsApi}/${id}`, formData);
  }

  deleteProduct(id: number): Observable<{ message: string; id: number }> {
    return this.http.delete<{ message: string; id: number }>(
      `${this.productsApi}/${id}`
    );
  }

  // ---------- Dress Types ----------
  getDressTypes(): Observable<DressType[]> {
    return this.http.get<DressType[]>(this.dressTypesApi);
  }

  // ---------- Sizes ----------
  getSizes(type: 'alphabet' | 'number'): Observable<SizeOption[]> {
    return this.http.get<SizeOption[]>(`${this.sizesApi}?type=${type}`);
  }

  // ---------- Utility ----------
  imageUrl(path: string | undefined | null): string {
    if (!path) return 'assets/placeholder-product.jpg';
    if (path.startsWith('http')) return path;
    return this.base + path;
  }
}