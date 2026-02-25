import { DesignSummary } from './design.models';

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  currency: string;
  createdAt: string;
  design: Pick<DesignSummary, 'title' | 'imageUrl' | 'designerName'>;
}

export interface OrderDetail extends OrderSummary {
  deliveryAddress: string;
  sizeLabel?: string;
  specialInstructions?: string;
  timeline: Array<{
    status: string;
    note?: string;
    createdAt: string;
  }>;
}
