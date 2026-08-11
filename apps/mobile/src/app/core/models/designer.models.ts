export interface DesignerEarnings {
  totalEarned: number;
  pendingEscrow: number;
  totalDeductions: number;
  currency: string;
  transactions?: Array<{
    id: string;
    type: string;
    amount: number;
    description?: string | null;
    createdAt: string;
  }>;
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
