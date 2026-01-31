import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth } from '../service/auth';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const router = inject(Router);
    console.log('Auth guard check');
  return authService.checkAuth().pipe(
    
    map(user => {
        console.log('Auth guard checking user', user);
      if (!user) {
        router.parseUrl('/login');
        return false;
      }
      return true;
    })
  );
};
