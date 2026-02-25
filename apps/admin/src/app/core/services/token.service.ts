import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly accessKey = 'steeze_admin_access_token';
  private readonly refreshKey = 'steeze_admin_refresh_token';

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  getAccessToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return localStorage.getItem(this.accessKey);
  }

  setAccessToken(token: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(this.accessKey, token);
  }

  getRefreshToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return localStorage.getItem(this.refreshKey);
  }

  setRefreshToken(token: string): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.setItem(this.refreshKey, token);
  }

  clearTokens(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    localStorage.removeItem(this.accessKey);
    localStorage.removeItem(this.refreshKey);
  }

  hasToken(): boolean {
    return !!this.getAccessToken();
  }
}
