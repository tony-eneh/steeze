import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth.models';

export const roleGuard = (role: UserRole): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const currentUser = auth.user();
    const currentRole = currentUser?.role;

    if (currentRole === role) {
      return true;
    }

    return router.parseUrl('/tabs/home');
  };
};
