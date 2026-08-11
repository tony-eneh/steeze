import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';
import { ApiResponse } from '../models/api.models';
import { Rating, RatingPayload } from '../models/engagement.models';

@Injectable({ providedIn: 'root' })
export class RatingsService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiConfig: ApiConfigService
  ) {}

  /** Only unlocks once the order is confirmed, and only once per party. */
  rateOrder(orderId: string, payload: RatingPayload) {
    return this.http.post<ApiResponse<Rating>>(
      `${this.apiConfig.baseUrl}/ratings/orders/${orderId}/rate`,
      payload
    );
  }

  listForUser(userId: string) {
    return this.http.get<ApiResponse<Rating[]>>(
      `${this.apiConfig.baseUrl}/ratings/users/${userId}`
    );
  }

  listForOrder(orderId: string) {
    return this.http.get<ApiResponse<Rating[]>>(
      `${this.apiConfig.baseUrl}/ratings/orders/${orderId}`
    );
  }
}
