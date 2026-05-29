# backend/authentication/urls.py
from django.urls import path
from knox import views as knox_views
from . import views

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', knox_views.LogoutView.as_view(), name='logout'),
    path('logoutall/', knox_views.LogoutAllView.as_view(), name='logoutall'),
    path('register/patient/', views.RegisterPatientView.as_view(), name='register_patient'),
    path('register/doctor/', views.RegisterDoctorView.as_view(), name='register_doctor'),
    path('register/staff/', views.RegisterStaffView.as_view(), name='register_staff'),
    path('register/admin/', views.RegisterAdminView.as_view(), name='register_admin'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('pending-requests/', views.PendingRoleRequestsView.as_view(), name='pending_requests'),
    path('approve-role/<int:user_id>/', views.ApproveRoleView.as_view(), name='approve_role'),
    path('reject-role/<int:user_id>/', views.RejectRoleView.as_view(), name='reject_role'),
    path('providers/', views.ProvidersListView.as_view(), name='providers'),
]