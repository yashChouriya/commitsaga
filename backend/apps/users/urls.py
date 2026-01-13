from django.urls import path
from . import views

urlpatterns = [
    path('signup/', views.signup_view, name='signup'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('validate-pat/', views.validate_github_pat, name='validate-pat'),
    path('check-pat/', views.check_pat_status, name='check-pat'),
]
