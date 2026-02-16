import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from '../service/auth';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const router = inject(Router);
  return authService.checkAuth().pipe(
    
    map(user => {
      if (!user) {
        return router.parseUrl('/login');

      }
      return true;
    })
  );
};
