import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import {
  AuthSession,
  LoginPayload,
  RegisterPayload
} from '../models/auth.models';
import { ApiResponse } from '../models/api.models';
import { ApiConfigService } from './api-config.service';
import { AuthStorageService } from './auth-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionSignal = signal<AuthSession | null>(null);

  readonly session = computed(() => this.sessionSignal());
  readonly user = computed(() => this.sessionSignal()?.user ?? null);
  readonly isAuthenticated = computed(() => Boolean(this.sessionSignal()));

  constructor(
    private readonly http: HttpClient,
    private readonly apiConfig: ApiConfigService,
    private readonly storage: AuthStorageService
  ) {
    this.sessionSignal.set(this.storage.loadSession());
  }

  login(payload: LoginPayload) {
    return this.http
      .post<ApiResponse<AuthSession>>(
        `${this.apiConfig.baseUrl}/auth/login`,
        payload
      )
      .pipe(tap((response) => this.setSession(response.data)));
  }

  register(payload: RegisterPayload) {
    return this.http
      .post<ApiResponse<AuthSession>>(
        `${this.apiConfig.baseUrl}/auth/register`,
        payload
      )
      .pipe(tap((response) => this.setSession(response.data)));
  }

  requestPasswordReset(email: string) {
    return this.http.post<ApiResponse<null>>(
      `${this.apiConfig.baseUrl}/auth/forgot-password`,
      { email }
    );
  }

  logout(): void {
    this.setSession(null);
  }

  getAccessToken(): string | null {
    return this.sessionSignal()?.accessToken ?? null;
  }

  private setSession(session: AuthSession | null): void {
    this.sessionSignal.set(session);
    this.storage.saveSession(session);
  }
}
