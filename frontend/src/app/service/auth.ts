import { HttpClient } from '@angular/common/http';
import { inject, Injectable, makeStateKey, } from '@angular/core';
import { APIBaseResponse, CurrentUserBasicInfo } from '../models/api.models';
import {  map, Observable, of, tap } from 'rxjs';
const USER_KEY = makeStateKey<CurrentUserBasicInfo | null>('user-data');
@Injectable({
  providedIn: 'root',
})
export class Auth {

  private http: HttpClient = inject(HttpClient);
  private user: CurrentUserBasicInfo | null = null;
  private checked = false;

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

  checkAuth(): Observable<CurrentUserBasicInfo | null> {
    console.log(this.checked, 'checked', this.user, 'user');

    if (this.checked) return of(this.user);
    console.log('failed already checked, fetching user info');

    return this.http.get<APIBaseResponse<CurrentUserBasicInfo>>('/api/me', { withCredentials: true }).pipe(
      map(response => response.data),
      tap({
        next: (user) => {
          console.log(user);
          this.user = user;
          this.checked = true;
          console.log(this.checked, 'checked', this.user, 'user');

        },
        error: () => {
          this.user = null;
          this.checked = true;
        }
      })
    );
  }

}
