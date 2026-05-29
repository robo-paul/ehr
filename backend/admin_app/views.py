# backend/admin_app/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone

User = get_user_model()


class IsMasterAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'master_admin'


class AdminUserViewSet(viewsets.ViewSet):
    permission_classes = [IsMasterAdmin]
    
    def list(self, request):
        users = User.objects.all().order_by('-date_joined')
        data = []
        for user in users:
            data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': user.user_type,
                'is_active': user.is_active,
                'is_verified': getattr(user, 'is_verified', False),
                'work_id': getattr(user, 'work_id', ''),
                'role_request_status': getattr(user, 'role_request_status', ''),
                'requested_role': getattr(user, 'requested_role', ''),
                'date_joined': user.date_joined,
            })
        return Response(data)
    
    @action(detail=True, methods=['post'])
    def approve_role(self, request, pk=None):
        """Approve a pending role request"""
        try:
            user = User.objects.get(id=pk)
            
            if user.role_request_status != 'pending':
                return Response(
                    {'error': 'No pending role request for this user'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Approve the user
            user.is_verified = True
            user.role_request_status = 'approved'
            
            # Set the user type to the requested role
            if user.requested_role:
                user.user_type = user.requested_role
            
            # Set is_staff for admin roles
            if user.user_type in ['admin', 'doctor', 'nurse']:
                user.is_staff = True
            
            user.save()
            
            # Create notification for the user
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
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'user_type': user.user_type,
                    'is_verified': user.is_verified
                }
            })
            
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def reject_role(self, request, pk=None):
        """Reject a pending role request"""
        try:
            user = User.objects.get(id=pk)
            
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
            
            # Create notification for the user
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
            
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def update_role(self, request, pk=None):
        try:
            user = User.objects.get(id=pk)
            new_role = request.data.get('user_type')
            
            if new_role not in ['patient', 'doctor', 'nurse', 'admin', 'pharmacist', 'radiologist', 'labscientist', 'master_admin']:
                return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
            
            user.user_type = new_role
            user.is_verified = True
            user.role_request_status = 'approved'
            
            if new_role in ['admin', 'doctor', 'nurse']:
                user.is_staff = True
            
            user.save()
            
            return Response({'message': f'Role updated to {new_role}'})
            
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        try:
            user = User.objects.get(id=pk)
            user.is_verified = True
            user.role_request_status = 'approved'
            user.save()
            return Response({'message': 'User verified successfully'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        try:
            user = User.objects.get(id=pk)
            user.is_active = False
            user.save()
            return Response({'message': 'User deactivated'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        try:
            user = User.objects.get(id=pk)
            user.is_active = True
            user.save()
            return Response({'message': 'User reactivated'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)


class AdminStatsViewSet(viewsets.ViewSet):
    permission_classes = [IsMasterAdmin]
    
    def list(self, request):
        total_users = User.objects.count()
        verified_users = User.objects.filter(is_verified=True).count()
        active_users = User.objects.filter(is_active=True).count()
        
        # Pending verifications (staff who need approval)
        pending_verification = User.objects.filter(
            is_verified=False, 
            is_active=True
        ).exclude(user_type='patient').count()
        
        # Pending role requests
        pending_role_requests = User.objects.filter(
            role_request_status='pending'
        ).count()
        
        # Role distribution
        role_distribution = User.objects.values('user_type').annotate(count=Count('id'))
        
        return Response({
            'total_users': total_users,
            'verified_users': verified_users,
            'active_users': active_users,
            'pending_verification': pending_verification,
            'pending_role_requests': pending_role_requests,
            'role_distribution': role_distribution,
        })