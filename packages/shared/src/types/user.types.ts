export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  DESIGNER = 'DESIGNER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  openTailorEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}
