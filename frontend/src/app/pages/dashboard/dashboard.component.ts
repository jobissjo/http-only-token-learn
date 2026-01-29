import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../../service/auth';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    data: any = null;
    loading = true;
    error = '';

    private auth = inject(Auth);
    private router = inject(Router);
    private cdf = inject(ChangeDetectorRef);

    ngOnInit() {
        this.auth.getProtected().subscribe({
            next: (response) => {

                this.data = response;
                this.loading = false;
                this.cdf.markForCheck();
            },
            error: (err) => {
                this.loading = false;
                console.error('Dashboard access error', err);
                
                this.cdf.markForCheck();
            }
        });
    }

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
                // Even if logout fails server-side, redirect to login
                this.router.navigate(['/login']);
            }
        });
    }
}
