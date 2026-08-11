import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiConfigService } from './api-config.service';
import { ApiResponse } from '../models/api.models';

type DevicePlatform = 'ANDROID' | 'IOS' | 'WEB';

const STORED_TOKEN_KEY = 'steeze.push.token';

/**
 * Registers the device with FCM and keeps the token in sync with the API.
 * On web there is no native push channel, so every method is a no-op.
 */
@Injectable({ providedIn: 'root' })
export class PushNotificationsService {
  private registered = false;

  constructor(
    private readonly http: HttpClient,
    private readonly apiConfig: ApiConfigService,
    private readonly router: Router
  ) {}

  get isSupported(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Called once the user is signed in. Asking for permission before that point
   * wastes the single prompt iOS grants us.
   */
  async register(): Promise<void> {
    if (!this.isSupported || this.registered) {
      return;
    }

    const permission = await PushNotifications.requestPermissions();

    if (permission.receive !== 'granted') {
      return;
    }

    this.registered = true;
    this.listen();
    await PushNotifications.register();
  }

  /** Drops the device token so a signed-out phone stops receiving alerts. */
  async unregister(): Promise<void> {
    const token = localStorage.getItem(STORED_TOKEN_KEY);

    if (!token) {
      return;
    }

    localStorage.removeItem(STORED_TOKEN_KEY);

    try {
      await firstValueFrom(
        this.http.delete<ApiResponse<{ removed: number }>>(
          `${this.apiConfig.baseUrl}/notifications/devices/${encodeURIComponent(token)}`
        )
      );
    } catch {
      // A stale token on the server is harmless: it is pruned on first send.
    }
  }

  private listen(): void {
    void PushNotifications.addListener('registration', (token) => {
      void this.syncToken(token.value);
    });

    void PushNotifications.addListener('registrationError', () => {
      this.registered = false;
    });

    void PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action) => {
        const orderId = action.notification.data?.['orderId'];

        if (typeof orderId === 'string' && orderId.length > 0) {
          void this.router.navigate(['/orders', orderId]);
          return;
        }

        void this.router.navigateByUrl('/notifications');
      }
    );
  }

  private async syncToken(token: string): Promise<void> {
    try {
      await firstValueFrom(
        this.http.post<ApiResponse<{ id: string }>>(
          `${this.apiConfig.baseUrl}/notifications/devices`,
          { token, platform: currentPlatform() }
        )
      );
      localStorage.setItem(STORED_TOKEN_KEY, token);
    } catch {
      // The next successful sign-in retries the registration.
    }
  }
}

function currentPlatform(): DevicePlatform {
  switch (Capacitor.getPlatform()) {
    case 'android':
      return 'ANDROID';
    case 'ios':
      return 'IOS';
    default:
      return 'WEB';
  }
}
