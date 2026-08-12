/** Mirrors the shape returned by GET /designers/me/earnings. */
export interface DesignerEarnings {
  totalEarnings: number;
  totalCommission: number;
  totalReturnFees: number;
  netEarnings: number;
  pendingEarnings: number;
  availableBalance: number;
  totalCompletedOrders: number;
  averageRating: number;
}

export interface DesignerOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  currency: string;
  createdAt: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
  };
  design?: {
    id: string;
    title: string;
    images?: Array<{ url: string }>;
  };
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
  };
}

export interface DesignerProfilePayload {
  businessName?: string;
  bio?: string;
  shopAddress?: string;
  shopCity?: string;
  shopState?: string;
}

export interface ManagedDesign {
  id: string;
  title: string;
  description: string;
  basePrice: number;
  currency: string;
  category: string;
  gender?: string | null;
  estimatedDays?: number | null;
  isPublished: boolean;
  isActive: boolean;
  images?: Array<{ id: string; url: string; isPrimary: boolean }>;
}

export interface DesignPayload {
  title: string;
  description: string;
  basePrice: number;
  category: string;
  currency?: string;
  gender?: string;
  estimatedDays?: number;
  isPublished?: boolean;
}

export interface UploadedAsset {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface PublicDesigner {
  id: string;
  businessName: string;
  slug: string;
  bio?: string | null;
  shopCity?: string | null;
  shopState?: string | null;
  averageRating: number;
  totalCompletedOrders: number;
  isVerified: boolean;
}
