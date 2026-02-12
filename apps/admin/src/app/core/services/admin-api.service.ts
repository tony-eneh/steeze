import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import {
  DashboardStats,
  OrdersStats,
  PaymentsOverview,
  PaginationMeta,
  PlatformSetting,
  UserSummary,
  DesignerSummary,
  OrderSummary,
  ReturnRequestSummary,
  RatingSummary
} from '../models/api.types';

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  constructor(private api: ApiService) {}

  getDashboardStats(): Observable<DashboardStats> {
    return this.api.getData('admin/dashboard');
  }

  getOrdersStats(): Observable<OrdersStats> {
    return this.api.getData('admin/orders/stats');
  }

  getPaymentsOverview(): Observable<PaymentsOverview> {
    return this.api.getData('admin/payments/overview');
  }

  listUsers(role?: string, page = 1, limit = 20): Observable<{ data: UserSummary[]; meta: PaginationMeta }> {
    return this.api
      .getData<{ data: UserSummary[]; meta: PaginationMeta }>('admin/users', {
        role,
        page,
        limit
      })
      .pipe(map((response) => ({ data: response.data, meta: response.meta })));
  }

  updateUserStatus(userId: string, isActive: boolean): Observable<UserSummary> {
    return this.api.patchData(`admin/users/${userId}/status`, { isActive });
  }

  listDesigners(verified?: boolean, page = 1, limit = 20): Observable<{ data: DesignerSummary[]; meta: PaginationMeta }> {
    return this.api
      .getData<{ data: DesignerSummary[]; meta: PaginationMeta }>('admin/designers', {
        verified,
        page,
        limit
      })
      .pipe(map((response) => ({ data: response.data, meta: response.meta })));
  }

  updateDesignerVerification(designerId: string, isVerified: boolean): Observable<DesignerSummary> {
    return this.api.patchData(`admin/designers/${designerId}/verify`, { isVerified });
  }

  getSettings(): Observable<PlatformSetting[]> {
    return this.api.getData('admin/settings');
  }

  updateSetting(key: string, value: string): Observable<PlatformSetting> {
    return this.api.patchData(`admin/settings/${key}`, { value });
  }

  listOrders(status?: string, page = 1, limit = 20): Observable<{ data: OrderSummary[]; meta: PaginationMeta }> {
    return this.api
      .getData<{ data: OrderSummary[]; meta: PaginationMeta }>('orders', {
        status,
        page,
        limit
      })
      .pipe(map((response) => ({ data: response.data, meta: response.meta })));
  }

  listReturns(status?: string, page = 1, limit = 20): Observable<{ data: ReturnRequestSummary[]; meta: PaginationMeta }> {
    return this.api
      .getData<{ data: ReturnRequestSummary[]; meta: PaginationMeta }>('returns', {
        status,
        page,
        limit
      })
      .pipe(map((response) => ({ data: response.data, meta: response.meta })));
  }

  updateReturnStatus(returnId: string, action: 'approve' | 'reject' | 'pickup-dispatched' | 'returned', note?: string): Observable<ReturnRequestSummary> {
    return this.api.patchData(`returns/${returnId}/${action}`, { adminNotes: note });
  }

  getRatingsForUser(userId: string, page = 1, limit = 20): Observable<{ data: RatingSummary[]; meta: PaginationMeta }> {
    return this.api
      .getData<{ data: RatingSummary[]; meta: PaginationMeta }>(`ratings/users/${userId}`, {
        page,
        limit
      })
      .pipe(map((response) => ({ data: response.data, meta: response.meta })));
  }
}
