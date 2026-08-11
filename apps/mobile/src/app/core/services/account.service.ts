import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiConfigService } from './api-config.service';
import { ApiResponse } from '../models/api.models';
import {
  Address,
  AddressPayload,
  UpdateProfilePayload,
  UserProfile
} from '../models/account.models';

@Injectable({ providedIn: 'root' })
export class AccountService {
  constructor(
    private readonly http: HttpClient,
    private readonly apiConfig: ApiConfigService
  ) {}

  getProfile() {
    return this.http.get<ApiResponse<UserProfile>>(
      `${this.apiConfig.baseUrl}/users/me`
    );
  }

  updateProfile(payload: UpdateProfilePayload) {
    return this.http.patch<ApiResponse<UserProfile>>(
      `${this.apiConfig.baseUrl}/users/me`,
      payload
    );
  }

  listAddresses() {
    return this.http.get<ApiResponse<Address[]>>(
      `${this.apiConfig.baseUrl}/users/me/addresses`
    );
  }

  createAddress(payload: AddressPayload) {
    return this.http.post<ApiResponse<Address>>(
      `${this.apiConfig.baseUrl}/users/me/addresses`,
      payload
    );
  }

  updateAddress(id: string, payload: Partial<AddressPayload>) {
    return this.http.patch<ApiResponse<Address>>(
      `${this.apiConfig.baseUrl}/users/me/addresses/${id}`,
      payload
    );
  }

  deleteAddress(id: string) {
    return this.http.delete<ApiResponse<null>>(
      `${this.apiConfig.baseUrl}/users/me/addresses/${id}`
    );
  }
}
