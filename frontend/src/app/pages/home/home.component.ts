import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '../../service/auth';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [CommonModule, RouterLink],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css']
})
export class HomeComponent {
    private readonly router = inject(Router);
    private readonly auth = inject(Auth);

    onLogout() {
        this.auth.logout().subscribe({
            next: () => {
                if (typeof window !== 'undefined' && window.localStorage) {
                    localStorage.removeItem('isAuthenticated');
                }
                this.router.navigate(['/login']);
            },
            error: (err) => {
                console.error('Logout error', err);
                if (typeof window !== 'undefined' && window.localStorage) {
                    localStorage.removeItem('isAuthenticated');
                }
                this.router.navigate(['/login']);
            }
        });
    }
}
