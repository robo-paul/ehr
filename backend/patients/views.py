# backend/patients/views.py
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import (
    Patient, ClinicalNote, Allergy, ChronicCondition, 
    Medication, Insurance, PrimaryCarePhysician
)
from .serializers import (
    PatientSerializer, PatientCreateSerializer, ClinicalNoteSerializer,
    AllergySerializer, ChronicConditionSerializer, MedicationSerializer,
    InsuranceSerializer, PrimaryCarePhysicianSerializer
)


class IsProviderOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.user_type in ['doctor', 'admin', 'master_admin']


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().order_by('-id')
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user__first_name', 'user__last_name', 'user__email', 'phone']
    ordering_fields = ['user__first_name', 'user__last_name', 'created_at']
    ordering = ['-id']
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_superuser or user.is_staff:
            return Patient.objects.all().order_by('-id')
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
            return Patient.objects.all().order_by('-id')
        elif user.user_type in ['nurse', 'pharmacist', 'radiologist', 'labscientist']:
            return Patient.objects.all().order_by('-id')
        elif hasattr(user, 'patient_profile'):
            return Patient.objects.filter(user=user)
        
        return Patient.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PatientCreateSerializer
        return PatientSerializer
    
    def perform_create(self, serializer):
        serializer.save()
    
    @action(detail=True, methods=['get'])
    def clinical_notes(self, request, pk=None):
        patient = self.get_object()
        notes = patient.clinicalnote_set.all()
        serializer = ClinicalNoteSerializer(notes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def allergies(self, request, pk=None):
        patient = self.get_object()
        allergies = patient.allergies.all()
        serializer = AllergySerializer(allergies, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def chronic_conditions(self, request, pk=None):
        patient = self.get_object()
        conditions = patient.chronic_conditions.all()
        serializer = ChronicConditionSerializer(conditions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def medications(self, request, pk=None):
        patient = self.get_object()
        medications = patient.medications.filter(is_active=True)
        serializer = MedicationSerializer(medications, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def insurance(self, request, pk=None):
        patient = self.get_object()
        if hasattr(patient, 'insurance'):
            serializer = InsuranceSerializer(patient.insurance)
            return Response(serializer.data)
        return Response({'detail': 'No insurance information found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def primary_physician(self, request, pk=None):
        patient = self.get_object()
        if hasattr(patient, 'primary_care_physician'):
            serializer = PrimaryCarePhysicianSerializer(patient.primary_care_physician)
            return Response(serializer.data)
        return Response({'detail': 'No primary care physician found'}, status=status.HTTP_404_NOT_FOUND)


class ClinicalNoteViewSet(viewsets.ModelViewSet):
    queryset = ClinicalNote.objects.all().order_by('-created_at')
    serializer_class = ClinicalNoteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        patient_id = self.request.query_params.get('patient')
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
            if patient_id:
                return ClinicalNote.objects.filter(patient_id=patient_id).order_by('-created_at')
            return ClinicalNote.objects.all().order_by('-created_at')
        elif hasattr(user, 'patient_profile'):
            return ClinicalNote.objects.filter(patient=user.patient_profile).order_by('-created_at')
        
        return ClinicalNote.objects.none()
    
    def perform_create(self, serializer):
        serializer.save(provider=self.request.user)


class AllergyViewSet(viewsets.ModelViewSet):
    queryset = Allergy.objects.all().order_by('allergen')
    serializer_class = AllergySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        patient_id = self.request.query_params.get('patient')
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
            if patient_id:
                return Allergy.objects.filter(patient_id=patient_id).order_by('allergen')
            return Allergy.objects.all().order_by('allergen')
        elif hasattr(user, 'patient_profile'):
            return Allergy.objects.filter(patient=user.patient_profile).order_by('allergen')
        
        return Allergy.objects.none()


class ChronicConditionViewSet(viewsets.ModelViewSet):
    queryset = ChronicCondition.objects.all().order_by('condition')
    serializer_class = ChronicConditionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        patient_id = self.request.query_params.get('patient')
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
            if patient_id:
                return ChronicCondition.objects.filter(patient_id=patient_id).order_by('condition')
            return ChronicCondition.objects.all().order_by('condition')
        elif hasattr(user, 'patient_profile'):
            return ChronicCondition.objects.filter(patient=user.patient_profile).order_by('condition')
        
        return ChronicCondition.objects.none()


class MedicationViewSet(viewsets.ModelViewSet):
    queryset = Medication.objects.all().order_by('-prescribed_date')
    serializer_class = MedicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        patient_id = self.request.query_params.get('patient')
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
            if patient_id:
                return Medication.objects.filter(patient_id=patient_id).order_by('-prescribed_date')
            return Medication.objects.all().order_by('-prescribed_date')
        elif user.user_type == 'pharmacist':
            return Medication.objects.all().order_by('-prescribed_date')
        elif hasattr(user, 'patient_profile'):
            return Medication.objects.filter(patient=user.patient_profile).order_by('-prescribed_date')
        
        return Medication.objects.none()
    
    @action(detail=True, methods=['post'])
    def dispense(self, request, pk=None):
        medication = self.get_object()
        if request.user.user_type != 'pharmacist':
            return Response(
                {'error': 'Only pharmacists can dispense medications'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        medication.is_active = False
        medication.save()
        return Response({'status': 'medication dispensed'})


class InsuranceViewSet(viewsets.ModelViewSet):
    queryset = Insurance.objects.all()
    serializer_class = InsuranceSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
            return Insurance.objects.all()
        elif hasattr(user, 'patient_profile'):
            return Insurance.objects.filter(patient=user.patient_profile)
        
        return Insurance.objects.none()


class PrimaryCarePhysicianViewSet(viewsets.ModelViewSet):
    queryset = PrimaryCarePhysician.objects.all()
    serializer_class = PrimaryCarePhysicianSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.user_type in ['master_admin', 'admin', 'doctor']:
            return PrimaryCarePhysician.objects.all()
        elif hasattr(user, 'patient_profile'):
            return PrimaryCarePhysician.objects.filter(patient=user.patient_profile)
        
        return PrimaryCarePhysician.objects.none()