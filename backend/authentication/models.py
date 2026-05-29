# backend/authentication/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import Permission

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        ('patient', 'Patient'),
        ('doctor', 'Doctor'),
        ('nurse', 'Nurse'),
        ('pharmacist', 'Pharmacist'),
        ('radiologist', 'Radiologist'),
        ('labscientist', 'Lab Scientist'),
        ('admin', 'Admin'),
        ('master_admin', 'Master Admin'),
    )
    
    ROLE_REQUEST_STATUS = (
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    
    user_type = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='patient')
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], blank=True)
    is_verified = models.BooleanField(default=False)
    work_id = models.CharField(max_length=50, blank=True, null=True)
    role_request_status = models.CharField(max_length=20, choices=ROLE_REQUEST_STATUS, default='pending')
    requested_role = models.CharField(max_length=20, blank=True, null=True)
    specialization = models.CharField(max_length=100, blank=True)
    license_number = models.CharField(max_length=50, blank=True)
    
    def save(self, *args, **kwargs):
        # Superusers and master admins are always verified
        if self.is_superuser or self.user_type == 'master_admin':
            self.is_verified = True
            self.role_request_status = 'approved'
        
        # Patients are auto-verified - no approval needed
        if self.user_type == 'patient':
            self.is_verified = True
            self.role_request_status = 'approved'
        
        # Set proper permissions for master admin - ONLY AFTER SAVE (when ID exists)
        if self.user_type == 'master_admin' and self.pk:
            self.is_superuser = True
            self.is_staff = True
            
            # Grant all permissions to master admin (only if ID exists)
            self.user_permissions.set(Permission.objects.all())
        
        super().save(*args, **kwargs)
    
    def __str__(self):       
        return self.username