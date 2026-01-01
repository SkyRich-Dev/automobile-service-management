"""
Enterprise Configuration Module
All domain constants, business rules, and configurable values are centralized here.
This module serves as the single source of truth for the application configuration.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Any, Optional
from enum import Enum


# =============================================================================
# USER ROLES CONFIGURATION
# =============================================================================

@dataclass
class RoleConfig:
    value: str
    label: str
    level: int  # Hierarchy level (lower = more privileged)
    department: str


ROLE_DEFINITIONS: Dict[str, RoleConfig] = {
    "SUPER_ADMIN": RoleConfig("SUPER_ADMIN", "Admin", 1, "Administration"),
    "CEO_OWNER": RoleConfig("CEO_OWNER", "CEO / Owner", 2, "Executive"),
    "REGIONAL_MANAGER": RoleConfig("REGIONAL_MANAGER", "Regional Manager", 3, "Management"),
    "BRANCH_MANAGER": RoleConfig("BRANCH_MANAGER", "Branch Manager", 4, "Management"),
    "SERVICE_MANAGER": RoleConfig("SERVICE_MANAGER", "Service Manager", 5, "Service"),
    "SALES_MANAGER": RoleConfig("SALES_MANAGER", "Sales Manager", 5, "Sales"),
    "ACCOUNTS_MANAGER": RoleConfig("ACCOUNTS_MANAGER", "Accounts Manager", 5, "Finance"),
    "SUPERVISOR": RoleConfig("SUPERVISOR", "Supervisor", 6, "Service"),
    "SERVICE_ADVISOR": RoleConfig("SERVICE_ADVISOR", "Service Advisor", 7, "Service"),
    "SERVICE_ENGINEER": RoleConfig("SERVICE_ENGINEER", "Service Engineer", 7, "Service"),
    "SALES_EXECUTIVE": RoleConfig("SALES_EXECUTIVE", "Sales Executive", 7, "Sales"),
    "ACCOUNTANT": RoleConfig("ACCOUNTANT", "Accountant", 7, "Finance"),
    "INVENTORY_MANAGER": RoleConfig("INVENTORY_MANAGER", "Inventory Manager", 7, "Inventory"),
    "HR_MANAGER": RoleConfig("HR_MANAGER", "HR Manager", 7, "HR"),
    "TECHNICIAN": RoleConfig("TECHNICIAN", "Technician / Mechanic", 8, "Service"),
    "CRM_EXECUTIVE": RoleConfig("CRM_EXECUTIVE", "CRM Executive", 7, "CRM"),
    "CUSTOMER": RoleConfig("CUSTOMER", "Customer", 10, "External"),
}

def get_role_choices() -> List[Tuple[str, str]]:
    """Generate Django choices from role definitions."""
    return [(key, config.label) for key, config in ROLE_DEFINITIONS.items()]

def get_role_hierarchy() -> Dict[str, int]:
    """Get role hierarchy levels."""
    return {key: config.level for key, config in ROLE_DEFINITIONS.items()}


# =============================================================================
# WORKFLOW CONFIGURATION
# =============================================================================

@dataclass
class WorkflowStageConfig:
    value: str
    label: str
    description: str
    order: int
    color: str
    icon: str


WORKFLOW_STAGE_DEFINITIONS: Dict[str, WorkflowStageConfig] = {
    "APPOINTMENT": WorkflowStageConfig("APPOINTMENT", "Appointment", "Customer books service", 1, "blue", "calendar"),
    "CHECK_IN": WorkflowStageConfig("CHECK_IN", "Check-in", "Vehicle received at branch", 2, "cyan", "log-in"),
    "INSPECTION": WorkflowStageConfig("INSPECTION", "Digital Inspection", "Multi-point inspection", 3, "teal", "search"),
    "JOB_CARD": WorkflowStageConfig("JOB_CARD", "Job Card Created", "Service order created", 4, "emerald", "file-text"),
    "ESTIMATE": WorkflowStageConfig("ESTIMATE", "Estimate Prepared", "Cost estimate prepared", 5, "green", "calculator"),
    "APPROVAL": WorkflowStageConfig("APPROVAL", "Customer Approval", "Customer approves work", 6, "lime", "check-circle"),
    "EXECUTION": WorkflowStageConfig("EXECUTION", "Task Execution", "Technicians perform work", 7, "yellow", "wrench"),
    "QC": WorkflowStageConfig("QC", "Quality Check", "Quality control inspection", 8, "amber", "clipboard-check"),
    "BILLING": WorkflowStageConfig("BILLING", "Billing", "Invoice generated", 9, "orange", "credit-card"),
    "DELIVERY": WorkflowStageConfig("DELIVERY", "Delivery", "Vehicle delivered", 10, "red", "truck"),
    "COMPLETED": WorkflowStageConfig("COMPLETED", "Service Completed", "Service cycle closed", 11, "slate", "check-square"),
}

def get_workflow_choices() -> List[Tuple[str, str]]:
    """Generate Django choices from workflow stage definitions."""
    return [(key, config.label) for key, config in WORKFLOW_STAGE_DEFINITIONS.items()]

# Workflow transitions define valid state changes
WORKFLOW_TRANSITION_RULES: Dict[str, List[str]] = {
    "APPOINTMENT": ["CHECK_IN"],
    "CHECK_IN": ["INSPECTION"],
    "INSPECTION": ["JOB_CARD"],
    "JOB_CARD": ["ESTIMATE"],
    "ESTIMATE": ["APPROVAL"],
    "APPROVAL": ["EXECUTION", "ESTIMATE"],
    "EXECUTION": ["QC"],
    "QC": ["BILLING", "EXECUTION"],
    "BILLING": ["DELIVERY"],
    "DELIVERY": ["COMPLETED"],
    "COMPLETED": [],
}


# =============================================================================
# TASK STATUS CONFIGURATION
# =============================================================================

@dataclass
class StatusConfig:
    value: str
    label: str
    is_terminal: bool = False


TASK_STATUS_DEFINITIONS: Dict[str, StatusConfig] = {
    "PENDING": StatusConfig("PENDING", "Pending"),
    "ASSIGNED": StatusConfig("ASSIGNED", "Assigned"),
    "IN_PROGRESS": StatusConfig("IN_PROGRESS", "In Progress"),
    "PAUSED": StatusConfig("PAUSED", "Paused"),
    "COMPLETED": StatusConfig("COMPLETED", "Completed", True),
    "QC_PASSED": StatusConfig("QC_PASSED", "QC Passed", True),
    "QC_FAILED": StatusConfig("QC_FAILED", "QC Failed"),
    "REJECTED": StatusConfig("REJECTED", "Rejected", True),
}

def get_task_status_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in TASK_STATUS_DEFINITIONS.items()]


# =============================================================================
# APPROVAL STATUS CONFIGURATION
# =============================================================================

APPROVAL_STATUS_DEFINITIONS: Dict[str, StatusConfig] = {
    "PENDING": StatusConfig("PENDING", "Pending"),
    "APPROVED": StatusConfig("APPROVED", "Approved", True),
    "REJECTED": StatusConfig("REJECTED", "Rejected", True),
    "REVISION_REQUESTED": StatusConfig("REVISION_REQUESTED", "Revision Requested"),
}

def get_approval_status_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in APPROVAL_STATUS_DEFINITIONS.items()]


# =============================================================================
# PRIORITY CONFIGURATION
# =============================================================================

@dataclass
class PriorityConfig:
    value: str
    label: str
    level: int  # Lower = higher priority
    sla_multiplier: float  # SLA time multiplier


PRIORITY_DEFINITIONS: Dict[str, PriorityConfig] = {
    "CRITICAL": PriorityConfig("CRITICAL", "Critical", 1, 0.5),
    "HIGH": PriorityConfig("HIGH", "High", 2, 0.75),
    "NORMAL": PriorityConfig("NORMAL", "Normal", 3, 1.0),
    "LOW": PriorityConfig("LOW", "Low", 4, 1.5),
}

def get_priority_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in PRIORITY_DEFINITIONS.items()]


# =============================================================================
# SERVICE EVENT TYPES CONFIGURATION
# =============================================================================

@dataclass
class EventTypeConfig:
    value: str
    label: str
    description: str
    is_system: bool = False


SERVICE_EVENT_DEFINITIONS: Dict[str, EventTypeConfig] = {
    "WORKFLOW_TRANSITION": EventTypeConfig("WORKFLOW_TRANSITION", "Stage Change", "Workflow stage transition"),
    "TASK_ASSIGNED": EventTypeConfig("TASK_ASSIGNED", "Task Assigned", "Task assigned to technician"),
    "TASK_STARTED": EventTypeConfig("TASK_STARTED", "Task Started", "Technician started work"),
    "TASK_COMPLETED": EventTypeConfig("TASK_COMPLETED", "Task Completed", "Task marked complete"),
    "TASK_PAUSED": EventTypeConfig("TASK_PAUSED", "Task Paused", "Task paused"),
    "PART_REQUESTED": EventTypeConfig("PART_REQUESTED", "Part Requested", "Part requested from inventory"),
    "PART_ISSUED": EventTypeConfig("PART_ISSUED", "Part Issued", "Part issued to job"),
    "REMARK_ADDED": EventTypeConfig("REMARK_ADDED", "Remark Added", "Comment or note added"),
    "CUSTOMER_NOTIFIED": EventTypeConfig("CUSTOMER_NOTIFIED", "Customer Notified", "Customer was notified"),
    "ESTIMATE_CREATED": EventTypeConfig("ESTIMATE_CREATED", "Estimate Created", "Cost estimate created"),
    "ESTIMATE_APPROVED": EventTypeConfig("ESTIMATE_APPROVED", "Estimate Approved", "Customer approved estimate"),
    "PAYMENT_RECEIVED": EventTypeConfig("PAYMENT_RECEIVED", "Payment Received", "Payment received"),
    "QC_PASSED": EventTypeConfig("QC_PASSED", "QC Passed", "Quality check passed"),
    "QC_FAILED": EventTypeConfig("QC_FAILED", "QC Failed", "Quality check failed"),
    "ESCALATION": EventTypeConfig("ESCALATION", "Escalation", "Job was escalated"),
    "AI_INSIGHT": EventTypeConfig("AI_INSIGHT", "AI Insight", "AI-generated insight", True),
    "INSPECTION_COMPLETED": EventTypeConfig("INSPECTION_COMPLETED", "Inspection Completed", "Digital inspection completed"),
}

def get_event_type_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in SERVICE_EVENT_DEFINITIONS.items()]


# =============================================================================
# JOB TYPE CONFIGURATION
# =============================================================================

JOB_TYPE_DEFINITIONS: Dict[str, StatusConfig] = {
    "GENERAL_SERVICE": StatusConfig("GENERAL_SERVICE", "General Service"),
    "REPAIR": StatusConfig("REPAIR", "Repair"),
    "BODY_PAINT": StatusConfig("BODY_PAINT", "Body & Paint"),
    "ACCIDENT": StatusConfig("ACCIDENT", "Accident Repair"),
    "WARRANTY": StatusConfig("WARRANTY", "Warranty Work"),
    "AMC": StatusConfig("AMC", "AMC Service"),
    "INSURANCE": StatusConfig("INSURANCE", "Insurance Claim"),
    "PRE_DELIVERY": StatusConfig("PRE_DELIVERY", "Pre-Delivery Inspection"),
    "ACCESSORIES": StatusConfig("ACCESSORIES", "Accessories Fitment"),
}

def get_job_type_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in JOB_TYPE_DEFINITIONS.items()]


# =============================================================================
# CUSTOMER CATEGORY CONFIGURATION
# =============================================================================

CUSTOMER_CATEGORY_DEFINITIONS: Dict[str, StatusConfig] = {
    "RETAIL": StatusConfig("RETAIL", "Retail"),
    "FLEET": StatusConfig("FLEET", "Fleet"),
    "VIP": StatusConfig("VIP", "VIP"),
    "CORPORATE": StatusConfig("CORPORATE", "Corporate"),
    "WALK_IN": StatusConfig("WALK_IN", "Walk-in"),
}

def get_customer_category_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in CUSTOMER_CATEGORY_DEFINITIONS.items()]


# =============================================================================
# COMMUNICATION CHANNEL CONFIGURATION
# =============================================================================

COMMUNICATION_CHANNEL_DEFINITIONS: Dict[str, StatusConfig] = {
    "PHONE": StatusConfig("PHONE", "Phone"),
    "EMAIL": StatusConfig("EMAIL", "Email"),
    "WHATSAPP": StatusConfig("WHATSAPP", "WhatsApp"),
    "SMS": StatusConfig("SMS", "SMS"),
    "IN_APP": StatusConfig("IN_APP", "In-App"),
}

def get_communication_channel_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in COMMUNICATION_CHANNEL_DEFINITIONS.items()]


# =============================================================================
# CONTRACT CONFIGURATION
# =============================================================================

CONTRACT_STATUS_DEFINITIONS: Dict[str, StatusConfig] = {
    "DRAFT": StatusConfig("DRAFT", "Draft"),
    "PENDING_APPROVAL": StatusConfig("PENDING_APPROVAL", "Pending Approval"),
    "ACTIVE": StatusConfig("ACTIVE", "Active"),
    "SUSPENDED": StatusConfig("SUSPENDED", "Suspended"),
    "EXPIRED": StatusConfig("EXPIRED", "Expired", True),
    "TERMINATED": StatusConfig("TERMINATED", "Terminated", True),
}

CONTRACT_TYPE_DEFINITIONS: Dict[str, StatusConfig] = {
    "WARRANTY": StatusConfig("WARRANTY", "Warranty"),
    "EXTENDED_WARRANTY": StatusConfig("EXTENDED_WARRANTY", "Extended Warranty"),
    "AMC": StatusConfig("AMC", "Annual Maintenance Contract"),
    "SERVICE_PACKAGE": StatusConfig("SERVICE_PACKAGE", "Service Package"),
    "INSURANCE": StatusConfig("INSURANCE", "Insurance"),
    "FLEET": StatusConfig("FLEET", "Fleet Contract"),
    "SUBSCRIPTION": StatusConfig("SUBSCRIPTION", "Subscription"),
    "CORPORATE": StatusConfig("CORPORATE", "Corporate Agreement"),
    "OEM_DEALER": StatusConfig("OEM_DEALER", "OEM Dealer Agreement"),
    "CUSTOM": StatusConfig("CUSTOM", "Custom Contract"),
}

def get_contract_status_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in CONTRACT_STATUS_DEFINITIONS.items()]

def get_contract_type_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in CONTRACT_TYPE_DEFINITIONS.items()]


# =============================================================================
# CRM CONFIGURATION
# =============================================================================

LEAD_STATUS_DEFINITIONS: Dict[str, StatusConfig] = {
    "NEW": StatusConfig("NEW", "New"),
    "CONTACTED": StatusConfig("CONTACTED", "Contacted"),
    "QUALIFIED": StatusConfig("QUALIFIED", "Qualified"),
    "QUOTED": StatusConfig("QUOTED", "Quoted"),
    "NEGOTIATION": StatusConfig("NEGOTIATION", "Negotiation"),
    "CONVERTED": StatusConfig("CONVERTED", "Converted", True),
    "LOST": StatusConfig("LOST", "Lost", True),
}

INTERACTION_TYPE_DEFINITIONS: Dict[str, StatusConfig] = {
    "CALL": StatusConfig("CALL", "Phone Call"),
    "SMS": StatusConfig("SMS", "SMS"),
    "EMAIL": StatusConfig("EMAIL", "Email"),
    "WHATSAPP": StatusConfig("WHATSAPP", "WhatsApp"),
    "VISIT": StatusConfig("VISIT", "Branch Visit"),
    "MEETING": StatusConfig("MEETING", "Meeting"),
    "CALLBACK": StatusConfig("CALLBACK", "Callback"),
    "FOLLOW_UP": StatusConfig("FOLLOW_UP", "Follow-up"),
    "COMPLAINT": StatusConfig("COMPLAINT", "Complaint"),
    "FEEDBACK": StatusConfig("FEEDBACK", "Feedback"),
    "ENQUIRY": StatusConfig("ENQUIRY", "Enquiry"),
    "QUOTE_SENT": StatusConfig("QUOTE_SENT", "Quote Sent"),
    "DEAL_CLOSED": StatusConfig("DEAL_CLOSED", "Deal Closed"),
    "DEAL_LOST": StatusConfig("DEAL_LOST", "Deal Lost"),
}

TICKET_STATUS_DEFINITIONS: Dict[str, StatusConfig] = {
    "OPEN": StatusConfig("OPEN", "Open"),
    "ASSIGNED": StatusConfig("ASSIGNED", "Assigned"),
    "IN_PROGRESS": StatusConfig("IN_PROGRESS", "In Progress"),
    "PENDING_CUSTOMER": StatusConfig("PENDING_CUSTOMER", "Pending Customer"),
    "RESOLVED": StatusConfig("RESOLVED", "Resolved"),
    "CLOSED": StatusConfig("CLOSED", "Closed", True),
    "REOPENED": StatusConfig("REOPENED", "Reopened"),
}

def get_lead_status_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in LEAD_STATUS_DEFINITIONS.items()]

def get_interaction_type_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in INTERACTION_TYPE_DEFINITIONS.items()]

def get_ticket_status_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in TICKET_STATUS_DEFINITIONS.items()]


# =============================================================================
# INVENTORY CONFIGURATION
# =============================================================================

ITEM_TYPE_DEFINITIONS: Dict[str, StatusConfig] = {
    "SPARE_PART": StatusConfig("SPARE_PART", "Spare Part"),
    "CONSUMABLE": StatusConfig("CONSUMABLE", "Consumable"),
    "LUBRICANT": StatusConfig("LUBRICANT", "Lubricant"),
    "ACCESSORY": StatusConfig("ACCESSORY", "Accessory"),
    "TOOL": StatusConfig("TOOL", "Tool"),
}

VALUATION_METHOD_DEFINITIONS: Dict[str, StatusConfig] = {
    "FIFO": StatusConfig("FIFO", "First In First Out"),
    "LIFO": StatusConfig("LIFO", "Last In First Out"),
    "WEIGHTED_AVG": StatusConfig("WEIGHTED_AVG", "Weighted Average"),
    "STANDARD": StatusConfig("STANDARD", "Standard Cost"),
}

TRANSFER_STATUS_DEFINITIONS: Dict[str, StatusConfig] = {
    "DRAFT": StatusConfig("DRAFT", "Draft"),
    "PENDING_APPROVAL": StatusConfig("PENDING_APPROVAL", "Pending Approval"),
    "APPROVED": StatusConfig("APPROVED", "Approved"),
    "IN_TRANSIT": StatusConfig("IN_TRANSIT", "In Transit"),
    "RECEIVED": StatusConfig("RECEIVED", "Received", True),
    "CANCELLED": StatusConfig("CANCELLED", "Cancelled", True),
}

GRN_STATUS_DEFINITIONS: Dict[str, StatusConfig] = {
    "DRAFT": StatusConfig("DRAFT", "Draft"),
    "PENDING_INSPECTION": StatusConfig("PENDING_INSPECTION", "Pending Inspection"),
    "INSPECTED": StatusConfig("INSPECTED", "Inspected"),
    "ACCEPTED": StatusConfig("ACCEPTED", "Accepted", True),
    "REJECTED": StatusConfig("REJECTED", "Rejected", True),
}

ALERT_TYPE_DEFINITIONS: Dict[str, StatusConfig] = {
    "LOW_STOCK": StatusConfig("LOW_STOCK", "Low Stock"),
    "OVERSTOCK": StatusConfig("OVERSTOCK", "Overstock"),
    "EXPIRY_WARNING": StatusConfig("EXPIRY_WARNING", "Expiry Warning"),
    "REORDER_POINT": StatusConfig("REORDER_POINT", "Reorder Point"),
}

def get_item_type_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in ITEM_TYPE_DEFINITIONS.items()]

def get_valuation_method_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in VALUATION_METHOD_DEFINITIONS.items()]


# =============================================================================
# NOTIFICATION CONFIGURATION
# =============================================================================

NOTIFICATION_TYPE_DEFINITIONS: Dict[str, StatusConfig] = {
    "INFO": StatusConfig("INFO", "Information"),
    "SUCCESS": StatusConfig("SUCCESS", "Success"),
    "WARNING": StatusConfig("WARNING", "Warning"),
    "ERROR": StatusConfig("ERROR", "Error"),
    "ACTION_REQUIRED": StatusConfig("ACTION_REQUIRED", "Action Required"),
}

def get_notification_type_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in NOTIFICATION_TYPE_DEFINITIONS.items()]


# =============================================================================
# APPOINTMENT CONFIGURATION
# =============================================================================

APPOINTMENT_STATUS_DEFINITIONS: Dict[str, StatusConfig] = {
    "SCHEDULED": StatusConfig("SCHEDULED", "Scheduled"),
    "CONFIRMED": StatusConfig("CONFIRMED", "Confirmed"),
    "CANCELLED": StatusConfig("CANCELLED", "Cancelled", True),
    "NO_SHOW": StatusConfig("NO_SHOW", "No Show", True),
    "CHECKED_IN": StatusConfig("CHECKED_IN", "Checked In", True),
}

def get_appointment_status_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in APPOINTMENT_STATUS_DEFINITIONS.items()]


# =============================================================================
# VEHICLE CONFIGURATION
# =============================================================================

FUEL_TYPE_DEFINITIONS: Dict[str, StatusConfig] = {
    "PETROL": StatusConfig("PETROL", "Petrol"),
    "DIESEL": StatusConfig("DIESEL", "Diesel"),
    "CNG": StatusConfig("CNG", "CNG"),
    "LPG": StatusConfig("LPG", "LPG"),
    "ELECTRIC": StatusConfig("ELECTRIC", "Electric"),
    "HYBRID": StatusConfig("HYBRID", "Hybrid"),
}

TRANSMISSION_TYPE_DEFINITIONS: Dict[str, StatusConfig] = {
    "MANUAL": StatusConfig("MANUAL", "Manual"),
    "AUTOMATIC": StatusConfig("AUTOMATIC", "Automatic"),
    "CVT": StatusConfig("CVT", "CVT"),
    "AMT": StatusConfig("AMT", "AMT"),
    "DCT": StatusConfig("DCT", "DCT"),
}

def get_fuel_type_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in FUEL_TYPE_DEFINITIONS.items()]

def get_transmission_type_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in TRANSMISSION_TYPE_DEFINITIONS.items()]


# =============================================================================
# PAYMENT CONFIGURATION
# =============================================================================

PAYMENT_MODE_DEFINITIONS: Dict[str, StatusConfig] = {
    "CASH": StatusConfig("CASH", "Cash"),
    "CARD": StatusConfig("CARD", "Card"),
    "UPI": StatusConfig("UPI", "UPI"),
    "NETBANKING": StatusConfig("NETBANKING", "Net Banking"),
    "CHEQUE": StatusConfig("CHEQUE", "Cheque"),
    "CREDIT": StatusConfig("CREDIT", "Credit"),
    "WALLET": StatusConfig("WALLET", "Wallet"),
}

PAYMENT_STATUS_DEFINITIONS: Dict[str, StatusConfig] = {
    "PENDING": StatusConfig("PENDING", "Pending"),
    "COMPLETED": StatusConfig("COMPLETED", "Completed", True),
    "FAILED": StatusConfig("FAILED", "Failed", True),
    "REFUNDED": StatusConfig("REFUNDED", "Refunded", True),
    "PARTIAL": StatusConfig("PARTIAL", "Partial"),
}

def get_payment_mode_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in PAYMENT_MODE_DEFINITIONS.items()]

def get_payment_status_choices() -> List[Tuple[str, str]]:
    return [(key, config.label) for key, config in PAYMENT_STATUS_DEFINITIONS.items()]


# =============================================================================
# BUSINESS RULES CONFIGURATION
# =============================================================================

@dataclass
class BusinessRulesConfig:
    default_sla_hours: int = 24
    critical_sla_hours: int = 4
    high_sla_hours: int = 8
    normal_sla_hours: int = 24
    low_sla_hours: int = 48
    max_escalation_level: int = 3
    default_currency: str = "INR"
    default_country: str = "India"
    default_timezone: str = "Asia/Kolkata"
    decimal_precision: int = 2
    max_decimal_digits: int = 12
    pagination_default_limit: int = 20
    pagination_max_limit: int = 100
    password_min_length: int = 8
    session_timeout_minutes: int = 480
    otp_expiry_minutes: int = 10
    invoice_prefix: str = "INV"
    job_card_prefix: str = "JC"
    customer_id_prefix: str = "CUST"
    po_prefix: str = "PO"
    grn_prefix: str = "GRN"


BUSINESS_RULES = BusinessRulesConfig()


# =============================================================================
# PERMISSIONS CONFIGURATION
# =============================================================================

# Role hierarchy for permission checks (lower level = higher privilege)
ROLE_HIERARCHY_CONFIG: Dict[str, int] = {
    role: config.level for role, config in ROLE_DEFINITIONS.items()
}

# Roles that can perform management actions
MANAGEMENT_ROLES = [
    "SUPER_ADMIN", "CEO_OWNER", "REGIONAL_MANAGER", "BRANCH_MANAGER",
    "SERVICE_MANAGER", "SALES_MANAGER", "ACCOUNTS_MANAGER"
]

# Roles that can perform service operations
SERVICE_ROLES = [
    "SUPER_ADMIN", "CEO_OWNER", "BRANCH_MANAGER", "SERVICE_MANAGER",
    "SUPERVISOR", "SERVICE_ADVISOR", "SERVICE_ENGINEER", "TECHNICIAN"
]

# Roles that can access financial data
FINANCE_ROLES = [
    "SUPER_ADMIN", "CEO_OWNER", "BRANCH_MANAGER", "ACCOUNTS_MANAGER", "ACCOUNTANT"
]

# Roles that can access CRM features
CRM_ROLES = [
    "SUPER_ADMIN", "CEO_OWNER", "BRANCH_MANAGER", "SERVICE_MANAGER",
    "SALES_MANAGER", "SERVICE_ADVISOR", "SALES_EXECUTIVE", "CRM_EXECUTIVE"
]

# Roles that can manage inventory
INVENTORY_ROLES = [
    "SUPER_ADMIN", "CEO_OWNER", "BRANCH_MANAGER", "INVENTORY_MANAGER"
]

# Action permissions by role
ACTION_PERMISSIONS_CONFIG: Dict[str, Dict[str, List[str]]] = {
    "job_cards": {
        "view": SERVICE_ROLES + ["CUSTOMER"],
        "create": ["SUPER_ADMIN", "CEO_OWNER", "BRANCH_MANAGER", "SERVICE_MANAGER", "SERVICE_ADVISOR"],
        "edit": ["SUPER_ADMIN", "CEO_OWNER", "BRANCH_MANAGER", "SERVICE_MANAGER", "SUPERVISOR", "SERVICE_ADVISOR"],
        "delete": ["SUPER_ADMIN", "CEO_OWNER"],
        "transition": SERVICE_ROLES,
        "add_remark": SERVICE_ROLES,
        "notify_customer": CRM_ROLES,
        "escalate": SERVICE_ROLES,
    },
    "customers": {
        "view": CRM_ROLES + SERVICE_ROLES,
        "create": CRM_ROLES,
        "edit": CRM_ROLES,
        "delete": ["SUPER_ADMIN", "CEO_OWNER", "BRANCH_MANAGER"],
    },
    "inventory": {
        "view": INVENTORY_ROLES + SERVICE_ROLES,
        "create": INVENTORY_ROLES,
        "edit": INVENTORY_ROLES,
        "delete": ["SUPER_ADMIN", "CEO_OWNER", "INVENTORY_MANAGER"],
        "transfer": INVENTORY_ROLES,
    },
    "finance": {
        "view": FINANCE_ROLES,
        "create": FINANCE_ROLES,
        "edit": ["SUPER_ADMIN", "CEO_OWNER", "ACCOUNTS_MANAGER"],
        "delete": ["SUPER_ADMIN", "CEO_OWNER"],
        "approve": ["SUPER_ADMIN", "CEO_OWNER", "ACCOUNTS_MANAGER"],
    },
}


# =============================================================================
# API RESPONSE CONFIGURATION
# =============================================================================

@dataclass
class ApiResponseConfig:
    success_code: int = 200
    created_code: int = 201
    accepted_code: int = 202
    no_content_code: int = 204
    bad_request_code: int = 400
    unauthorized_code: int = 401
    forbidden_code: int = 403
    not_found_code: int = 404
    conflict_code: int = 409
    unprocessable_code: int = 422
    server_error_code: int = 500


API_RESPONSE_CONFIG = ApiResponseConfig()


# Error message templates
ERROR_MESSAGES = {
    "not_found": "{resource} not found",
    "already_exists": "{resource} already exists",
    "invalid_transition": "Cannot transition from {from_stage} to {to_stage}",
    "permission_denied": "You do not have permission to {action}",
    "validation_error": "Validation failed: {details}",
    "authentication_required": "Authentication required",
    "invalid_credentials": "Invalid credentials",
    "account_disabled": "Account is disabled",
    "operation_failed": "Operation failed: {reason}",
    "invalid_request": "Invalid request: {details}",
}

# Success message templates
SUCCESS_MESSAGES = {
    "created": "{resource} created successfully",
    "updated": "{resource} updated successfully",
    "deleted": "{resource} deleted successfully",
    "transition_success": "Successfully transitioned to {stage}",
    "action_success": "{action} completed successfully",
    "login_success": "Login successful",
    "logout_success": "Logout successful",
}


# =============================================================================
# EXPORT ALL CONFIGURATIONS
# =============================================================================

def get_all_config() -> Dict[str, Any]:
    """Export all configuration as a dictionary for API consumption."""
    return {
        "roles": {key: {"value": c.value, "label": c.label, "level": c.level, "department": c.department}
                  for key, c in ROLE_DEFINITIONS.items()},
        "workflow_stages": {key: {"value": c.value, "label": c.label, "description": c.description, 
                                   "order": c.order, "color": c.color, "icon": c.icon}
                            for key, c in WORKFLOW_STAGE_DEFINITIONS.items()},
        "workflow_transitions": WORKFLOW_TRANSITION_RULES,
        "priorities": {key: {"value": c.value, "label": c.label, "level": c.level}
                       for key, c in PRIORITY_DEFINITIONS.items()},
        "task_statuses": {key: {"value": c.value, "label": c.label, "is_terminal": c.is_terminal}
                          for key, c in TASK_STATUS_DEFINITIONS.items()},
        "event_types": {key: {"value": c.value, "label": c.label, "description": c.description}
                        for key, c in SERVICE_EVENT_DEFINITIONS.items()},
        "job_types": {key: {"value": c.value, "label": c.label}
                      for key, c in JOB_TYPE_DEFINITIONS.items()},
        "business_rules": {
            "default_currency": BUSINESS_RULES.default_currency,
            "default_country": BUSINESS_RULES.default_country,
            "pagination_default_limit": BUSINESS_RULES.pagination_default_limit,
            "pagination_max_limit": BUSINESS_RULES.pagination_max_limit,
        },
    }
