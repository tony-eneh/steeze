export interface Design {
  id: string;
  designerId: string;
  title: string;
  description: string;
  basePrice: number;
  currency: string;
  category: string;
  gender?: string;
  estimatedDays?: number;
  isPublished: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
