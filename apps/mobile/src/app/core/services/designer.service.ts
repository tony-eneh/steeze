import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';
import { ApiResponse } from '../models/api.models';
import { OrderSummary } from '../models/order.models';
import {
  DesignerEarnings,
  DesignerProfilePayload,
  DesignPayload,
  ManagedDesign,
  UploadedAsset
} from '../models/designer.models';

@Injectable({ providedIn: 'root' })
export class DesignerService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiConfig: ApiConfigService
  ) {}

  // ===== Shop =====

  updateProfile(payload: DesignerProfilePayload) {
    return this.http.patch<ApiResponse<unknown>>(
      `${this.apiConfig.baseUrl}/designers/me`,
      payload
    );
  }

  listOrders() {
    return this.http.get<ApiResponse<OrderSummary[]>>(
      `${this.apiConfig.baseUrl}/designers/me/orders`
    );
  }

  getEarnings() {
    return this.http.get<ApiResponse<DesignerEarnings>>(
      `${this.apiConfig.baseUrl}/designers/me/earnings`
    );
  }

  // ===== Designs =====

  createDesign(payload: DesignPayload) {
    return this.http.post<ApiResponse<ManagedDesign>>(
      `${this.apiConfig.baseUrl}/designs`,
      payload
    );
  }

  updateDesign(id: string, payload: Partial<DesignPayload>) {
    return this.http.patch<ApiResponse<ManagedDesign>>(
      `${this.apiConfig.baseUrl}/designs/${id}`,
      payload
    );
  }

  deleteDesign(id: string) {
    return this.http.delete<ApiResponse<null>>(
      `${this.apiConfig.baseUrl}/designs/${id}`
    );
  }

  // ===== Images =====

  /** Uploads the file, then attaches the hosted URL to the design. */
  uploadImage(file: File, folder = 'designs') {
    const body = new FormData();
    body.append('file', file);
    body.append('folder', folder);

    return this.http.post<ApiResponse<UploadedAsset>>(
      `${this.apiConfig.baseUrl}/media/upload`,
      body
    );
  }

  attachImage(designId: string, url: string, altText?: string) {
    return this.http.post<ApiResponse<{ id: string; url: string }>>(
      `${this.apiConfig.baseUrl}/designs/${designId}/images`,
      { url, altText }
    );
  }

  removeImage(designId: string, imageId: string) {
    return this.http.delete<ApiResponse<null>>(
      `${this.apiConfig.baseUrl}/designs/${designId}/images/${imageId}`
    );
  }

  // ===== Order transitions the designer owns =====

  acceptOrder(id: string) {
    return this.transition(id, 'accept');
  }

  rejectOrder(id: string) {
    return this.transition(id, 'reject');
  }

  startOrder(id: string) {
    return this.transition(id, 'in-progress');
  }

  markReady(id: string) {
    return this.transition(id, 'ready');
  }

  private transition(id: string, action: string) {
    return this.http.patch<ApiResponse<unknown>>(
      `${this.apiConfig.baseUrl}/orders/${id}/${action}`,
      {}
    );
  }
}
