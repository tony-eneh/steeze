import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';
import { ApiResponse } from '../models/api.models';
import {
  AppNotification,
  PaginatedResult
} from '../models/engagement.models';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiConfig: ApiConfigService
  ) {}

  list(options: { page?: number; limit?: number; isRead?: boolean } = {}) {
    let params = new HttpParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<ApiResponse<PaginatedResult<AppNotification>>>(
      `${this.apiConfig.baseUrl}/notifications`,
      { params }
    );
  }

  unreadCount() {
    return this.http.get<ApiResponse<{ unreadCount: number }>>(
      `${this.apiConfig.baseUrl}/notifications/unread-count`
    );
  }

  markAsRead(id: string) {
    return this.http.patch<ApiResponse<AppNotification>>(
      `${this.apiConfig.baseUrl}/notifications/${id}/read`,
      {}
    );
  }

  markAllAsRead() {
    return this.http.patch<ApiResponse<{ count: number }>>(
      `${this.apiConfig.baseUrl}/notifications/read-all`,
      {}
    );
  }
}
