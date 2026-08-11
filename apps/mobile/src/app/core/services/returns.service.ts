import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';
import { ApiResponse } from '../models/api.models';
import { ReturnRequest } from '../models/engagement.models';

@Injectable({ providedIn: 'root' })
export class ReturnsService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiConfig: ApiConfigService
  ) {}

  /** Only valid within 2 days of delivery. */
  request(orderId: string, reason: string) {
    return this.http.post<ApiResponse<ReturnRequest>>(
      `${this.apiConfig.baseUrl}/returns/orders/${orderId}/return`,
      { reason }
    );
  }

  list() {
    return this.http.get<ApiResponse<ReturnRequest[]>>(
      `${this.apiConfig.baseUrl}/returns`
    );
  }

  get(id: string) {
    return this.http.get<ApiResponse<ReturnRequest>>(
      `${this.apiConfig.baseUrl}/returns/${id}`
    );
  }
}
