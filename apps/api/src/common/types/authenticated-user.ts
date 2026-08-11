import { UserRole } from '@prisma/client';

/**
 * What the JWT strategy puts on the request. Controllers should type
 * @CurrentUser() with this rather than `any` so a wrong field name is a
 * compile error instead of an undefined passed into a service.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
}
