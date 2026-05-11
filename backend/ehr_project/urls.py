from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/admin/', include('admin_app.urls')),
    path('api/auth/', include('authentication.urls')),
    path('api/patients/', include('patients.urls')),
    path('api/appointments_app/', include('appointments_app.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/prescriptions/', include('prescriptions.urls')),
    path('api/lab-results/', include('labresults.urls')),  
    path('api/notifications/', include('notifications.urls')),  # Add this line
   # path('api/messaging/', include('messaging.urls')),
    path('api/chat/', include('chat.urls')),  
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)