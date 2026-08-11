export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Rating {
  id: string;
  orderId: string;
  raterId: string;
  rateeId: string;
  score: number;
  comment?: string | null;
  createdAt: string;
}

export interface RatingPayload {
  score: number;
  comment?: string;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  reason: string;
  status: string;
  courierFee?: number | null;
  createdAt: string;
  order?: {
    orderNumber: string;
    design?: { title?: string };
  };
}
