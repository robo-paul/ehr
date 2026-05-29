# backend/appointments_app/router.py
from rest_framework.routers import DefaultRouter

class NoSuffixRouter(DefaultRouter):
    """Router that doesn't use format_suffix_patterns to avoid duplicate registration"""
    
    def get_urls(self):
        urls = super().get_urls()
        return urls