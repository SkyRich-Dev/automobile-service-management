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

# Enhanced Inventory Module Routes
router.register(r'part-reservations', views.PartReservationViewSet, basename='part-reservations')
router.register(r'grns', views.GoodsReceiptNoteViewSet, basename='grns')
router.register(r'stock-transfers', views.StockTransferViewSet, basename='stock-transfers')
router.register(r'purchase-requisitions', views.PurchaseRequisitionViewSet, basename='purchase-requisitions')
router.register(r'supplier-performance', views.SupplierPerformanceViewSet, basename='supplier-performance')
router.register(r'inventory-alerts', views.InventoryAlertViewSet, basename='inventory-alerts')
router.register(r'inventory', views.InventoryViewSet, basename='inventory')

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

# Admin Panel Routes
router.register(r'departments', views.DepartmentViewSet, basename='departments')
router.register(r'employee-assignments', views.EmployeeAssignmentViewSet, basename='employee-assignments')
router.register(r'work-shifts', views.WorkShiftViewSet, basename='work-shifts')
router.register(r'attendance-records', views.AttendanceRecordViewSet, basename='attendance-records')
router.register(r'role-permissions', views.RolePermissionViewSet, basename='role-permissions')
router.register(r'email-configurations', views.EmailConfigurationViewSet, basename='email-configurations')
router.register(r'whatsapp-configurations', views.WhatsAppConfigurationViewSet, basename='whatsapp-configurations')
router.register(r'payment-gateway-configurations', views.PaymentGatewayConfigurationViewSet, basename='payment-gateway-configurations')
router.register(r'tally-configurations', views.TallyConfigurationViewSet, basename='tally-configurations')

# HRMS Module Routes
router.register(r'hrms/skills', views.SkillViewSet, basename='skills')
router.register(r'hrms/employee-skills', views.EmployeeSkillViewSet, basename='employee-skills')
router.register(r'hrms/employees', views.EmployeeHRViewSet, basename='hr-employees')
router.register(r'hrms/training-programs', views.TrainingProgramViewSet, basename='training-programs')
router.register(r'hrms/training-enrollments', views.TrainingEnrollmentViewSet, basename='training-enrollments')
router.register(r'hrms/incentive-rules', views.IncentiveRuleViewSet, basename='incentive-rules')
router.register(r'hrms/employee-incentives', views.EmployeeIncentiveViewSet, basename='employee-incentives')
router.register(r'hrms/leave-types', views.LeaveTypeViewSet, basename='leave-types')
router.register(r'hrms/leave-balances', views.LeaveBalanceViewSet, basename='leave-balances')
router.register(r'hrms/leave-requests', views.LeaveRequestViewSet, basename='leave-requests')
router.register(r'hrms/holidays', views.HolidayViewSet, basename='holidays')
router.register(r'hrms/shifts', views.HRShiftViewSet, basename='hr-shifts')
router.register(r'hrms/employee-shifts', views.EmployeeShiftViewSet, basename='employee-shifts')
router.register(r'hrms/attendance', views.HRAttendanceViewSet, basename='hr-attendance')
router.register(r'hrms/payroll', views.PayrollViewSet, basename='payroll')
router.register(r'hrms/skill-audit-logs', views.SkillAuditLogViewSet, basename='skill-audit-logs')
router.register(r'hrms/skill-matrix', views.SkillMatrixViewSet, basename='skill-matrix')
router.register(r'hrms/technician-match', views.TechnicianSkillMatchViewSet, basename='technician-match')

# Finance Module Routes
router.register(r'finance/accounts', views.AccountViewSet, basename='accounts')
router.register(r'finance/tax-rates', views.TaxRateViewSet, basename='tax-rates')
router.register(r'finance/enhanced-invoices', views.EnhancedInvoiceViewSet, basename='enhanced-invoices')
router.register(r'finance/invoice-lines', views.InvoiceLineViewSet, basename='invoice-lines')
router.register(r'finance/credit-notes', views.CreditNoteViewSet, basename='credit-notes')
router.register(r'finance/enhanced-payments', views.EnhancedPaymentViewSet, basename='enhanced-payments')
router.register(r'finance/expense-categories', views.ExpenseCategoryViewSet, basename='expense-categories')
router.register(r'finance/expenses', views.ExpenseViewSet, basename='expenses')
router.register(r'finance/journal-entries', views.JournalEntryViewSet, basename='journal-entries')
router.register(r'finance/ledger-entries', views.LedgerEntryViewSet, basename='ledger-entries')
router.register(r'finance/receivables', views.CustomerReceivableViewSet, basename='receivables')
router.register(r'finance/payables', views.VendorPayableViewSet, basename='payables')
router.register(r'finance/audit-logs', views.FinancialAuditLogViewSet, basename='finance-audit-logs')
router.register(r'finance/periods', views.FinancialPeriodViewSet, basename='financial-periods')
router.register(r'finance/budgets', views.BudgetEntryViewSet, basename='budget-entries')

# Configuration Management Routes
router.register(r'config/categories', views.ConfigCategoryViewSet, basename='config-categories')
router.register(r'config/options', views.ConfigOptionViewSet, basename='config-options')

# Admin Configuration Center Routes
router.register(r'admin-config/system-configs', views.SystemConfigViewSet, basename='system-configs')
router.register(r'admin-config/workflows', views.WorkflowConfigViewSet, basename='workflow-configs')
router.register(r'admin-config/approval-rules', views.ApprovalRuleViewSet, basename='approval-rules')
router.register(r'admin-config/notification-templates', views.NotificationTemplateViewSet, basename='notification-templates')
router.register(r'admin-config/notification-rules', views.NotificationRuleViewSet, basename='notification-rules')
router.register(r'admin-config/automation-rules', views.AutomationRuleViewSet, basename='automation-rules')
router.register(r'admin-config/delegations', views.DelegationRuleViewSet, basename='delegations')
router.register(r'admin-config/holiday-calendar', views.BranchHolidayCalendarViewSet, basename='holiday-calendar')
router.register(r'admin-config/operating-hours', views.OperatingHoursViewSet, basename='operating-hours')
router.register(r'admin-config/sla-configs', views.SLAConfigViewSet, basename='sla-configs')
router.register(r'admin-config/audit-logs', views.ConfigAuditLogViewSet, basename='config-audit-logs')
router.register(r'admin-config/menus', views.MenuConfigViewSet, basename='menu-configs')
router.register(r'admin-config/feature-flags', views.FeatureFlagViewSet, basename='feature-flags')
router.register(r'admin-config/dashboard', views.AdminConfigDashboardViewSet, basename='admin-config-dashboard')

# Localization & Currency Routes
router.register(r'currencies', views.CurrencyViewSet, basename='currencies')
router.register(r'languages', views.LanguageViewSet, basename='languages')
router.register(r'system-preferences', views.SystemPreferenceViewSet, basename='system-preferences')

# Cross-Module Integration Routes
router.register(r'integration', views.IntegrationViewSet, basename='integration')

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
    
    # Customer 360 Profile Routes
    path('customers/<int:pk>/360/overview/', views.CustomerProfile360ViewSet.as_view({'get': 'overview'}), name='customer_360_overview'),
    path('customers/<int:pk>/360/vehicles/', views.CustomerProfile360ViewSet.as_view({'get': 'vehicles'}), name='customer_360_vehicles'),
    path('customers/<int:pk>/360/service-history/', views.CustomerProfile360ViewSet.as_view({'get': 'service_history'}), name='customer_360_service_history'),
    path('customers/<int:pk>/360/invoices/', views.CustomerProfile360ViewSet.as_view({'get': 'invoices'}), name='customer_360_invoices'),
    path('customers/<int:pk>/360/contracts/', views.CustomerProfile360ViewSet.as_view({'get': 'contracts'}), name='customer_360_contracts'),
    path('customers/<int:pk>/360/communications/', views.CustomerProfile360ViewSet.as_view({'get': 'communications'}), name='customer_360_communications'),
    
    # Contract Detection
    path('contracts/detect/', views.detect_contract_view, name='detect_contract'),
    
    # Finance Module Views
    path('finance/dashboard/', views.finance_dashboard, name='finance_dashboard'),
    
    path('', include(router.urls)),
]
