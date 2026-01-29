import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Auth {

  private http: HttpClient = inject(HttpClient);

  checkApi() {
    return this.http.get('/api/');
  }

  login(data: any) {
    return this.http.post('/api/login/', data);
  }

  logout() {
    return this.http.post('/api/logout/', {});
  }

  getProtected() {
    return this.http.get('/api/protected/');
  }

  refreshToken() {
    return this.http.post('/api/token/refresh/', {});
  }
}
