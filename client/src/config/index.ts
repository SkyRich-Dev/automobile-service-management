/**
 * Enterprise Configuration Module
 * All domain constants, UI theming, and configurable values are centralized here.
 * This module serves as the single source of truth for frontend configuration.
 */

// =============================================================================
// API CONFIGURATION
// =============================================================================

export const API_CONFIG = {
  BASE_URL: "/api",
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// =============================================================================
// USER ROLES CONFIGURATION
// =============================================================================

export interface RoleConfig {
  value: string;
  label: string;
  level: number;
  department: string;
}

export const ROLE_DEFINITIONS: Record<string, RoleConfig> = {
  SUPER_ADMIN: { value: "SUPER_ADMIN", label: "Admin", level: 1, department: "Administration" },
  CEO_OWNER: { value: "CEO_OWNER", label: "CEO / Owner", level: 2, department: "Executive" },
  REGIONAL_MANAGER: { value: "REGIONAL_MANAGER", label: "Regional Manager", level: 3, department: "Management" },
  BRANCH_MANAGER: { value: "BRANCH_MANAGER", label: "Branch Manager", level: 4, department: "Management" },
  SERVICE_MANAGER: { value: "SERVICE_MANAGER", label: "Service Manager", level: 5, department: "Service" },
  SALES_MANAGER: { value: "SALES_MANAGER", label: "Sales Manager", level: 5, department: "Sales" },
  ACCOUNTS_MANAGER: { value: "ACCOUNTS_MANAGER", label: "Accounts Manager", level: 5, department: "Finance" },
  SUPERVISOR: { value: "SUPERVISOR", label: "Supervisor", level: 6, department: "Service" },
  SERVICE_ADVISOR: { value: "SERVICE_ADVISOR", label: "Service Advisor", level: 7, department: "Service" },
  SERVICE_ENGINEER: { value: "SERVICE_ENGINEER", label: "Service Engineer", level: 7, department: "Service" },
  SALES_EXECUTIVE: { value: "SALES_EXECUTIVE", label: "Sales Executive", level: 7, department: "Sales" },
  ACCOUNTANT: { value: "ACCOUNTANT", label: "Accountant", level: 7, department: "Finance" },
  INVENTORY_MANAGER: { value: "INVENTORY_MANAGER", label: "Inventory Manager", level: 7, department: "Inventory" },
  HR_MANAGER: { value: "HR_MANAGER", label: "HR Manager", level: 7, department: "HR" },
  TECHNICIAN: { value: "TECHNICIAN", label: "Technician / Mechanic", level: 8, department: "Service" },
  CRM_EXECUTIVE: { value: "CRM_EXECUTIVE", label: "CRM Executive", level: 7, department: "CRM" },
  CUSTOMER: { value: "CUSTOMER", label: "Customer", level: 10, department: "External" },
};

export const getRoleLabel = (role: string): string => {
  return ROLE_DEFINITIONS[role]?.label || role;
};

// =============================================================================
// WORKFLOW STAGES CONFIGURATION
// =============================================================================

export interface WorkflowStageConfig {
  id: string;
  label: string;
  description: string;
  order: number;
  color: string;
  gradient: string;
  bg: string;
  text: string;
  icon: string;
}

export const WORKFLOW_STAGE_DEFINITIONS: Record<string, WorkflowStageConfig> = {
  APPOINTMENT: {
    id: "APPOINTMENT",
    label: "Appointment",
    description: "Customer books service",
    order: 1,
    color: "blue",
    gradient: "from-blue-500 to-blue-600",
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    icon: "calendar",
  },
  CHECK_IN: {
    id: "CHECK_IN",
    label: "Check-in",
    description: "Vehicle received at branch",
    order: 2,
    color: "cyan",
    gradient: "from-cyan-500 to-cyan-600",
    bg: "bg-cyan-500/10",
    text: "text-cyan-600 dark:text-cyan-400",
    icon: "log-in",
  },
  INSPECTION: {
    id: "INSPECTION",
    label: "Inspection",
    description: "Multi-point inspection",
    order: 3,
    color: "teal",
    gradient: "from-teal-500 to-teal-600",
    bg: "bg-teal-500/10",
    text: "text-teal-600 dark:text-teal-400",
    icon: "search",
  },
  JOB_CARD: {
    id: "JOB_CARD",
    label: "Job Card",
    description: "Service order created",
    order: 4,
    color: "emerald",
    gradient: "from-emerald-500 to-emerald-600",
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    icon: "file-text",
  },
  ESTIMATE: {
    id: "ESTIMATE",
    label: "Estimate",
    description: "Cost estimate prepared",
    order: 5,
    color: "green",
    gradient: "from-green-500 to-green-600",
    bg: "bg-green-500/10",
    text: "text-green-600 dark:text-green-400",
    icon: "calculator",
  },
  APPROVAL: {
    id: "APPROVAL",
    label: "Approval",
    description: "Customer approves work",
    order: 6,
    color: "lime",
    gradient: "from-lime-500 to-lime-600",
    bg: "bg-lime-500/10",
    text: "text-lime-600 dark:text-lime-400",
    icon: "check-circle",
  },
  EXECUTION: {
    id: "EXECUTION",
    label: "Execution",
    description: "Technicians perform work",
    order: 7,
    color: "yellow",
    gradient: "from-yellow-500 to-yellow-600",
    bg: "bg-yellow-500/10",
    text: "text-yellow-700 dark:text-yellow-400",
    icon: "wrench",
  },
  QC: {
    id: "QC",
    label: "QC",
    description: "Quality control inspection",
    order: 8,
    color: "amber",
    gradient: "from-amber-500 to-amber-600",
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    icon: "clipboard-check",
  },
  BILLING: {
    id: "BILLING",
    label: "Billing",
    description: "Invoice generated",
    order: 9,
    color: "orange",
    gradient: "from-orange-500 to-orange-600",
    bg: "bg-orange-500/10",
    text: "text-orange-600 dark:text-orange-400",
    icon: "credit-card",
  },
  DELIVERY: {
    id: "DELIVERY",
    label: "Delivery",
    description: "Vehicle delivered",
    order: 10,
    color: "red",
    gradient: "from-red-500 to-red-600",
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    icon: "truck",
  },
  COMPLETED: {
    id: "COMPLETED",
    label: "Completed",
    description: "Service cycle closed",
    order: 11,
    color: "slate",
    gradient: "from-slate-500 to-slate-600",
    bg: "bg-slate-500/10",
    text: "text-slate-600 dark:text-slate-400",
    icon: "check-square",
  },
};

export const WORKFLOW_STAGES = Object.values(WORKFLOW_STAGE_DEFINITIONS).sort(
  (a, b) => a.order - b.order
);

export const getStageConfig = (stageId: string): WorkflowStageConfig | undefined => {
  return WORKFLOW_STAGE_DEFINITIONS[stageId];
};

export const getStageLabel = (stageId: string): string => {
  return WORKFLOW_STAGE_DEFINITIONS[stageId]?.label || stageId;
};

// Workflow transitions define valid state changes
export const WORKFLOW_TRANSITION_RULES: Record<string, string[]> = {
  APPOINTMENT: ["CHECK_IN"],
  CHECK_IN: ["INSPECTION"],
  INSPECTION: ["JOB_CARD"],
  JOB_CARD: ["ESTIMATE"],
  ESTIMATE: ["APPROVAL"],
  APPROVAL: ["EXECUTION", "ESTIMATE"],
  EXECUTION: ["QC"],
  QC: ["BILLING", "EXECUTION"],
  BILLING: ["DELIVERY"],
  DELIVERY: ["COMPLETED"],
  COMPLETED: [],
};

// =============================================================================
// PRIORITY CONFIGURATION
// =============================================================================

export interface PriorityConfig {
  value: string;
  label: string;
  level: number;
  color: string;
  variant: "default" | "secondary" | "destructive" | "outline";
}

export const PRIORITY_DEFINITIONS: Record<string, PriorityConfig> = {
  CRITICAL: { value: "CRITICAL", label: "Critical", level: 1, color: "red", variant: "destructive" },
  HIGH: { value: "HIGH", label: "High", level: 2, color: "orange", variant: "destructive" },
  NORMAL: { value: "NORMAL", label: "Normal", level: 3, color: "blue", variant: "secondary" },
  LOW: { value: "LOW", label: "Low", level: 4, color: "slate", variant: "secondary" },
};

export const PRIORITIES = Object.values(PRIORITY_DEFINITIONS).sort((a, b) => a.level - b.level);

export const getPriorityConfig = (priority: string): PriorityConfig => {
  return PRIORITY_DEFINITIONS[priority] || PRIORITY_DEFINITIONS.NORMAL;
};

export const isHighPriority = (priority: string): boolean => {
  const config = PRIORITY_DEFINITIONS[priority];
  return config ? config.level <= 2 : false;
};

// =============================================================================
// TASK STATUS CONFIGURATION
// =============================================================================

export interface StatusConfig {
  value: string;
  label: string;
  isTerminal: boolean;
  color: string;
}

export const TASK_STATUS_DEFINITIONS: Record<string, StatusConfig> = {
  PENDING: { value: "PENDING", label: "Pending", isTerminal: false, color: "slate" },
  ASSIGNED: { value: "ASSIGNED", label: "Assigned", isTerminal: false, color: "blue" },
  IN_PROGRESS: { value: "IN_PROGRESS", label: "In Progress", isTerminal: false, color: "yellow" },
  PAUSED: { value: "PAUSED", label: "Paused", isTerminal: false, color: "orange" },
  COMPLETED: { value: "COMPLETED", label: "Completed", isTerminal: true, color: "green" },
  QC_PASSED: { value: "QC_PASSED", label: "QC Passed", isTerminal: true, color: "emerald" },
  QC_FAILED: { value: "QC_FAILED", label: "QC Failed", isTerminal: false, color: "red" },
  REJECTED: { value: "REJECTED", label: "Rejected", isTerminal: true, color: "red" },
};

export const getTaskStatusLabel = (status: string): string => {
  return TASK_STATUS_DEFINITIONS[status]?.label || status;
};

// =============================================================================
// SERVICE EVENT TYPES CONFIGURATION
// =============================================================================

export interface EventTypeConfig {
  value: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export const SERVICE_EVENT_DEFINITIONS: Record<string, EventTypeConfig> = {
  WORKFLOW_TRANSITION: {
    value: "WORKFLOW_TRANSITION",
    label: "Stage Change",
    description: "Workflow stage transition",
    icon: "arrow-right",
    color: "blue",
  },
  TASK_ASSIGNED: {
    value: "TASK_ASSIGNED",
    label: "Task Assigned",
    description: "Task assigned to technician",
    icon: "user-plus",
    color: "cyan",
  },
  TASK_STARTED: {
    value: "TASK_STARTED",
    label: "Task Started",
    description: "Technician started work",
    icon: "play",
    color: "green",
  },
  TASK_COMPLETED: {
    value: "TASK_COMPLETED",
    label: "Task Completed",
    description: "Task marked complete",
    icon: "check",
    color: "emerald",
  },
  TASK_PAUSED: {
    value: "TASK_PAUSED",
    label: "Task Paused",
    description: "Task paused",
    icon: "pause",
    color: "yellow",
  },
  PART_REQUESTED: {
    value: "PART_REQUESTED",
    label: "Part Requested",
    description: "Part requested from inventory",
    icon: "package",
    color: "purple",
  },
  PART_ISSUED: {
    value: "PART_ISSUED",
    label: "Part Issued",
    description: "Part issued to job",
    icon: "package-check",
    color: "indigo",
  },
  REMARK_ADDED: {
    value: "REMARK_ADDED",
    label: "Remark Added",
    description: "Comment or note added",
    icon: "message-square",
    color: "green",
  },
  CUSTOMER_NOTIFIED: {
    value: "CUSTOMER_NOTIFIED",
    label: "Customer Notified",
    description: "Customer was notified",
    icon: "bell",
    color: "purple",
  },
  ESTIMATE_CREATED: {
    value: "ESTIMATE_CREATED",
    label: "Estimate Created",
    description: "Cost estimate created",
    icon: "calculator",
    color: "blue",
  },
  ESTIMATE_APPROVED: {
    value: "ESTIMATE_APPROVED",
    label: "Estimate Approved",
    description: "Customer approved estimate",
    icon: "thumbs-up",
    color: "green",
  },
  PAYMENT_RECEIVED: {
    value: "PAYMENT_RECEIVED",
    label: "Payment Received",
    description: "Payment received",
    icon: "credit-card",
    color: "emerald",
  },
  QC_PASSED: {
    value: "QC_PASSED",
    label: "QC Passed",
    description: "Quality check passed",
    icon: "check-circle",
    color: "green",
  },
  QC_FAILED: {
    value: "QC_FAILED",
    label: "QC Failed",
    description: "Quality check failed",
    icon: "x-circle",
    color: "red",
  },
  ESCALATION: {
    value: "ESCALATION",
    label: "Escalation",
    description: "Job was escalated",
    icon: "alert-triangle",
    color: "red",
  },
  AI_INSIGHT: {
    value: "AI_INSIGHT",
    label: "AI Insight",
    description: "AI-generated insight",
    icon: "sparkles",
    color: "violet",
  },
  INSPECTION_COMPLETED: {
    value: "INSPECTION_COMPLETED",
    label: "Inspection Completed",
    description: "Digital inspection completed",
    icon: "clipboard-check",
    color: "teal",
  },
};

export const getEventTypeConfig = (eventType: string): EventTypeConfig => {
  return SERVICE_EVENT_DEFINITIONS[eventType] || {
    value: eventType,
    label: eventType.replace(/_/g, " "),
    description: "",
    icon: "activity",
    color: "slate",
  };
};

// =============================================================================
// JOB TYPE CONFIGURATION
// =============================================================================

export const JOB_TYPE_DEFINITIONS: Record<string, { value: string; label: string }> = {
  GENERAL_SERVICE: { value: "GENERAL_SERVICE", label: "General Service" },
  REPAIR: { value: "REPAIR", label: "Repair" },
  BODY_PAINT: { value: "BODY_PAINT", label: "Body & Paint" },
  ACCIDENT: { value: "ACCIDENT", label: "Accident Repair" },
  WARRANTY: { value: "WARRANTY", label: "Warranty Work" },
  AMC: { value: "AMC", label: "AMC Service" },
  INSURANCE: { value: "INSURANCE", label: "Insurance Claim" },
  PRE_DELIVERY: { value: "PRE_DELIVERY", label: "Pre-Delivery Inspection" },
  ACCESSORIES: { value: "ACCESSORIES", label: "Accessories Fitment" },
};

export const JOB_TYPES = Object.values(JOB_TYPE_DEFINITIONS);

// =============================================================================
// CUSTOMER CATEGORY CONFIGURATION
// =============================================================================

export const CUSTOMER_CATEGORY_DEFINITIONS: Record<string, { value: string; label: string }> = {
  RETAIL: { value: "RETAIL", label: "Retail" },
  FLEET: { value: "FLEET", label: "Fleet" },
  VIP: { value: "VIP", label: "VIP" },
  CORPORATE: { value: "CORPORATE", label: "Corporate" },
  WALK_IN: { value: "WALK_IN", label: "Walk-in" },
};

export const CUSTOMER_CATEGORIES = Object.values(CUSTOMER_CATEGORY_DEFINITIONS);

// =============================================================================
// COMMUNICATION CHANNEL CONFIGURATION
// =============================================================================

export const COMMUNICATION_CHANNEL_DEFINITIONS: Record<string, { value: string; label: string; icon: string }> = {
  PHONE: { value: "PHONE", label: "Phone", icon: "phone" },
  EMAIL: { value: "EMAIL", label: "Email", icon: "mail" },
  WHATSAPP: { value: "WHATSAPP", label: "WhatsApp", icon: "message-circle" },
  SMS: { value: "SMS", label: "SMS", icon: "smartphone" },
  IN_APP: { value: "IN_APP", label: "In-App", icon: "bell" },
};

export const COMMUNICATION_CHANNELS = Object.values(COMMUNICATION_CHANNEL_DEFINITIONS);

// =============================================================================
// CONTRACT CONFIGURATION
// =============================================================================

export const CONTRACT_STATUS_DEFINITIONS: Record<string, StatusConfig> = {
  DRAFT: { value: "DRAFT", label: "Draft", isTerminal: false, color: "slate" },
  PENDING_APPROVAL: { value: "PENDING_APPROVAL", label: "Pending Approval", isTerminal: false, color: "yellow" },
  ACTIVE: { value: "ACTIVE", label: "Active", isTerminal: false, color: "green" },
  SUSPENDED: { value: "SUSPENDED", label: "Suspended", isTerminal: false, color: "orange" },
  EXPIRED: { value: "EXPIRED", label: "Expired", isTerminal: true, color: "red" },
  TERMINATED: { value: "TERMINATED", label: "Terminated", isTerminal: true, color: "red" },
};

export const CONTRACT_TYPE_DEFINITIONS: Record<string, { value: string; label: string }> = {
  WARRANTY: { value: "WARRANTY", label: "Warranty" },
  EXTENDED_WARRANTY: { value: "EXTENDED_WARRANTY", label: "Extended Warranty" },
  AMC: { value: "AMC", label: "Annual Maintenance Contract" },
  SERVICE_PACKAGE: { value: "SERVICE_PACKAGE", label: "Service Package" },
  INSURANCE: { value: "INSURANCE", label: "Insurance" },
  FLEET: { value: "FLEET", label: "Fleet Contract" },
  SUBSCRIPTION: { value: "SUBSCRIPTION", label: "Subscription" },
  CORPORATE: { value: "CORPORATE", label: "Corporate Agreement" },
  OEM_DEALER: { value: "OEM_DEALER", label: "OEM Dealer Agreement" },
  CUSTOM: { value: "CUSTOM", label: "Custom Contract" },
};

// =============================================================================
// CRM CONFIGURATION
// =============================================================================

export const LEAD_STATUS_DEFINITIONS: Record<string, StatusConfig> = {
  NEW: { value: "NEW", label: "New", isTerminal: false, color: "blue" },
  CONTACTED: { value: "CONTACTED", label: "Contacted", isTerminal: false, color: "cyan" },
  QUALIFIED: { value: "QUALIFIED", label: "Qualified", isTerminal: false, color: "teal" },
  QUOTED: { value: "QUOTED", label: "Quoted", isTerminal: false, color: "green" },
  NEGOTIATION: { value: "NEGOTIATION", label: "Negotiation", isTerminal: false, color: "yellow" },
  CONVERTED: { value: "CONVERTED", label: "Converted", isTerminal: true, color: "emerald" },
  LOST: { value: "LOST", label: "Lost", isTerminal: true, color: "red" },
};

export const TICKET_STATUS_DEFINITIONS: Record<string, StatusConfig> = {
  OPEN: { value: "OPEN", label: "Open", isTerminal: false, color: "blue" },
  ASSIGNED: { value: "ASSIGNED", label: "Assigned", isTerminal: false, color: "cyan" },
  IN_PROGRESS: { value: "IN_PROGRESS", label: "In Progress", isTerminal: false, color: "yellow" },
  PENDING_CUSTOMER: { value: "PENDING_CUSTOMER", label: "Pending Customer", isTerminal: false, color: "orange" },
  RESOLVED: { value: "RESOLVED", label: "Resolved", isTerminal: false, color: "green" },
  CLOSED: { value: "CLOSED", label: "Closed", isTerminal: true, color: "slate" },
  REOPENED: { value: "REOPENED", label: "Reopened", isTerminal: false, color: "red" },
};

// =============================================================================
// INVENTORY CONFIGURATION
// =============================================================================

export const ITEM_TYPE_DEFINITIONS: Record<string, { value: string; label: string }> = {
  SPARE_PART: { value: "SPARE_PART", label: "Spare Part" },
  CONSUMABLE: { value: "CONSUMABLE", label: "Consumable" },
  LUBRICANT: { value: "LUBRICANT", label: "Lubricant" },
  ACCESSORY: { value: "ACCESSORY", label: "Accessory" },
  TOOL: { value: "TOOL", label: "Tool" },
};

export const TRANSFER_STATUS_DEFINITIONS: Record<string, StatusConfig> = {
  DRAFT: { value: "DRAFT", label: "Draft", isTerminal: false, color: "slate" },
  PENDING_APPROVAL: { value: "PENDING_APPROVAL", label: "Pending Approval", isTerminal: false, color: "yellow" },
  APPROVED: { value: "APPROVED", label: "Approved", isTerminal: false, color: "blue" },
  IN_TRANSIT: { value: "IN_TRANSIT", label: "In Transit", isTerminal: false, color: "cyan" },
  RECEIVED: { value: "RECEIVED", label: "Received", isTerminal: true, color: "green" },
  CANCELLED: { value: "CANCELLED", label: "Cancelled", isTerminal: true, color: "red" },
};

// =============================================================================
// NOTIFICATION CONFIGURATION
// =============================================================================

export const NOTIFICATION_TYPE_DEFINITIONS: Record<string, { value: string; label: string; color: string }> = {
  INFO: { value: "INFO", label: "Information", color: "blue" },
  SUCCESS: { value: "SUCCESS", label: "Success", color: "green" },
  WARNING: { value: "WARNING", label: "Warning", color: "yellow" },
  ERROR: { value: "ERROR", label: "Error", color: "red" },
  ACTION_REQUIRED: { value: "ACTION_REQUIRED", label: "Action Required", color: "orange" },
};

// =============================================================================
// PAYMENT CONFIGURATION
// =============================================================================

export const PAYMENT_MODE_DEFINITIONS: Record<string, { value: string; label: string; icon: string }> = {
  CASH: { value: "CASH", label: "Cash", icon: "banknote" },
  CARD: { value: "CARD", label: "Card", icon: "credit-card" },
  UPI: { value: "UPI", label: "UPI", icon: "smartphone" },
  NETBANKING: { value: "NETBANKING", label: "Net Banking", icon: "landmark" },
  CHEQUE: { value: "CHEQUE", label: "Cheque", icon: "file-text" },
  CREDIT: { value: "CREDIT", label: "Credit", icon: "wallet" },
  WALLET: { value: "WALLET", label: "Wallet", icon: "wallet" },
};

export const PAYMENT_MODES = Object.values(PAYMENT_MODE_DEFINITIONS);

// =============================================================================
// VEHICLE CONFIGURATION
// =============================================================================

export const FUEL_TYPE_DEFINITIONS: Record<string, { value: string; label: string }> = {
  PETROL: { value: "PETROL", label: "Petrol" },
  DIESEL: { value: "DIESEL", label: "Diesel" },
  CNG: { value: "CNG", label: "CNG" },
  LPG: { value: "LPG", label: "LPG" },
  ELECTRIC: { value: "ELECTRIC", label: "Electric" },
  HYBRID: { value: "HYBRID", label: "Hybrid" },
};

export const TRANSMISSION_TYPE_DEFINITIONS: Record<string, { value: string; label: string }> = {
  MANUAL: { value: "MANUAL", label: "Manual" },
  AUTOMATIC: { value: "AUTOMATIC", label: "Automatic" },
  CVT: { value: "CVT", label: "CVT" },
  AMT: { value: "AMT", label: "AMT" },
  DCT: { value: "DCT", label: "DCT" },
};

export const FUEL_TYPES = Object.values(FUEL_TYPE_DEFINITIONS);
export const TRANSMISSION_TYPES = Object.values(TRANSMISSION_TYPE_DEFINITIONS);

// =============================================================================
// BUSINESS RULES CONFIGURATION
// =============================================================================

export const BUSINESS_RULES = {
  DEFAULT_SLA_HOURS: 24,
  CRITICAL_SLA_HOURS: 4,
  HIGH_SLA_HOURS: 8,
  NORMAL_SLA_HOURS: 24,
  LOW_SLA_HOURS: 48,
  MAX_ESCALATION_LEVEL: 3,
  DEFAULT_CURRENCY: "INR",
  CURRENCY_SYMBOL: "₹",
  DEFAULT_COUNTRY: "India",
  DEFAULT_TIMEZONE: "Asia/Kolkata",
  DECIMAL_PRECISION: 2,
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 100,
  INVOICE_PREFIX: "INV",
  JOB_CARD_PREFIX: "JC",
  CUSTOMER_ID_PREFIX: "CUST",
  PO_PREFIX: "PO",
  GRN_PREFIX: "GRN",
} as const;

// =============================================================================
// UI CONFIGURATION
// =============================================================================

export const UI_CONFIG = {
  SIDEBAR_WIDTH: "16rem",
  SIDEBAR_WIDTH_COLLAPSED: "4rem",
  HEADER_HEIGHT: "4rem",
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  SKELETON_COUNT: 5,
  MAX_FILE_SIZE_MB: 10,
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  ALLOWED_DOCUMENT_TYPES: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
} as const;

// =============================================================================
// DATE/TIME FORMAT CONFIGURATION
// =============================================================================

export const DATE_FORMAT_CONFIG = {
  DATE: "MMM d, yyyy",
  DATE_SHORT: "MM/dd/yyyy",
  TIME: "h:mm a",
  DATETIME: "MMM d, yyyy h:mm a",
  DATETIME_SHORT: "MM/dd/yyyy h:mm a",
  ISO: "yyyy-MM-dd",
  API: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

// =============================================================================
// MESSAGE TEMPLATES
// =============================================================================

export const MESSAGES = {
  SUCCESS: {
    CREATED: "{resource} created successfully",
    UPDATED: "{resource} updated successfully",
    DELETED: "{resource} deleted successfully",
    TRANSITION: "Successfully moved to {stage}",
    ACTION: "{action} completed successfully",
    LOGIN: "Login successful",
    LOGOUT: "Logged out successfully",
  },
  ERROR: {
    NOT_FOUND: "{resource} not found",
    ALREADY_EXISTS: "{resource} already exists",
    INVALID_TRANSITION: "Cannot transition from {fromStage} to {toStage}",
    PERMISSION_DENIED: "You do not have permission to {action}",
    VALIDATION: "Validation failed: {details}",
    AUTH_REQUIRED: "Authentication required",
    INVALID_CREDENTIALS: "Invalid credentials",
    NETWORK: "Network error. Please try again.",
    SERVER: "Server error. Please try again later.",
    UNKNOWN: "An unexpected error occurred",
  },
  CONFIRM: {
    DELETE: "Are you sure you want to delete this {resource}?",
    TRANSITION: "Move this job to {stage}?",
    LOGOUT: "Are you sure you want to logout?",
  },
} as const;

export const formatMessage = (
  template: string,
  params: Record<string, string>
): string => {
  return Object.entries(params).reduce(
    (message, [key, value]) => message.replace(`{${key}}`, value),
    template
  );
};

// =============================================================================
// EXPORT HELPER FUNCTIONS
// =============================================================================

export const getChoices = <T extends { value: string; label: string }>(
  definitions: Record<string, T>
): Array<{ value: string; label: string }> => {
  return Object.values(definitions).map(({ value, label }) => ({ value, label }));
};
