import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';
import { ApiResponse } from '../models/api.models';
import { OrderDetail, OrderSummary } from '../models/order.models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiConfig: ApiConfigService
  ) {}

  listOrders() {
    return this.http.get<ApiResponse<OrderSummary[]>>(
      `${this.apiConfig.baseUrl}/orders`
    );
  }

  getOrder(id: string) {
    return this.http.get<ApiResponse<OrderDetail>>(
      `${this.apiConfig.baseUrl}/orders/${id}`
    );
  }

  confirmOrder(id: string) {
    return this.http.patch<ApiResponse<null>>(
      `${this.apiConfig.baseUrl}/orders/${id}/confirm`,
      {}
    );
  }

  requestReturn(id: string, reason: string) {
    return this.http.post<ApiResponse<null>>(
      `${this.apiConfig.baseUrl}/orders/${id}/return`,
      { reason }
    );
  }
}
