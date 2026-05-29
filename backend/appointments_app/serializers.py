# backend/appointments_app/serializers.py
from rest_framework import serializers
from django.utils import timezone
from .models import Appointment, AppointmentMessage, AppointmentFeedback
from patients.models import Patient
from django.contrib.auth import get_user_model

User = get_user_model()


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    provider_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ('created_at', 'updated_at', 'created_by')
    
    def get_patient_name(self, obj):
        return obj.patient.user.get_full_name() or obj.patient.user.username
    
    def get_provider_name(self, obj):
        return obj.provider.get_full_name() or obj.provider.username


class AppointmentCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['title', 'patient_suggested_date', 'reason', 'description', 
                  'appointment_type', 'estimated_duration', 'patient', 'provider']
    
    def validate_patient_suggested_date(self, value):
        if value < timezone.now():
            raise serializers.ValidationError("Appointment date cannot be in the past")
        return value
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        validated_data['status'] = 'requested'
        return super().create(validated_data)


class AppointmentUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Appointment
        fields = ['title', 'patient_suggested_date', 'reason', 'description', 
                  'appointment_type', 'estimated_duration', 'location']
    
    def validate_patient_suggested_date(self, value):
        if value and value < timezone.now():
            raise serializers.ValidationError("Appointment date cannot be in the past")
        return value


class AppointmentMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AppointmentMessage
        fields = '__all__'
        read_only_fields = ('created_at', 'sender')
    
    def get_sender_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username


class AppointmentFeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentFeedback
        fields = '__all__'
        read_only_fields = ('submitted_at',)