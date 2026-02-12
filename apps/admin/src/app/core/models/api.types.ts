export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: PaginationMeta;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalDesigners: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
}

export type OrdersStats = Record<string, number>;

export interface PaymentsOverview {
  totalEscrow: number;
  totalReleased: number;
  totalRefunded: number;
  pendingReleaseCount: number;
}

export interface DesignerProfileSummary {
  id: string;
  businessName: string;
  isVerified: boolean;
  averageRating: number | null;
}

export interface UserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  designerProfile?: DesignerProfileSummary | null;
}

export interface DesignerSummary {
  id: string;
  businessName: string;
  isVerified: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    isActive: boolean;
  };
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  totalPrice: number;
  createdAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  designer: {
    id: string;
    businessName: string;
  };
}

export interface ReturnRequestSummary {
  id: string;
  status: string;
  reason: string | null;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    totalPrice: number;
  };
  customer: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: string;
  updatedAt: string;
  updatedBy?: string | null;
}

export interface RatingSummary {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  raterId: string;
}
