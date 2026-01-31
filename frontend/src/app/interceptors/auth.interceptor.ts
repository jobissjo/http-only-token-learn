import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { Auth } from '../service/auth';

let isRefreshing = false;
const refreshSubject = new BehaviorSubject<boolean | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(Auth);

  // Always send cookies
  const clonedReq = req.clone({ withCredentials: true });

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status !== 401) {
        return throwError(() => error);
      }

      // If refresh endpoint itself fails → logout
      if (req.url.includes('/auth/refresh')) {
        router.navigate(['/login']);
        return throwError(() => error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshSubject.next(null);

        return authService.refreshToken().pipe(
          switchMap(() => {
            isRefreshing = false;
            refreshSubject.next(true);   // just signal success
            return next(clonedReq);      // retry original request
          }),
          catchError(err => {
            isRefreshing = false;
            router.navigate(['/login']);
            return throwError(() => err);
          })
        );
      } else {
        return refreshSubject.pipe(
          filter(v => v === true),
          take(1),
          switchMap(() => next(clonedReq))
        );
      }
    })
  );
};
