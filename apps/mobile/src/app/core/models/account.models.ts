import { UserRole } from './auth.models';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  openTailorEmail?: string | null;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
}

export interface Address {
  id: string;
  label?: string | null;
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string | null;
  isDefault: boolean;
}

export interface AddressPayload {
  label?: string;
  street: string;
  city: string;
  state: string;
  country?: string;
  postalCode?: string;
  isDefault?: boolean;
}

export interface Measurements {
  email?: string;
  [key: string]: unknown;
}
