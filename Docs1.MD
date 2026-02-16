# HttpOnly JWT Authentication with Angular + Django REST Framework

Modern SPAs often store JWT tokens in **localStorage** — but that is **dangerous**.

JavaScript can read localStorage.
If your site ever has an **XSS vulnerability**, attackers can steal tokens and impersonate users.

**Solution:** Store tokens in **HttpOnly Cookies**

HttpOnly cookies:

* ❌ Cannot be accessed via JavaScript
* ✅ Automatically sent with requests
* ✅ Protect tokens from XSS attacks

This guide explains a **development setup** using:

* **Backend:** Django + DRF + SimpleJWT
* **Frontend:** Angular
* **Auth Method:** HttpOnly Cookie-based JWT

---

##  Architecture Overview

```
Angular App  →  Django API
    |              |
    | login        |
    └─────────────▶| sets HttpOnly cookies
    |              |
    | API request  |
    └─────────────▶| cookies auto-sent
    |              |
    | 401 expired  |
    └─────────────▶| refresh token endpoint
```

No tokens stored in frontend memory or storage.

---

## 🐍 Backend Setup — Django + DRF

### Install Apps

```python
INSTALLED_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "apis",
]
```

---

### SimpleJWT Config

```python
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=ACCESS_TOKEN_LIFETIME_MINUTES),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=REFRESH_TOKEN_LIFETIME_DAYS),

    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,

    "AUTH_HEADER_TYPES": ("Bearer",),
}
```

### CSRF Protection (Required for Cookie-Based JWT)

When authentication uses cookies, the browser automatically sends them with requests.
This protects against XSS token theft, but introduces CSRF risk.

```python
# settings.py
DEBUG = os.getenv("DEBUG") == "1"

ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS").split(",") if os.getenv("ALLOWED_HOSTS") else []

CSRF_TRUSTED_ORIGINS = os.getenv("CSRF_TRUSTED_ORIGINS").split(",") if os.getenv("CSRF_TRUSTED_ORIGINS") else []
```

---

### Authentication Classes

Overridden New JwtAuthentication

```python
# apis/auth.py
from rest_framework_simplejwt.authentication import JWTAuthentication

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get("access_token")

        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
```

We use **cookie-based auth in production**, but allow Bearer header in development.

```python
AUTHENTICATION_CLASSES = [
    'apis.auth.CookieJWTAuthentication',
]

if DEBUG:
    AUTHENTICATION_CLASSES += [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': AUTHENTICATION_CLASSES
}
```

---

### URLs

```python
path('api/', include('apis.urls')),

#apis.urls
path('', views.BaseAPIView.as_view(), name='base-api'),
path('me/', views.MeAPIView.as_view(), name='me-api'),
path('login/', views.LoginView.as_view(), name='token_obtain_pair'),
path('token/refresh/', views.RefreshView.as_view(), name='token_refresh'),
path('logout/', views.LogoutView.as_view(), name='logout'),
path('protected/', views.ProtectedAPIView.as_view(), name='protected-api'),

```

---

##  Authentication Flow

### 1. Login

* Verifies user credentials
* Creates access + refresh tokens
* Stores them in HttpOnly cookies

```python
response.set_cookie(
    key="access_token",
    value=str(refresh.access_token),
    httponly=True,
    secure=False,
    samesite="Lax",
    max_age=15 * 60,
    path="/",
)
```

```python
response.set_cookie(
    key="refresh_token",
    value=str(refresh),
    httponly=True,
    secure=False,
    samesite="Lax",
    max_age=7 * 24 * 60 * 60,
    path="/",
)
```

---

### 2. Refresh Token

* Reads refresh token from cookie
* Blacklists old token
* Issues new access + refresh tokens

---

### 3. Protected API

```python
class ProtectedAPIView(APIView):
    permission_classes = [IsAuthenticated]
```

Only accessible if cookie contains valid access token.

---

### 4. Logout

```python
response.delete_cookie("access_token")
response.delete_cookie("refresh_token")
```

---

### 5. Get Current User

```python
class MeAPIView(APIView):
    permission_classes = [IsAuthenticated]
```

Used by frontend to check login state.

---

## 🅰️ Angular Frontend Setup

During development, Angular calls Django through a proxy.

### Proxy Config

```json
{
  "/api": {
    "target": "http://localhost:8000",
    "secure": false,
    "changeOrigin": true
  }
}
```

---

## 🔌 Auth Service

Handles login, logout, refresh, and auth checking.

Key point:

```typescript
  checkAuth(): Observable<CurrentUserBasicInfo | null> {
    if (this.checked) return of(this.user);

    return this.http.get<APIBaseResponse<CurrentUserBasicInfo>>('/api/me', { withCredentials: true }).pipe(
      map(response => response.data),
      tap({
        next: (user) => {
          this.user = user;
          this.checked = true;

        },
        error: () => {
          this.user = null;
          this.checked = true;
        }
      })
    );
  }
```

`withCredentials: true` ensures cookies are sent.

---

## 🛡️ Auth Guard

Protects routes:

```typescript
export const authGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const router = inject(Router);
  return authService.checkAuth().pipe(
    
    map(user => {
      if (!user) {
        router.parseUrl('/login');
        return false;
      }
      return true;
    })
  );
};
```

---

## 🔄 HTTP Interceptor

Handles expired tokens automatically.
```typescript
let isRefreshing = false;
const refreshSubject = new BehaviorSubject<boolean | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(Auth);

  // Always send cookies
  const clonedReq = req.clone({ withCredentials: true });

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {

      if (error.status !== 401) {
        return throwError(() => error);
      }

      // If refresh endpoint itself fails → logout
      if (req.url.includes('/auth/refresh')) {
        router.navigate(['/login']);
        return throwError(() => error);
      }

      if (!isRefreshing) {
        isRefreshing = true;
        refreshSubject.next(null);

        return authService.refreshToken().pipe(
          switchMap(() => {
            isRefreshing = false;
            refreshSubject.next(true); // signal refresh success
            return next(clonedReq);    // retry original request
          }),
          catchError(err => {
            isRefreshing = false;
            router.navigate(['/login']);
            return throwError(() => err);
          })
        );
      } else {
        // Wait for refresh to complete
        return refreshSubject.pipe(
          filter(v => v === true),
          take(1),
          switchMap(() => next(clonedReq))
        );
      }
    })
  );

When using HttpOnly cookies, Angular does not store or manage tokens.

Instead, we use an HTTP interceptor to:

Automatically send cookies with every request

Detect expired access tokens (401 response)

Call the refresh endpoint

Retry the original request

Prevent multiple refresh calls at the same time

💡 How It Works (Simple Flow)

Angular sends an API request

If the access token is expired → backend returns 401

Interceptor calls /api/token/refresh/

Backend issues new cookies

Original request is retried automatically

The user never sees this process.

Why We Use isRefreshing

If multiple API requests fail at the same time:

We don’t want multiple refresh calls

Only one refresh request runs

No frontend token handling required.

---

## 🧾 Dashboard Example

Protected component calls:

```typescript
this.auth.getProtected()
```

If not authenticated → guard redirects to login.

---

> 💡 If you want to see the full implementation code, check out the GitHub repository: [https://github.com/jobissjo/http-only-token-learn/tree/dev](https://github.com/jobissjo/http-only-token-learn/tree/dev)

---


## ✅ Final Result

✔ Tokens never exposed to JavaScript  
✔ Angular never stores tokens  
✔ Automatic refresh  
✔ DRF handles authentication via cookies

This is the **secure modern way** to handle SPA authentication.