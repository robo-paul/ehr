# backend/patients/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'patients', views.PatientViewSet, basename='patient')
router.register(r'clinical-notes', views.ClinicalNoteViewSet, basename='clinicalnote')
router.register(r'allergies', views.AllergyViewSet, basename='allergy')
router.register(r'chronic-conditions', views.ChronicConditionViewSet, basename='chroniccondition')
router.register(r'medications', views.MedicationViewSet, basename='medication')
router.register(r'insurance', views.InsuranceViewSet, basename='insurance')
router.register(r'primary-physicians', views.PrimaryCarePhysicianViewSet, basename='primarycarephysician')

urlpatterns = [
    path('', include(router.urls)),
]