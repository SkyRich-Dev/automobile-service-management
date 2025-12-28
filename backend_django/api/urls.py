from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profiles', views.ProfileViewSet)
router.register(r'customers', views.CustomerViewSet)
router.register(r'vehicles', views.VehicleViewSet)
router.register(r'parts', views.PartViewSet)
router.register(r'job-cards', views.JobCardViewSet)
router.register(r'tasks', views.TaskViewSet)
router.register(r'task-parts', views.TaskPartViewSet)
router.register(r'timeline-events', views.TimelineEventViewSet)

urlpatterns = [
    # Auth endpoints
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/user/', views.current_user_view, name='current_user'),
    
    # Dashboard
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
    
    # ViewSet routes
    path('', include(router.urls)),
]
