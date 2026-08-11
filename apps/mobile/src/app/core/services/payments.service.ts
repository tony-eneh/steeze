import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';
import { ApiResponse } from '../models/api.models';

export interface InitializedPayment {
  paymentId: string;
  reference: string;
  authorizationUrl: string;
  accessCode: string;
}

export interface PaymentVerification {
  status: string;
  reference: string;
  amount: number;
  orderId?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiConfig: ApiConfigService
  ) {}

  initialize(orderId: string) {
    return this.http.post<ApiResponse<InitializedPayment>>(
      `${this.apiConfig.baseUrl}/payments/initialize`,
      { orderId }
    );
  }

  verify(reference: string) {
    return this.http.get<ApiResponse<PaymentVerification>>(
      `${this.apiConfig.baseUrl}/payments/verify/${reference}`
    );
  }
}
