import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../../service/auth';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    username = '';
    password = '';
    errorMessage = '';
    isLoading = false;

    private auth = inject(Auth);
    private router = inject(Router);

    onLogin() {
        this.isLoading = true;
        this.errorMessage = '';

        this.auth.login({ username: this.username, password: this.password }).subscribe({
            next: () => {
                this.isLoading = false;
                if (typeof window !== 'undefined' && window.localStorage) {
                    localStorage.setItem('isAuthenticated', 'true');
                }
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.isLoading = false;
                console.error('Login error', err);
                this.errorMessage = 'Invalid credentials or server error.';
            }
        });
    }
}
