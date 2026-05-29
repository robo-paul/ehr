# backend/chat/serializers.py
from rest_framework import serializers
from django.db.models import Q
from django.utils import timezone  # Add this import
from .models import Conversation, Message
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'full_name', 'user_type']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username

class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_type = serializers.CharField(source='sender.user_type', read_only=True)
    time_display = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'sender_type', 
                  'content', 'attachment', 'attachment_url', 'is_read', 'read_at', 
                  'created_at', 'time_display']
        read_only_fields = ['id', 'sender', 'created_at', 'read_at']
    
    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username
    
    def get_attachment_url(self, obj):
        if obj.attachment:
            return obj.attachment.url
        return None
    
    def get_time_display(self, obj):
        """Return formatted time display"""
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days == 0:
            return obj.created_at.strftime('%I:%M %p')
        elif diff.days == 1:
            return 'Yesterday'
        elif diff.days < 7:
            return obj.created_at.strftime('%A')
        else:
            return obj.created_at.strftime('%b %d')

class ConversationSerializer(serializers.ModelSerializer):
    other_participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    last_message_time = serializers.SerializerMethodField()
    last_message_time_display = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = ['id', 'other_participant', 'participant1', 'participant2',
                  'last_message', 'last_message_time', 'last_message_time_display',
                  'unread_count', 'created_at', 'updated_at']
    
    def get_other_participant(self, obj):
        request = self.context.get('request')
        if request and request.user:
            other_user = obj.get_other_participant(request.user)
            return UserSerializer(other_user).data
        return None
    
    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        return last_msg.content if last_msg else None
    
    def get_last_message_time(self, obj):
        last_msg = obj.messages.last()
        return last_msg.created_at if last_msg else None
    
    def get_last_message_time_display(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            now = timezone.now()
            diff = now - last_msg.created_at
            
            if diff.days == 0:
                return last_msg.created_at.strftime('%I:%M %p')
            elif diff.days == 1:
                return 'Yesterday'
            elif diff.days < 7:
                return last_msg.created_at.strftime('%A')
            else:
                return last_msg.created_at.strftime('%b %d')
        return None
    
    def get_unread_count(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.get_unread_count(request.user)
        return 0