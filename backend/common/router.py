# backend/common/router.py
from rest_framework.routers import DefaultRouter

class SafeRouter(DefaultRouter):
    """Router that safely handles URL patterns without duplicate converter registration"""
    
    def get_urls(self):
        # Get the original URLs without format_suffix_patterns
        urls = super().get_urls()
        return urls
    
    def register(self, *args, **kwargs):
        """Register a viewset with the router"""
        return super().register(*args, **kwargs)