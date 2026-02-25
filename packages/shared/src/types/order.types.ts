export enum OrderStatus {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  PAID = 'PAID',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CONFIRMED = 'CONFIRMED',
  AUTO_CONFIRMED = 'AUTO_CONFIRMED',
  RETURN_REQUESTED = 'RETURN_REQUESTED',
  RETURN_PICKUP = 'RETURN_PICKUP',
  RETURN_IN_TRANSIT = 'RETURN_IN_TRANSIT',
  RETURNED = 'RETURNED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  designerId: string;
  designId: string;
  deliveryAddressId: string;
  status: OrderStatus;
  basePrice: number;
  fabricPriceAdjustment: number;
  sizePriceAdjustment: number;
  addOnsTotal: number;
  deliveryFee: number;
  totalPrice: number;
  platformCommission: number;
  currency: string;
  measurementSnapshot?: any;
  sizeLabel?: string;
  specialInstructions?: string;
  createdAt: Date;
  updatedAt: Date;
}
