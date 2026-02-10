export enum PaymentStatus {
  PENDING = 'PENDING',
  HELD_IN_ESCROW = 'HELD_IN_ESCROW',
  RELEASED = 'RELEASED',
  REFUNDED = 'REFUNDED',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
}

export enum TransactionType {
  ESCROW_HOLD = 'ESCROW_HOLD',
  ESCROW_RELEASE = 'ESCROW_RELEASE',
  REFUND = 'REFUND',
  COMMISSION_DEDUCTION = 'COMMISSION_DEDUCTION',
  RETURN_FEE_DEDUCTION = 'RETURN_FEE_DEDUCTION',
  WITHDRAWAL = 'WITHDRAWAL',
}

export interface Payment {
  id: string;
  orderId: string;
  externalRef?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paidAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
