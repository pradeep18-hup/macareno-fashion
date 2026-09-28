export interface SizeQty {
  size: string;
  qty: number;
}

export interface Product {
  id: number;
  dressName: string;
  dressTypeId: number;
  dressTypeName?: string;
  price: number;
  offerPercentage?: number | null;
  offerPrice: number;
  sizeType: string;
  totalQty: number;
  sizes: SizeQty[];
  photoUrls?: string[];
}

/** Payload for updating an existing product (no photo re-upload). */
export interface ProductUpdateRequest {
  dressName: string;
  dressTypeId: number;
  price: number;
  offerPercentage?: number | null;
  offerPrice: number;
  sizeType: string;
  totalQty: number;
  sizes: SizeQty[];
}