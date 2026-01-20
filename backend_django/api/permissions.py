from rest_framework import permissions
from .models import UserRole, RolePermission


class IsAdminConfig(permissions.BasePermission):
    """
    Permission class for Admin Configuration Center.
    Only SUPER_ADMIN and CEO_OWNER can access these endpoints.
    """
    ALLOWED_ROLES = [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER]
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        try:
            profile = request.user.profile
            return profile.role in self.ALLOWED_ROLES
        except:
            return False
    
    def has_object_permission(self, request, view, obj):
        return self.has_permission(request, view)


class RoleBasedPermission(permissions.BasePermission):
    """
    RBAC Permission class that checks user role against required permissions.
    """
    
    ROLE_HIERARCHY = {
        UserRole.SUPER_ADMIN: 100,
        UserRole.CEO_OWNER: 95,
        UserRole.REGIONAL_MANAGER: 90,
        UserRole.BRANCH_MANAGER: 85,
        UserRole.SERVICE_MANAGER: 80,
        UserRole.SALES_MANAGER: 78,
        UserRole.ACCOUNTS_MANAGER: 76,
        UserRole.SUPERVISOR: 72,
        UserRole.SERVICE_ADVISOR: 70,
        UserRole.SERVICE_ENGINEER: 68,
        UserRole.SALES_EXECUTIVE: 65,
        UserRole.ACCOUNTANT: 62,
        UserRole.INVENTORY_MANAGER: 60,
        UserRole.HR_MANAGER: 55,
        UserRole.TECHNICIAN: 50,
        UserRole.CRM_EXECUTIVE: 45,
        UserRole.CUSTOMER: 10,
    }
    
    RESOURCE_PERMISSIONS = {
        'branches': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.REGIONAL_MANAGER],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
        },
        'profiles': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                     UserRole.HR_MANAGER, UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER,
                     UserRole.ACCOUNTS_MANAGER],
            'retrieve': 'all_authenticated',
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.HR_MANAGER],
            'me': 'all_authenticated',
            'technicians': 'all_authenticated',
        },
        'customers': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                     UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SUPERVISOR,
                     UserRole.SERVICE_ADVISOR, UserRole.CRM_EXECUTIVE, UserRole.SALES_EXECUTIVE,
                     UserRole.SERVICE_ENGINEER, UserRole.ACCOUNTANT],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SUPERVISOR,
                         UserRole.SERVICE_ADVISOR, UserRole.SERVICE_ENGINEER,
                         UserRole.CRM_EXECUTIVE, UserRole.TECHNICIAN, UserRole.SALES_EXECUTIVE],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SUPERVISOR,
                       UserRole.SERVICE_ADVISOR, UserRole.CRM_EXECUTIVE, UserRole.SALES_EXECUTIVE,
                       UserRole.SERVICE_ENGINEER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR, UserRole.CRM_EXECUTIVE],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
        },
        'vehicles': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
        },
        'job-cards': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SUPERVISOR,
                       UserRole.SERVICE_ADVISOR, UserRole.SERVICE_ENGINEER, UserRole.TECHNICIAN],
            'transition': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                           UserRole.SERVICE_MANAGER, UserRole.ACCOUNTS_MANAGER, UserRole.SUPERVISOR,
                           UserRole.SERVICE_ADVISOR, UserRole.SERVICE_ENGINEER, UserRole.TECHNICIAN,
                           UserRole.ACCOUNTANT],
            'allowed_transitions': 'all_authenticated',
            'add_remark': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                           UserRole.SERVICE_MANAGER, UserRole.SUPERVISOR,
                           UserRole.SERVICE_ADVISOR, UserRole.SERVICE_ENGINEER, UserRole.TECHNICIAN],
            'notify_customer': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                                UserRole.SERVICE_MANAGER, UserRole.SUPERVISOR,
                                UserRole.SERVICE_ADVISOR, UserRole.CRM_EXECUTIVE],
            'escalate': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.SERVICE_MANAGER, UserRole.SUPERVISOR,
                         UserRole.SERVICE_ADVISOR, UserRole.SERVICE_ENGINEER, UserRole.TECHNICIAN],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
        },
        'tasks': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SUPERVISOR, UserRole.SERVICE_ADVISOR],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SUPERVISOR,
                       UserRole.SERVICE_ADVISOR, UserRole.SERVICE_ENGINEER, UserRole.TECHNICIAN],
            'start': [UserRole.SUPER_ADMIN, UserRole.SUPERVISOR, UserRole.SERVICE_ENGINEER, UserRole.TECHNICIAN],
            'complete': [UserRole.SUPER_ADMIN, UserRole.SUPERVISOR, UserRole.SERVICE_ENGINEER, UserRole.TECHNICIAN],
        },
        'estimates': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR],
            'approve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                        UserRole.SERVICE_MANAGER],
            'reject': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER,
                       UserRole.SERVICE_MANAGER],
        },
        'parts': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.INVENTORY_MANAGER, UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.INVENTORY_MANAGER, UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.INVENTORY_MANAGER],
        },
        'invoices': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                     UserRole.ACCOUNTS_MANAGER, UserRole.ACCOUNTANT, UserRole.SERVICE_ADVISOR],
            'retrieve': 'all_authenticated',
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.ACCOUNTS_MANAGER, UserRole.ACCOUNTANT],
        },
        'payments': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                     UserRole.ACCOUNTS_MANAGER, UserRole.ACCOUNTANT],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.ACCOUNTS_MANAGER, UserRole.ACCOUNTANT],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.ACCOUNTS_MANAGER, UserRole.ACCOUNTANT],
        },
        'bays': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER,
                       UserRole.SERVICE_MANAGER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER,
                       UserRole.SERVICE_MANAGER],
            'available': 'all_authenticated',
        },
        'inspections': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SUPERVISOR,
                       UserRole.SERVICE_ADVISOR, UserRole.SERVICE_ENGINEER, UserRole.TECHNICIAN],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SUPERVISOR,
                       UserRole.SERVICE_ADVISOR, UserRole.SERVICE_ENGINEER, UserRole.TECHNICIAN],
        },
        'part-issues': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.INVENTORY_MANAGER, UserRole.SUPERVISOR,
                       UserRole.SERVICE_ENGINEER, UserRole.TECHNICIAN],
        },
        'service-events': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
        },
        'timeline-events': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
        },
        'appointments': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR, UserRole.CRM_EXECUTIVE],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR],
            'confirm': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                        UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR, UserRole.CRM_EXECUTIVE],
            'check_in': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR],
            'cancel': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
        },
        'contracts': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'expiring_soon': 'all_authenticated',
        },
        'suppliers': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.INVENTORY_MANAGER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.INVENTORY_MANAGER],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
        },
        'purchase-orders': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.INVENTORY_MANAGER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.INVENTORY_MANAGER],
            'approve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER,
                        UserRole.ACCOUNTS_MANAGER],
            'receive': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                        UserRole.INVENTORY_MANAGER],
        },
        'notifications': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
            'mark_read': 'all_authenticated',
            'mark_all_read': 'all_authenticated',
        },
        'technician-schedules': {
            'list': 'all_authenticated',
            'retrieve': 'all_authenticated',
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SUPERVISOR, UserRole.SERVICE_ADVISOR],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SUPERVISOR, UserRole.SERVICE_ADVISOR],
        },
        'analytics-snapshots': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                     UserRole.REGIONAL_MANAGER, UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER,
                     UserRole.ACCOUNTS_MANAGER],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.REGIONAL_MANAGER, UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER,
                         UserRole.ACCOUNTS_MANAGER],
            'summary': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                        UserRole.REGIONAL_MANAGER, UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER,
                        UserRole.ACCOUNTS_MANAGER],
        },
        # CRM Module Resources
        'leads': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                     UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                     UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                         UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                       UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                       UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'transition': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                           UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                           UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE],
            'convert': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                        UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                        UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE],
            'pipeline': 'all_authenticated',
            'dashboard_stats': 'all_authenticated',
        },
        'customer-interactions': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                     UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                     UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                         UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                       UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                       UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE],
            'timeline': 'all_authenticated',
        },
        'tickets': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                     UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                     UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE, UserRole.SUPERVISOR],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                         UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE, UserRole.SUPERVISOR],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                       UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                       UserRole.CRM_EXECUTIVE],
            'assign': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER],
            'resolve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                        UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                        UserRole.CRM_EXECUTIVE],
            'escalate': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER],
            'close': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                      UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                      UserRole.CRM_EXECUTIVE],
            'dashboard_stats': 'all_authenticated',
        },
        'follow-up-tasks': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                     UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                     UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE, UserRole.SUPERVISOR],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                         UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE, UserRole.SUPERVISOR],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                       UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                       UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE],
            'complete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.SERVICE_ADVISOR,
                         UserRole.SALES_EXECUTIVE, UserRole.CRM_EXECUTIVE],
            'my_tasks': 'all_authenticated',
            'overdue': 'all_authenticated',
        },
        'campaigns': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                     UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.CRM_EXECUTIVE],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.CRM_EXECUTIVE],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.CRM_EXECUTIVE],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.CRM_EXECUTIVE],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'start': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                      UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.CRM_EXECUTIVE],
            'pause': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                      UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER],
            'complete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.CRM_EXECUTIVE],
            'recipients': 'all_authenticated',
        },
        'customer-scores': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                     UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.CRM_EXECUTIVE],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.CRM_EXECUTIVE],
            'recalculate': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                            UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER],
            'at_risk': 'all_authenticated',
        },
        'crm-events': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                     UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.CRM_EXECUTIVE],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.SERVICE_MANAGER, UserRole.SALES_MANAGER, UserRole.CRM_EXECUTIVE],
        },
        # Admin/System Resources
        'licenses': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'current': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
        },
        'system-settings': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
        },
        'payment-intents': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                     UserRole.ACCOUNTS_MANAGER, UserRole.ACCOUNTANT],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.ACCOUNTS_MANAGER, UserRole.ACCOUNTANT],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.ACCOUNTS_MANAGER, UserRole.ACCOUNTANT, UserRole.SERVICE_ADVISOR],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.ACCOUNTS_MANAGER],
        },
        'tally-sync-jobs': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                     UserRole.ACCOUNTS_MANAGER],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.ACCOUNTS_MANAGER],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.ACCOUNTS_MANAGER],
        },
        'tally-ledger-mappings': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                     UserRole.ACCOUNTS_MANAGER],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                         UserRole.ACCOUNTS_MANAGER],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.ACCOUNTS_MANAGER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, 
                       UserRole.ACCOUNTS_MANAGER],
        },
        'integrations': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'test_connection': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
        },
        # Admin Panel Resources
        'departments': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
        },
        'employee-assignments': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
        },
        'work-shifts': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
        },
        'attendance-records': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER],
            'retrieve': 'all_authenticated',
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER],
            'today': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.HR_MANAGER],
            'check_in': 'all_authenticated',
            'check_out': 'all_authenticated',
        },
        'role-permissions': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'bulk_update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
        },
        'email-configurations': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'test_connection': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
        },
        'whatsapp-configurations': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'test_connection': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
        },
        'payment-gateway-configurations': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.ACCOUNTS_MANAGER],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.ACCOUNTS_MANAGER],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'test_connection': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
        },
        'tally-configurations': {
            'list': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.ACCOUNTS_MANAGER],
            'retrieve': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER, UserRole.ACCOUNTS_MANAGER],
            'create': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'update': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
            'delete': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER],
            'test_connection': [UserRole.SUPER_ADMIN, UserRole.CEO_OWNER, UserRole.BRANCH_MANAGER],
        },
    }
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return True
        
        resource = getattr(view, 'basename', None)
        if not resource:
            return True
        
        action = view.action if hasattr(view, 'action') else None
        if not action:
            if request.method == 'GET':
                action = 'list' if not getattr(view, 'detail', True) else 'retrieve'
            elif request.method == 'POST':
                action = 'create'
            elif request.method in ['PUT', 'PATCH']:
                action = 'update'
            elif request.method == 'DELETE':
                action = 'delete'
        
        resource_perms = self.RESOURCE_PERMISSIONS.get(resource, {})
        action_perms = resource_perms.get(action, 'all_authenticated')
        
        if action_perms == 'all_authenticated':
            return True
        
        if isinstance(action_perms, list):
            allowed_roles = [r.value if hasattr(r, 'value') else r for r in action_perms]
            return profile.role in allowed_roles
        
        return True
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_superuser:
            return True
        
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return True
        
        if hasattr(obj, 'branch') and obj.branch:
            if profile.branch and profile.branch != obj.branch:
                if profile.role not in [UserRole.SUPER_ADMIN.value, UserRole.CEO_OWNER.value, 
                                         UserRole.REGIONAL_MANAGER.value, UserRole.BRANCH_MANAGER.value]:
                    return False
        
        return True


class IsAdminOrManager(permissions.BasePermission):
    """Permission class for admin and manager level access."""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return True
        return profile.role in [UserRole.SUPER_ADMIN.value, UserRole.CEO_OWNER.value, 
                                 UserRole.BRANCH_MANAGER.value, UserRole.REGIONAL_MANAGER.value,
                                 UserRole.SERVICE_MANAGER.value, UserRole.SALES_MANAGER.value,
                                 UserRole.ACCOUNTS_MANAGER.value]


class IsTechnicianOrAbove(permissions.BasePermission):
    """Permission for technician level and above."""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return True
        return profile.role in [UserRole.SUPER_ADMIN.value, UserRole.CEO_OWNER.value, 
                                 UserRole.BRANCH_MANAGER.value, UserRole.REGIONAL_MANAGER.value,
                                 UserRole.SERVICE_MANAGER.value, UserRole.SUPERVISOR.value,
                                 UserRole.SERVICE_ADVISOR.value, UserRole.SERVICE_ENGINEER.value,
                                 UserRole.TECHNICIAN.value]


class CanTransitionWorkflow(permissions.BasePermission):
    """Permission class for workflow stage transitions."""
    
    TRANSITION_PERMISSIONS = {
        'APPOINTMENT': [UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR, UserRole.CRM_EXECUTIVE],
        'CHECK_IN': [UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR],
        'INSPECTION': [UserRole.SERVICE_MANAGER, UserRole.SUPERVISOR, UserRole.SERVICE_ADVISOR, 
                       UserRole.SERVICE_ENGINEER, UserRole.TECHNICIAN],
        'JOB_CARD': [UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR],
        'ESTIMATE': [UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR],
        'APPROVAL': [UserRole.BRANCH_MANAGER, UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR],
        'EXECUTION': [UserRole.SUPERVISOR, UserRole.SERVICE_ENGINEER, UserRole.TECHNICIAN],
        'QC': [UserRole.SUPERVISOR, UserRole.SERVICE_ENGINEER, UserRole.TECHNICIAN, UserRole.SERVICE_ADVISOR],
        'BILLING': [UserRole.ACCOUNTS_MANAGER, UserRole.ACCOUNTANT, UserRole.SERVICE_ADVISOR],
        'DELIVERY': [UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR],
        'COMPLETED': [UserRole.SERVICE_MANAGER, UserRole.SERVICE_ADVISOR, UserRole.BRANCH_MANAGER],
    }
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return True
    
    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        
        profile = getattr(request.user, 'profile', None)
        if not profile:
            return True
        
        new_stage = request.data.get('new_stage', '')
        allowed_roles_enum = self.TRANSITION_PERMISSIONS.get(new_stage, [])
        allowed_roles = [r.value if hasattr(r, 'value') else r for r in allowed_roles_enum]
        
        if profile.role in [UserRole.SUPER_ADMIN.value, UserRole.CEO_OWNER.value, 
                            UserRole.BRANCH_MANAGER.value, UserRole.SERVICE_MANAGER.value]:
            return True
        
        return profile.role in allowed_roles
