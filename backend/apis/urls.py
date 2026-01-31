from django.urls import path
from . import views


urlpatterns = [
    path('', views.BaseAPIView.as_view(), name='base-api'),
    path('me/', views.MeAPIView.as_view(), name='me-api'),
    path('login/', views.LoginView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', views.RefreshView.as_view(), name='token_refresh'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('protected/', views.ProtectedAPIView.as_view(), name='protected-api'),

]