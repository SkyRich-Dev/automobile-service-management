import os
from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        from django.db import connection
        from django.db.utils import OperationalError, ProgrammingError
        
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1 FROM auth_user LIMIT 1")
            
            from django.contrib.auth.models import User
            from api.models import Profile, UserRole, Branch
            
            if not User.objects.filter(username='admin').exists():
                admin_password = os.environ.get('ADMIN_PASSWORD', 'Password@123')
                admin_user = User.objects.create_superuser(
                    username='admin',
                    email='admin@autoserv.app',
                    password=admin_password,
                    first_name='Super',
                    last_name='Admin'
                )
                
                default_branch = Branch.objects.first()
                
                Profile.objects.create(
                    user=admin_user,
                    role=UserRole.SUPER_ADMIN,
                    branch=default_branch,
                    employee_id='EMP-ADMIN-001',
                    phone='+91-9999999999',
                    is_available=True
                )
                print("Created default admin user with SUPER_ADMIN role: admin@autoserv.app")
            else:
                admin_user = User.objects.get(username='admin')
                if not hasattr(admin_user, 'profile') or admin_user.profile is None:
                    try:
                        admin_user.profile
                    except Profile.DoesNotExist:
                        default_branch = Branch.objects.first()
                        Profile.objects.create(
                            user=admin_user,
                            role=UserRole.SUPER_ADMIN,
                            branch=default_branch,
                            employee_id='EMP-ADMIN-001',
                            phone='+91-9999999999',
                            is_available=True
                        )
                        print("Created SUPER_ADMIN profile for existing admin user")
                else:
                    if admin_user.profile.role != UserRole.SUPER_ADMIN:
                        admin_user.profile.role = UserRole.SUPER_ADMIN
                        admin_user.profile.save()
                        print("Updated admin user to SUPER_ADMIN role")
                    else:
                        print("Admin user already exists with SUPER_ADMIN role")
        except (OperationalError, ProgrammingError) as e:
            pass
