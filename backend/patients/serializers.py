# backend/patients/serializers.py
from rest_framework import serializers
from datetime import date
from .models import (
    Patient, ClinicalNote, Allergy, ChronicCondition, 
    Medication, Insurance, PrimaryCarePhysician
)
from django.contrib.auth import get_user_model

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'first_name', 'last_name', 'email', 'user_type', 'full_name')
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username


class AllergySerializer(serializers.ModelSerializer):
    class Meta:
        model = Allergy
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class ChronicConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChronicCondition
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class MedicationSerializer(serializers.ModelSerializer):
    prescribed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Medication
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')
    
    def get_prescribed_by_name(self, obj):
        if obj.prescribed_by:
            return f"{obj.prescribed_by.first_name} {obj.prescribed_by.last_name}".strip() or obj.prescribed_by.username
        return None


class InsuranceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Insurance
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class PrimaryCarePhysicianSerializer(serializers.ModelSerializer):
    class Meta:
        model = PrimaryCarePhysician
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at')


class PatientSerializer(serializers.ModelSerializer):
    user_details = UserBasicSerializer(source='user', read_only=True)
    full_name = serializers.SerializerMethodField()
    age = serializers.SerializerMethodField()
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    allergies = AllergySerializer(many=True, read_only=True)
    chronic_conditions = ChronicConditionSerializer(many=True, read_only=True)
    medications = MedicationSerializer(many=True, read_only=True)
    insurance = InsuranceSerializer(read_only=True)
    primary_care_physician = PrimaryCarePhysicianSerializer(read_only=True)
    
    class Meta:
        model = Patient
        fields = ('id', 'first_name', 'last_name', 'full_name', 'age', 'email', 'user_details',
                  'date_of_birth', 'gender', 'phone', 'address', 'emergency_contact', 
                  'blood_type', 'created_at', 'updated_at', 'allergies', 'chronic_conditions',
                  'medications', 'insurance', 'primary_care_physician')
        read_only_fields = ('created_at', 'updated_at', 'user')
    
    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
    
    def get_age(self, obj):
        if obj.date_of_birth:
            today = date.today()
            return today.year - obj.date_of_birth.year - ((today.month, today.day) < (obj.date_of_birth.month, obj.date_of_birth.day))
        return None


class PatientCreateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(write_only=True, required=True)
    first_name = serializers.CharField(write_only=True, required=True)
    last_name = serializers.CharField(write_only=True, required=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Patient
        fields = ('first_name', 'last_name', 'email', 'password',
                  'date_of_birth', 'gender', 'phone', 'address', 
                  'emergency_contact', 'blood_type')
    
    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists")
        return value
    
    def validate_date_of_birth(self, value):
        if value > date.today():
            raise serializers.ValidationError("Date of birth cannot be in the future")
        return value
    
    def create(self, validated_data):
        email = validated_data.pop('email')
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        password = validated_data.pop('password', None)
        
        if password:
            user = User.objects.create_user(
                username=email,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=password
            )
        else:
            import random
            import string
            random_password = ''.join(random.choices(string.ascii_letters + string.digits, k=12))
            user = User.objects.create_user(
                username=email,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=random_password
            )
        
        user.user_type = 'patient'
        user.is_active = True
        user.save()
        
        patient = Patient.objects.create(
            user=user,
            **validated_data
        )
        
        return patient


class ClinicalNoteSerializer(serializers.ModelSerializer):
    provider_name = serializers.SerializerMethodField()
    provider_type = serializers.CharField(source='provider.user_type', read_only=True)
    
    class Meta:
        model = ClinicalNote
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'provider')
    
    def get_provider_name(self, obj):
        if obj.provider:
            return f"{obj.provider.first_name} {obj.provider.last_name}".strip() or obj.provider.username
        return None