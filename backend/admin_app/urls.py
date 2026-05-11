# backend/admin_app/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'users', views.AdminUserViewSet, basename='admin-users')
router.register(r'user-stats', views.AdminStatsViewSet, basename='admin-stats')

urlpatterns = [
    path('', include(router.urls)),
]