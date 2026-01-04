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
            
            if not User.objects.filter(username='admin').exists():
                admin_password = os.environ.get('ADMIN_PASSWORD', 'Password@123')
                User.objects.create_superuser(
                    username='admin',
                    email='admin@autoserv.app',
                    password=admin_password,
                    first_name='Super',
                    last_name='Admin'
                )
                print("Created default admin user: admin@autoserv.app")
            else:
                print("Admin user already exists")
        except (OperationalError, ProgrammingError):
            pass
