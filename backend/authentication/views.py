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
        
        # Check if user is verified (for staff roles)
        if user.user_type != 'patient' and user.user_type != 'master_admin':
            if not user.is_verified:
                return Response(
                    {'error': 'Your account is pending verification. Please wait for admin approval.'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        token = AuthToken.objects.create(user)
        
        return Response({
            'token': token[1],
            'user': UserSerializer(user).data
        })


# backend/authentication/views.py
class RegisterPatientView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = RegisterPatientSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Patients are auto-verified - no approval needed
        user.is_verified = True
        user.role_request_status = 'approved'  # Or set to None
        user.is_active = True
        user.save()
        
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
        
        # Set role request status
        user.role_request_status = 'pending'
        user.requested_role = 'doctor'
        user.is_verified = False
        user.save()
        
        # Create notification for admins
        try:
            from notifications.models import Notification
            admins = User.objects.filter(user_type__in=['admin', 'master_admin'])
            for admin in admins:
                Notification.objects.create(
                    user=admin,
                    title="New Doctor Registration",
                    message=f"Dr. {user.get_full_name()} has registered and needs approval.",
                    type="system",
                    priority="high",
                    related_url="/admin/users"
                )
        except:
            pass
        
        return Response({
            'message': 'Doctor registration submitted. Please wait for admin approval.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class RegisterStaffView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = RegisterStaffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Set role request status
        user.role_request_status = 'pending'
        user.requested_role = user.user_type
        user.is_verified = False
        user.save()
        
        # Create notification for admins
        try:
            from notifications.models import Notification
            admins = User.objects.filter(user_type__in=['admin', 'master_admin'])
            for admin in admins:
                Notification.objects.create(
                    user=admin,
                    title=f"New {user.user_type.title()} Registration",
                    message=f"{user.get_full_name()} has registered as a {user.user_type} and needs approval.",
                    type="system",
                    priority="high",
                    related_url="/admin/users"
                )
        except:
            pass
        
        return Response({
            'message': f'Registration submitted as {user.user_type}. Please wait for admin approval.',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class RegisterAdminView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        # Only master admin can create other admins
        if request.user.user_type != 'master_admin':
            return Response(
                {'error': 'Only Master Admin can create admin users'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = RegisterStaffSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Admins are auto-verified
        user.is_verified = True
        user.role_request_status = 'approved'
        user.save()
        
        return Response({
            'user': UserSerializer(user).data,
            'message': f'Admin account created successfully.'
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


class PendingRoleRequestsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        # Only master admin can view pending requests
        if request.user.user_type != 'master_admin':
            return Response(
                {'error': 'Permission denied. Master Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        pending_users = User.objects.filter(
            role_request_status='pending',
            is_verified=False
        ).exclude(user_type='patient')
        
        serializer = UserSerializer(pending_users, many=True)
        return Response(serializer.data)


class ApproveRoleView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, user_id):
        # Only master admin can approve roles
        if request.user.user_type != 'master_admin':
            return Response(
                {'error': 'Permission denied. Master Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if user.role_request_status != 'pending':
            return Response(
                {'error': 'No pending role request for this user'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Approve the user
        user.is_verified = True
        user.role_request_status = 'approved'
        
        # Set the user type to the requested role if available
        if user.requested_role:
            user.user_type = user.requested_role
        
        # Set is_staff for admin/doctor/nurse roles
        if user.user_type in ['admin', 'doctor', 'nurse']:
            user.is_staff = True
        
        user.save()
        
        # Send notification to the user
        try:
            from notifications.models import Notification
            Notification.objects.create(
                user=user,
                title="Role Request Approved",
                message=f"Your request to become a {user.user_type.replace('_', ' ').title()} has been approved! You now have full access to the system.",
                type="system",
                priority="high",
                related_url="/dashboard"
            )
        except:
            pass
        
        return Response({
            'message': f'Role request approved for {user.username}',
            'user': UserSerializer(user).data
        })


class RejectRoleView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, user_id):
        # Only master admin can reject roles
        if request.user.user_type != 'master_admin':
            return Response(
                {'error': 'Permission denied. Master Admin access required.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if user.role_request_status != 'pending':
            return Response(
                {'error': 'No pending role request for this user'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Reject the user
        user.role_request_status = 'rejected'
        user.is_verified = False
        user.is_active = False  # Deactivate rejected users
        user.save()
        
        # Send notification to the user
        try:
            from notifications.models import Notification
            Notification.objects.create(
                user=user,
                title="Role Request Rejected",
                message="Your role request has been rejected. Please contact support for more information.",
                type="system",
                priority="high"
            )
        except:
            pass
        
        return Response({
            'message': f'Role request rejected for {user.username}'
        })