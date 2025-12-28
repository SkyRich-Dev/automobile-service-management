from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'branches', views.BranchViewSet, basename='branches')
router.register(r'profiles', views.ProfileViewSet, basename='profiles')
router.register(r'customers', views.CustomerViewSet, basename='customers')
router.register(r'vehicles', views.VehicleViewSet, basename='vehicles')
router.register(r'parts', views.PartViewSet, basename='parts')
router.register(r'bays', views.BayViewSet, basename='bays')
router.register(r'job-cards', views.JobCardViewSet, basename='job-cards')
router.register(r'tasks', views.TaskViewSet, basename='tasks')
router.register(r'inspections', views.DigitalInspectionViewSet, basename='inspections')
router.register(r'estimates', views.EstimateViewSet, basename='estimates')
router.register(r'part-issues', views.PartIssueViewSet, basename='part-issues')
router.register(r'invoices', views.InvoiceViewSet, basename='invoices')
router.register(r'payments', views.PaymentViewSet, basename='payments')
router.register(r'service-events', views.ServiceEventViewSet, basename='service-events')
router.register(r'timeline-events', views.TimelineEventViewSet, basename='timeline-events')

urlpatterns = [
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/user/', views.current_user_view, name='current_user'),
    
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
    path('workflow/stages/', views.workflow_stages, name='workflow_stages'),
    
    path('', include(router.urls)),
]
