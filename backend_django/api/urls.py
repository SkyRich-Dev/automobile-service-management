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
router.register(r'notifications', views.NotificationViewSet, basename='notifications')
router.register(r'contracts', views.ContractViewSet, basename='contracts')
router.register(r'suppliers', views.SupplierViewSet, basename='suppliers')
router.register(r'purchase-orders', views.PurchaseOrderViewSet, basename='purchase-orders')
router.register(r'technician-schedules', views.TechnicianScheduleViewSet, basename='technician-schedules')
router.register(r'appointments', views.AppointmentViewSet, basename='appointments')
router.register(r'analytics-snapshots', views.AnalyticsSnapshotViewSet, basename='analytics-snapshots')
router.register(r'licenses', views.LicenseViewSet, basename='licenses')
router.register(r'system-settings', views.SystemSettingViewSet, basename='system-settings')
router.register(r'payment-intents', views.PaymentIntentViewSet, basename='payment-intents')
router.register(r'tally-sync-jobs', views.TallySyncJobViewSet, basename='tally-sync-jobs')
router.register(r'tally-ledger-mappings', views.TallyLedgerMappingViewSet, basename='tally-ledger-mappings')
router.register(r'integrations', views.IntegrationConfigViewSet, basename='integrations')

# CRM Module Routes
router.register(r'leads', views.LeadViewSet, basename='leads')
router.register(r'customer-interactions', views.CustomerInteractionViewSet, basename='customer-interactions')
router.register(r'tickets', views.TicketViewSet, basename='tickets')
router.register(r'follow-up-tasks', views.FollowUpTaskViewSet, basename='follow-up-tasks')
router.register(r'campaigns', views.CampaignViewSet, basename='campaigns')
router.register(r'customer-scores', views.CustomerScoreViewSet, basename='customer-scores')
router.register(r'crm-events', views.CRMEventViewSet, basename='crm-events')

urlpatterns = [
    path('auth/register/', views.register_view, name='register'),
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/user/', views.current_user_view, name='current_user'),
    
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
    path('workflow/stages/', views.workflow_stages, name='workflow_stages'),
    path('analytics/summary/', views.analytics_summary, name='analytics_summary'),
    path('admin/dashboard/', views.admin_dashboard, name='admin_dashboard'),
    
    # CRM Module Views
    path('crm/dashboard/', views.crm_dashboard, name='crm_dashboard'),
    path('crm/customer-360/<int:customer_id>/', views.customer_360_view, name='customer_360'),
    
    path('', include(router.urls)),
]
