import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';
import { ApiResponse } from '../models/api.models';
import { DesignDetail, DesignSummary } from '../models/design.models';

@Injectable({ providedIn: 'root' })
export class DesignsService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiConfig: ApiConfigService
  ) {}

  listDesigns(filters: {
    category?: string;
    gender?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<ApiResponse<DesignSummary[]>>(
      `${this.apiConfig.baseUrl}/designs`,
      { params }
    );
  }

  getDesign(id: string) {
    return this.http.get<ApiResponse<DesignDetail>>(
      `${this.apiConfig.baseUrl}/designs/${id}`
    );
  }
}
