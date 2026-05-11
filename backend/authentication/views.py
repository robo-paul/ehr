# backend/authentication/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from knox.models import AuthToken
from .serializers import (
    LoginSerializer, RegisterPatientSerializer, RegisterStaffSerializer, 
    RegisterDoctorSerializer, UserSerializer
)
from django.contrib.auth import get_user_model

User = get_user_model()

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        token = AuthToken.objects.create(user)
        
        return Response({
            'token': token[1],
            'user': UserSerializer(user).data
        })

class RegisterPatientView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = RegisterPatientSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        token = AuthToken.objects.create(user)
        
        return Response({
            'token': token[1],
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)

class RegisterDoctorView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = RegisterDoctorSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        token = AuthToken.objects.create(user)
        
        response_data = {
            'token': token[1],
            'user': UserSerializer(user).data,
            'message': 'Doctor registration successful. Your account is pending verification.'
        }
        
        return Response(response_data, status=status.HTTP_201_CREATED)

class RegisterStaffView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Only admins can create staff users
        if request.user.user_type not in ['admin', 'master_admin']:
            return Response(
                {'error': 'You do not have permission to create staff users'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = RegisterStaffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        return Response({
            'user': UserSerializer(user).data,
            'message': f'{user.user_type} account created successfully.'
        }, status=status.HTTP_201_CREATED)

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)