import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const customerGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isCustomer()) {
    return true;
  }

  // Guests and admins → redirect to login
  router.navigate(['/login']);
  return false;
};