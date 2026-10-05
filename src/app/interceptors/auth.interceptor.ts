import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

// Guests can stay on these pages even after the token expires
const PUBLIC_PAGES = ['/', '/product-detail', '/login'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Skip attaching token ONLY for endpoints that must stay public
  const isPublicEndpoint =
    req.url.includes('/api/auth/') ||
    req.url.includes('/api/customers/register');

  // isLoggedIn() returns false and deletes the token if it is expired/invalid,
  // so an old token is never sent to the backend
  const token = auth.isLoggedIn() ? auth.getToken() : null;

  const request = token && !isPublicEndpoint
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(request).pipe(
    catchError((err: HttpErrorResponse) => {
      // Token was sent but the backend rejected it
      if (err.status === 401 && token && !isPublicEndpoint) {
        auth.logout();

        const currentPath = router.url.split('?')[0];
        const onPublicPage = PUBLIC_PAGES.some(p =>
          p === '/' ? currentPath === '/' : currentPath.startsWith(p)
        );

        // Only force redirect from protected pages (cart, orders, etc.)
        if (!onPublicPage) {
          router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
        }
      }
      return throwError(() => err);
    })
  );
};