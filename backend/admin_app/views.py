# backend/admin_app/views.py
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.db.models import Count, Q

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
                'date_joined': user.date_joined,
            })
        return Response(data)
    
    @action(detail=True, methods=['post'])
    def update_role(self, request, pk=None):
        try:
            user = User.objects.get(id=pk)
            new_role = request.data.get('user_type')
            
            if new_role not in ['patient', 'doctor', 'nurse', 'admin', 'pharmacist', 'radiologist', 'labscientist', 'master_admin']:
                return Response({'error': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
            
            user.user_type = new_role
            user.save()
            return Response({'message': f'Role updated to {new_role}'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def verify(self, request, pk=None):
        try:
            user = User.objects.get(id=pk)
            user.is_verified = True
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
        pending_verification = User.objects.filter(is_verified=False, is_active=True).exclude(user_type='patient').count()
        
        return Response({
            'total_users': total_users,
            'verified_users': verified_users,
            'active_users': active_users,
            'pending_verification': pending_verification,
        })