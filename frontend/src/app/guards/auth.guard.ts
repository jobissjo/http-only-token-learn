import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    debugger
    console.log(route, state);
    // Check if running in browser to access localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
        debugger;
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        if (isAuthenticated) {
            return true;
        }
    }

    // Not authenticated
    router.navigate(['/login']);
    return false;
};
