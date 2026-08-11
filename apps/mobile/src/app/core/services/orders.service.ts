import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';
import { ApiResponse } from '../models/api.models';
import { OrderDetail, OrderSummary } from '../models/order.models';

export interface CreateOrderPayload {
  designId: string;
  deliveryAddressId: string;
  fabricOptionId?: string;
  addOnIds?: Array<{ addOnId: string }>;
  sizeLabel?: string;
  deliveryFee?: number;
  specialInstructions?: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiConfig: ApiConfigService
  ) {}

  createOrder(payload: CreateOrderPayload) {
    return this.http.post<ApiResponse<OrderDetail>>(
      `${this.apiConfig.baseUrl}/orders`,
      payload
    );
  }

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

  cancelOrder(id: string) {
    return this.http.patch<ApiResponse<null>>(
      `${this.apiConfig.baseUrl}/orders/${id}/cancel`,
      {}
    );
  }

  getStatusHistory(id: string) {
    return this.http.get<
      ApiResponse<Array<{ status: string; note?: string; createdAt: string }>>
    >(`${this.apiConfig.baseUrl}/orders/${id}/status-history`);
  }
}
