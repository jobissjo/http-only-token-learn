import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { Auth } from '../service/auth';

let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const authService = inject(Auth);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Check if we are running in the browser
            if (typeof window !== 'undefined' && error.status === 401) {

                // If the 401 comes from the refresh token endpoint itself, we can't refresh.
                if (req.url.includes('/api/token/refresh/')) {
                    if (window.localStorage) {
                        localStorage.removeItem('isAuthenticated');
                    }
                    router.navigate(['/login']);
                    return throwError(() => error);
                }

                if (!isRefreshing) {
                    isRefreshing = true;
                    refreshTokenSubject.next(null);

                    return authService.refreshToken().pipe(
                        switchMap((response) => {
                            isRefreshing = false;
                            refreshTokenSubject.next(response || true);
                            return next(req);
                        }),
                        catchError((err) => {
                            isRefreshing = false;
                            if (window.localStorage) {
                                localStorage.removeItem('isAuthenticated');
                            }
                            router.navigate(['/login']);
                            return throwError(() => err);
                        })
                    );
                } else {
                    return refreshTokenSubject.pipe(
                        filter(token => token != null),
                        take(1),
                        switchMap(() => {
                            return next(req);
                        })
                    );
                }
            }
            return throwError(() => error);
        })
    );
};
