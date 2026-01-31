import { Component, inject, signal } from '@angular/core';
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
    errorMessage = signal('');
    isLoading = signal(false);

    private readonly auth = inject(Auth);
    private readonly router = inject(Router);

    onLogin() {
        this.isLoading.set(true)
        this.errorMessage.set('');

        this.auth.login({ username: this.username, password: this.password }).subscribe({
            next: () => {
                this.isLoading.set(false);
                if (typeof window !== 'undefined' && window.localStorage) {
                    localStorage.setItem('isAuthenticated', 'true');
                }
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                this.isLoading.set(false);
                console.error('Login error', err);
                this.errorMessage.set('Login failed. Please check your credentials and try again.');
            }
        });
    }
}
