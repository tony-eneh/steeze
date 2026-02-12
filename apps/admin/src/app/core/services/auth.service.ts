import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { ApiService } from './api.service';
import { TokenService } from './token.service';
import { AuthUser, LoginResponse } from '../models/api.types';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly userSubject = new BehaviorSubject<AuthUser | null>(null);
  readonly user$ = this.userSubject.asObservable();

  constructor(private api: ApiService, private tokenService: TokenService) {}

  login(email: string, password: string): Observable<AuthUser> {
    return this.api
      .postData<LoginResponse>('auth/login', { email, password })
      .pipe(
        tap((response) => {
          this.tokenService.setAccessToken(response.accessToken);
          this.tokenService.setRefreshToken(response.refreshToken);
          this.userSubject.next(response.user);
        }),
        map((response) => response.user)
      );
  }

  logout(): void {
    this.tokenService.clearTokens();
    this.userSubject.next(null);
  }

  isAuthenticated(): boolean {
    return this.tokenService.hasToken();
  }
}
