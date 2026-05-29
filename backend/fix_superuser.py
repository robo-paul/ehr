# backend/create_master_admin.py
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ehr_project.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

# Delete existing master_admin if exists
User.objects.filter(username='master_admin').delete()

# Create master admin
master_admin = User.objects.create_user(
    username='master_admin',
    email='master@ehrsystem.com',
    password='MasterAdmin123!',
    first_name='Master',
    last_name='Admin'
)

# Set admin flags
master_admin.is_superuser = True
master_admin.is_staff = True
master_admin.is_active = True
master_admin.user_type = 'master_admin'
master_admin.is_verified = True
master_admin.role_request_status = 'approved'

# Save with flags only (permissions will be set after save)
master_admin.save()

print("=" * 50)
print("✅ MASTER ADMIN CREATED SUCCESSFULLY!")
print("=" * 50)
print(f"Username: master_admin")
print(f"Password: MasterAdmin123!")
print(f"Email: master@ehrsystem.com")
print(f"User Type: {master_admin.user_type}")
print(f"Is Superuser: {master_admin.is_superuser}")
print("=" * 50)