# backend/authentication/serializers.py
from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User
import re

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 
                  'user_type', 'phone', 'address', 'date_of_birth', 'gender', 
                  'is_verified', 'is_superuser', 'is_staff')
        read_only_fields = ('is_verified', 'is_superuser', 'is_staff')

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        user = authenticate(username=username, password=password)
        
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        
        # Set default user_type for superusers if not set
        if user.is_superuser and not user.user_type:
            user.user_type = 'master_admin'
            user.save()
        
        data['user'] = user
        return data

class RegisterPatientSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 
                  'phone', 'address', 'date_of_birth', 'gender')
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.user_type = 'patient'
        user.is_verified = True  # Auto-verify patients
        user.role_request_status = 'approved'  # No pending status
        user.save()
        return user

class RegisterDoctorSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    license_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    specialization = serializers.CharField(write_only=True, required=False, allow_blank=True)
    work_id = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 
                  'phone', 'address', 'date_of_birth', 'gender', 
                  'license_number', 'specialization', 'work_id')
    
    def validate_license_number(self, value):
        if value:
            # Optional validation only if value is provided
            pattern = r'^[A-Z]{2,3}-\d{4,6}$|^\d{6,10}$'
            if not re.match(pattern, value):
                raise serializers.ValidationError(
                    "License number must be in format: XX-12345 (2-3 letters followed by 4-6 digits) or 6-10 digits"
                )
        return value
    
    def create(self, validated_data):
        # Extract doctor-specific fields
        license_number = validated_data.pop('license_number', '')
        specialization = validated_data.pop('specialization', '')
        work_id = validated_data.pop('work_id', '')
        
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.user_type = 'doctor'
        user.is_verified = False
        user.save()
        
        # Store work_id if provided (you may need to add this field to User model)
        if work_id:
            user.work_id = work_id
            user.save()
        
        return user

class RegisterStaffSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 
                  'user_type', 'phone', 'address', 'work_id')
    
    def validate_user_type(self, value):
        allowed_types = ['nurse', 'pharmacist', 'radiologist', 'labscientist', 'admin']
        if value not in allowed_types:
            raise serializers.ValidationError(f"Invalid user type. Allowed: {', '.join(allowed_types)}")
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        user_type = validated_data.get('user_type', 'staff')
        work_id = validated_data.pop('work_id', '')
        
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.user_type = user_type
        user.is_verified = False
        user.is_staff = True if user_type in ['admin'] else False
        
        if work_id:
            user.work_id = work_id
            user.save()
        
        user.save()
        return user