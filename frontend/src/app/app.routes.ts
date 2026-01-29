import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    { path: 'dashboard', component: DashboardComponent,  canActivate: [authGuard]  },
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // Redirect to dashboard, which will redirect to login if not auth
];
