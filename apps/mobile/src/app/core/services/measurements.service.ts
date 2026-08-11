import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';
import { ApiResponse } from '../models/api.models';
import { Measurements } from '../models/account.models';

export interface CreateMeasurementPayload {
  email: string;
  gender: 'male' | 'female' | 'other';
  unit?: 'cm' | 'inch';
  measurements?: Record<string, unknown>;
}

export type UpdateMeasurementPayload = Partial<
  Omit<CreateMeasurementPayload, 'email'>
>;

@Injectable({ providedIn: 'root' })
export class MeasurementsService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiConfig: ApiConfigService
  ) {}

  /** Links the Open Tailor account whose measurements should be reused. */
  linkEmail(openTailorEmail: string) {
    return this.http.post<ApiResponse<{ message: string }>>(
      `${this.apiConfig.baseUrl}/measurements/link`,
      { openTailorEmail }
    );
  }

  getMine() {
    return this.http.get<ApiResponse<Measurements>>(
      `${this.apiConfig.baseUrl}/measurements/mine`
    );
  }

  create(payload: CreateMeasurementPayload) {
    return this.http.post<ApiResponse<Measurements>>(
      `${this.apiConfig.baseUrl}/measurements/create`,
      payload
    );
  }

  update(payload: UpdateMeasurementPayload) {
    return this.http.put<ApiResponse<Measurements>>(
      `${this.apiConfig.baseUrl}/measurements/update`,
      payload
    );
  }
}
