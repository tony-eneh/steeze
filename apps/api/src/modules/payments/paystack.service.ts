import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

interface InitializeTransactionResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

interface VerifyTransactionResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    paid_at: string;
    metadata: any;
  };
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly baseUrl = 'https://api.paystack.co';
  private readonly secretKey: string;
  private readonly webhookSecret: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.secretKey =
      this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    this.webhookSecret =
      this.configService.get<string>('PAYSTACK_WEBHOOK_SECRET') || '';
  }

  async initializeTransaction(
    email: string,
    amount: number,
    reference: string,
    metadata: any,
  ): Promise<InitializeTransactionResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<InitializeTransactionResponse>(
          `${this.baseUrl}/transaction/initialize`,
          {
            email,
            amount: Math.round(amount * 100), // Convert to kobo
            reference,
            metadata,
            callback_url:
              this.configService.get<string>('PLATFORM_URL') +
              '/payment/callback',
          },
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to initialize Paystack transaction', error);
      throw error;
    }
  }

  async verifyTransaction(
    reference: string,
  ): Promise<VerifyTransactionResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.get<VerifyTransactionResponse>(
          `${this.baseUrl}/transaction/verify/${reference}`,
          {
            headers: {
              Authorization: `Bearer ${this.secretKey}`,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to verify Paystack transaction', error);
      throw error;
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    const hash = crypto
      .createHmac('sha512', this.webhookSecret)
      .update(payload)
      .digest('hex');

    return hash === signature;
  }

  generateReference(orderId: string): string {
    const timestamp = Date.now();
    return `STZ-${orderId.slice(0, 8)}-${timestamp}`;
  }
}
