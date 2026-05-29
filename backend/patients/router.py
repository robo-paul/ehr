# backend/patients/router.py
from rest_framework.routers import DefaultRouter

class NoSuffixRouter(DefaultRouter):
    """Router that doesn't use format_suffix_patterns to avoid duplicate registration"""
    
    def get_urls(self):
        # Get the original URLs
        urls = super().get_urls()
        # Return them without applying format_suffix_patterns
        return urls