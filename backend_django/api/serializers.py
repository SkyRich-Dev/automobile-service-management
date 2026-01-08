from decimal import Decimal
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Profile, Branch, Customer, Vehicle, Part, JobCard, Task, 
    ServiceEvent, Estimate, EstimateLine, PartIssue, Invoice, Payment,
    DigitalInspection, Bay, TechnicianMetrics, TimelineEvent,
    WorkflowStage, UserRole, WORKFLOW_TRANSITIONS,
    Notification, Contract, ContractVehicle, ContractCoverageRule,
    ContractConsumption, ContractApproval, ContractAuditLog,
    Supplier, PurchaseOrder, PurchaseOrderLine,
    PartReservation, GoodsReceiptNote, GRNLine, StockTransfer, StockTransferLine,
    PurchaseRequisition, PRLine, SupplierPerformance, InventoryAlert,
    TechnicianSchedule, Appointment, AnalyticsSnapshot,
    License, SystemSetting, PaymentIntent, TallySyncJob, TallyLedgerMapping, IntegrationConfig,
    Lead, CustomerInteraction, Ticket, FollowUpTask, Campaign, CampaignRecipient, CustomerScore, CRMEvent,
    LeadSource, LeadStatus, InteractionType, InteractionOutcome, TicketType, TicketStatus, TicketPriority,
    FollowUpType, FollowUpStatus, CampaignType, CampaignStatus, CustomerCategory, CommunicationChannel,
    Department, EmployeeAssignment, WorkShift, AttendanceRecord, AttendanceStatus,
    RolePermission, EmailConfiguration, WhatsAppConfiguration, PaymentGatewayConfiguration, TallyConfiguration,
    ItemType, TaxCategory, ValuationMethod, ReservationStatus, GRNStatus, StockTransferStatus, PRStatus, AlertType,
    Account, AccountCategory, AccountType, TaxRate, TaxType,
    EnhancedInvoice, InvoiceLine, InvoiceStatus, InvoiceType,
    CreditNote, CreditNoteLine, EnhancedPayment, PaymentAllocation,
    ExpenseCategory, Expense, ExpenseStatus,
    JournalEntry, LedgerEntry, CustomerReceivable, VendorPayable,
    FinancialAuditLog, FinancialPeriod, BudgetEntry,
    Skill, EmployeeSkill, Employee, TrainingProgram, TrainingEnrollment,
    IncentiveRule, EmployeeIncentive, LeaveType, LeaveBalance, LeaveRequest,
    Holiday, HRShift, EmployeeShift, SkillRequirement, SkillAuditLog, Payroll, HRAttendance,
    ConfigCategory, ConfigOption,
    SystemConfig, SystemConfigHistory, WorkflowConfig, ApprovalRule,
    NotificationTemplate, NotificationRule, AutomationRule, DelegationRule,
    BranchHolidayCalendar, OperatingHours, SLAConfig, ConfigAuditLog, MenuConfig, FeatureFlag,
    Currency, Language, SystemPreference
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active']
        read_only_fields = ['id']


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'code', 'name', 'address', 'phone', 'email', 'city', 'state', 'country', 'is_headquarters', 'is_active']
        read_only_fields = ['id']


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'user', 'role', 'branch', 'branch_name', 'employee_id', 'phone', 'avatar', 'skills', 'is_available', 'created_at']


class TechnicianMetricsSerializer(serializers.ModelSerializer):
    utilization_percentage = serializers.FloatField(read_only=True)
    
    class Meta:
        model = TechnicianMetrics
        fields = ['total_jobs_completed', 'total_productive_hours', 'total_idle_hours', 'rework_count', 'average_rating', 'utilization_percentage']


class CustomerSerializer(serializers.ModelSerializer):
    preferred_branch_name = serializers.CharField(source='preferred_branch.name', read_only=True, allow_null=True)
    referred_by_name = serializers.CharField(source='referred_by.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Customer
        fields = ['id', 'customer_id', 'name', 'phone', 'email', 'alternate_phone', 'alternate_email',
                  'address', 'city', 'state', 'pincode', 'gst_number', 'pan_number',
                  'customer_type', 'customer_category', 'preferred_channel', 'preferred_branch',
                  'preferred_branch_name', 'loyalty_points', 'credit_limit', 'outstanding_balance',
                  'total_revenue', 'total_visits', 'last_visit_date', 'date_of_birth', 'anniversary_date',
                  'referral_source', 'referred_by', 'referred_by_name', 'notes', 'tags', 'do_not_contact',
                  'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'customer_id', 'total_revenue', 'total_visits', 'created_at', 'updated_at']


class VehicleSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = Vehicle
        fields = ['id', 'vehicle_id', 'customer', 'customer_name', 'vin', 'plate_number', 'make', 'model', 
                  'variant', 'year', 'color', 'vehicle_type', 'fuel_type', 'transmission', 'current_odometer',
                  'insurance_expiry', 'warranty_expiry', 'amc_expiry', 'created_at']
        read_only_fields = ['id', 'vehicle_id', 'created_at']


class CustomerWithVehiclesSerializer(serializers.ModelSerializer):
    vehicles = VehicleSerializer(many=True, read_only=True)
    
    class Meta:
        model = Customer
        fields = ['id', 'customer_id', 'name', 'phone', 'email', 'loyalty_points', 'address', 'notes', 'vehicles', 'created_at', 'updated_at']


class PartSerializer(serializers.ModelSerializer):
    available_stock = serializers.IntegerField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    price = serializers.DecimalField(source='selling_price', max_digits=12, decimal_places=2)
    primary_supplier_name = serializers.CharField(source='primary_supplier.name', read_only=True, allow_null=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Part
        fields = ['id', 'branch', 'branch_name', 'part_number', 'name', 'sku', 'category', 'subcategory', 
                  'brand', 'item_type', 'is_oem', 'unit', 'cost_price', 'price', 'mrp', 'tax_rate',
                  'tax_category', 'hsn_code', 'stock', 'min_stock', 'max_stock', 'reserved', 
                  'reorder_quantity', 'location', 'rack_number', 'bin_number', 'batch_number',
                  'serial_number', 'expiry_date', 'last_purchase_date', 'valuation_method',
                  'average_cost', 'compatible_vehicles', 'warranty_eligible', 'warranty_period_months',
                  'is_returnable', 'return_period_days', 'primary_supplier', 'primary_supplier_name',
                  'lead_time_days', 'available_stock', 'is_low_stock', 'is_active', 'created_at']
        read_only_fields = ['id', 'part_number', 'created_at']


class PartIssueSerializer(serializers.ModelSerializer):
    part_name = serializers.CharField(source='part.name', read_only=True)
    part_sku = serializers.CharField(source='part.sku', read_only=True)
    
    class Meta:
        model = PartIssue
        fields = ['id', 'issue_number', 'job_card', 'task', 'part', 'part_name', 'part_sku', 
                  'quantity', 'unit_price', 'discount', 'total', 'issued_at', 'is_returned']
        read_only_fields = ['id', 'issue_number', 'issued_at']


class TaskSerializer(serializers.ModelSerializer):
    part_issues = PartIssueSerializer(many=True, read_only=True)
    technician_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = ['id', 'task_number', 'job_card', 'description', 'category', 'assigned_technician',
                  'technician_name', 'status', 'priority', 'estimated_hours', 'actual_hours',
                  'labor_rate', 'labor_cost', 'start_time', 'end_time', 'checklist', 
                  'checklist_completed', 'evidence_photos', 'technician_notes', 'qc_passed', 
                  'qc_notes', 'is_rework', 'part_issues', 'created_at']
        read_only_fields = ['id', 'task_number', 'created_at']
    
    def get_technician_name(self, obj):
        if obj.assigned_technician:
            return f"{obj.assigned_technician.first_name} {obj.assigned_technician.last_name}".strip() or obj.assigned_technician.username
        return None


class ServiceEventSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ServiceEvent
        fields = ['id', 'job_card', 'event_type', 'actor', 'actor_name', 'actor_role', 
                  'old_value', 'new_value', 'comment', 'metadata', 'evidence', 'timestamp']
        read_only_fields = ['id', 'timestamp']
    
    def get_actor_name(self, obj):
        if obj.actor:
            return f"{obj.actor.first_name} {obj.actor.last_name}".strip() or obj.actor.username
        return 'System'


class TimelineEventSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TimelineEvent
        fields = ['id', 'job_card', 'event_type', 'status', 'actor', 'actor_name', 'role', 'comment', 'timestamp']
        read_only_fields = ['id', 'timestamp']
    
    def get_actor_name(self, obj):
        if obj.actor:
            return f"{obj.actor.first_name} {obj.actor.last_name}".strip() or obj.actor.username
        return 'System'


class BaySerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = Bay
        fields = ['id', 'branch', 'branch_name', 'bay_number', 'bay_type', 'is_available', 'current_job']


class DigitalInspectionSerializer(serializers.ModelSerializer):
    inspector_name = serializers.SerializerMethodField()
    
    class Meta:
        model = DigitalInspection
        fields = ['id', 'job_card', 'inspector', 'inspector_name', 'inspection_date', 
                  'checklist_data', 'findings', 'recommendations', 'photos', 'videos', 'is_completed']
    
    def get_inspector_name(self, obj):
        if obj.inspector:
            return f"{obj.inspector.first_name} {obj.inspector.last_name}".strip() or obj.inspector.username
        return None


class EstimateLineSerializer(serializers.ModelSerializer):
    part_name = serializers.CharField(source='part.name', read_only=True)
    
    class Meta:
        model = EstimateLine
        fields = ['id', 'estimate', 'line_type', 'description', 'part', 'part_name', 
                  'quantity', 'unit_price', 'discount', 'tax_rate', 'total', 'is_approved']


class EstimateSerializer(serializers.ModelSerializer):
    lines = EstimateLineSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Estimate
        fields = ['id', 'job_card', 'version', 'estimate_number', 'labor_total', 'parts_total',
                  'discount', 'tax', 'grand_total', 'approval_status', 'approved_by', 
                  'approval_date', 'approval_comment', 'created_by', 'created_by_name', 
                  'created_at', 'is_current', 'lines']
        read_only_fields = ['id', 'estimate_number', 'version', 'created_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None


class JobCardSerializer(serializers.ModelSerializer):
    vehicle_info = serializers.SerializerMethodField()
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    advisor_name = serializers.SerializerMethodField()
    technician_name = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    allowed_transitions = serializers.SerializerMethodField()
    
    class Meta:
        model = JobCard
        fields = [
            'id', 'job_card_number', 'service_tracking_id', 'branch', 'branch_name',
            'vehicle', 'vehicle_info', 'customer', 'customer_name',
            'service_advisor', 'advisor_name', 'lead_technician', 'technician_name',
            'workflow_stage', 'job_type', 'priority', 'complaint', 'diagnosis',
            'odometer_in', 'estimated_hours', 'estimated_amount', 'actual_amount',
            'is_warranty', 'is_amc', 'is_insurance', 'is_goodwill',
            'promised_delivery', 'sla_deadline', 'actual_delivery',
            'ai_summary', 'customer_rating', 'created_at', 'updated_at', 'allowed_transitions'
        ]
        read_only_fields = ['id', 'job_card_number', 'service_tracking_id', 'created_at', 'updated_at']
    
    def get_vehicle_info(self, obj):
        return f"{obj.vehicle.year or ''} {obj.vehicle.make} {obj.vehicle.model} - {obj.vehicle.plate_number}"
    
    def get_advisor_name(self, obj):
        if obj.service_advisor:
            return f"{obj.service_advisor.first_name} {obj.service_advisor.last_name}".strip() or obj.service_advisor.username
        return None
    
    def get_technician_name(self, obj):
        if obj.lead_technician:
            return f"{obj.lead_technician.first_name} {obj.lead_technician.last_name}".strip() or obj.lead_technician.username
        return None
    
    def get_allowed_transitions(self, obj):
        current_stage = obj.workflow_stage
        allowed = WORKFLOW_TRANSITIONS.get(current_stage, [])
        return [{'value': stage.value, 'label': stage.label} for stage in allowed]


class JobCardDetailSerializer(JobCardSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    timeline_events = ServiceEventSerializer(many=True, read_only=True)
    estimates = EstimateSerializer(many=True, read_only=True)
    inspection = DigitalInspectionSerializer(read_only=True)
    vehicle_detail = VehicleSerializer(source='vehicle', read_only=True)
    customer_detail = CustomerSerializer(source='customer', read_only=True)
    
    class Meta(JobCardSerializer.Meta):
        fields = JobCardSerializer.Meta.fields + ['tasks', 'timeline_events', 'estimates', 'inspection', 'vehicle_detail', 'customer_detail']


class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    job_card_number = serializers.CharField(source='job_card.job_card_number', read_only=True)
    
    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'job_card', 'job_card_number', 'customer', 'customer_name',
                  'branch', 'labor_total', 'parts_total', 'consumables_total', 'subtotal',
                  'discount', 'tax', 'grand_total', 'amount_paid', 'balance_due', 'payment_status',
                  'invoice_date', 'due_date', 'notes']
        read_only_fields = ['id', 'invoice_number', 'invoice_date']


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ['id', 'payment_number', 'invoice', 'amount', 'payment_method', 
                  'reference_number', 'payment_date', 'notes']
        read_only_fields = ['id', 'payment_number', 'payment_date']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name']
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        Profile.objects.create(user=user, role=UserRole.CUSTOMER)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class WorkflowTransitionSerializer(serializers.Serializer):
    new_stage = serializers.ChoiceField(choices=WorkflowStage.choices)
    comment = serializers.CharField(required=False, allow_blank=True)


class NotificationSerializer(serializers.ModelSerializer):
    recipient_name = serializers.SerializerMethodField()
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    job_card_number = serializers.CharField(source='job_card.job_card_number', read_only=True)
    
    class Meta:
        model = Notification
        fields = ['id', 'notification_id', 'recipient', 'recipient_name', 'customer', 'customer_name',
                  'notification_type', 'channel', 'title', 'message', 'job_card', 'job_card_number',
                  'is_read', 'is_sent', 'sent_at', 'read_at', 'metadata', 'created_at']
        read_only_fields = ['id', 'notification_id', 'created_at']
    
    def get_recipient_name(self, obj):
        if obj.recipient:
            return f"{obj.recipient.first_name} {obj.recipient.last_name}".strip() or obj.recipient.username
        return None


class ContractCoverageRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContractCoverageRule
        fields = ['id', 'service_type', 'is_covered', 'coverage_percent', 'max_amount',
                  'visit_limit', 'visits_used', 'notes']
        read_only_fields = ['id', 'visits_used']


class ContractVehicleSerializer(serializers.ModelSerializer):
    vehicle_info = serializers.SerializerMethodField()
    registration_number = serializers.CharField(source='vehicle.plate_number', read_only=True)
    
    class Meta:
        model = ContractVehicle
        fields = ['id', 'vehicle', 'vehicle_info', 'registration_number', 'added_at', 'is_active']
        read_only_fields = ['id', 'added_at']
    
    def get_vehicle_info(self, obj):
        v = obj.vehicle
        return f"{v.year or ''} {v.make} {v.model} - {v.plate_number}"


class ContractConsumptionSerializer(serializers.ModelSerializer):
    job_card_number = serializers.CharField(source='job_card.job_card_number', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True, allow_null=True)
    
    class Meta:
        model = ContractConsumption
        fields = ['id', 'job_card', 'job_card_number', 'invoice', 'invoice_number', 'service_date',
                  'service_type', 'parts_amount', 'labor_amount', 'covered_amount', 'customer_payable',
                  'km_at_service', 'hours_at_service', 'sla_met', 'response_time_actual',
                  'resolution_time_actual', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


class ContractApprovalSerializer(serializers.ModelSerializer):
    approver_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ContractApproval
        fields = ['id', 'approver', 'approver_name', 'approval_level', 'status', 'comments',
                  'approved_at', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_approver_name(self, obj):
        return f"{obj.approver.first_name} {obj.approver.last_name}".strip() or obj.approver.username


class ContractAuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    job_card_number = serializers.CharField(source='job_card.job_card_number', read_only=True, allow_null=True)
    
    class Meta:
        model = ContractAuditLog
        fields = ['id', 'action', 'actor', 'actor_name', 'old_values', 'new_values',
                  'job_card', 'job_card_number', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_actor_name(self, obj):
        if obj.actor:
            return f"{obj.actor.first_name} {obj.actor.last_name}".strip() or obj.actor.username
        return None


class ContractSerializer(serializers.ModelSerializer):
    vehicle_info = serializers.SerializerMethodField()
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True, allow_null=True)
    is_active = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    services_remaining = serializers.IntegerField(read_only=True)
    km_remaining = serializers.IntegerField(read_only=True)
    utilization_percent = serializers.FloatField(read_only=True)
    coverage_rules = ContractCoverageRuleSerializer(many=True, read_only=True)
    contract_vehicles = ContractVehicleSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Contract
        fields = ['id', 'contract_number', 'vehicle', 'vehicle_info', 'customer', 'customer_name',
                  'branch', 'branch_name', 'contract_type', 'status', 'provider', 'policy_number',
                  'start_date', 'end_date', 'coverage_period_months', 'coverage_km_limit',
                  'coverage_hours_limit', 'grace_period_days', 'contract_value', 'billing_model',
                  'tax_rate', 'discount_percent', 'deductible', 'penalty_clause', 'services_included',
                  'parts_coverage', 'labor_coverage_percent', 'consumables_included', 'max_services',
                  'services_used', 'km_used', 'hours_used', 'response_time_hours', 'resolution_time_hours',
                  'priority_handling', 'auto_renewal', 'renewal_reminder_days', 'terms_conditions',
                  'suspension_reason', 'suspended_at', 'termination_reason', 'terminated_at',
                  'is_active', 'is_expired', 'days_remaining', 'services_remaining', 'km_remaining',
                  'utilization_percent', 'coverage_rules', 'contract_vehicles', 'created_by',
                  'created_by_name', 'approved_by', 'approved_by_name', 'approved_at',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'contract_number', 'services_used', 'km_used', 'hours_used',
                           'suspended_at', 'terminated_at', 'approved_at', 'created_at', 'updated_at']
    
    def get_vehicle_info(self, obj):
        if obj.vehicle:
            return f"{obj.vehicle.year or ''} {obj.vehicle.make} {obj.vehicle.model} - {obj.vehicle.plate_number}"
        return None
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return None


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'supplier_id', 'name', 'contact_person', 'phone', 'email', 'address',
                  'city', 'state', 'gst_number', 'pan_number', 'payment_terms', 'credit_limit',
                  'outstanding_balance', 'rating', 'categories', 'is_active', 'created_at']
        read_only_fields = ['id', 'supplier_id', 'created_at']


class PurchaseOrderLineSerializer(serializers.ModelSerializer):
    part_name = serializers.CharField(source='part.name', read_only=True)
    part_sku = serializers.CharField(source='part.sku', read_only=True)
    
    class Meta:
        model = PurchaseOrderLine
        fields = ['id', 'purchase_order', 'part', 'part_name', 'part_sku', 'quantity_ordered',
                  'quantity_received', 'unit_price', 'tax_rate', 'total']
        read_only_fields = ['id', 'purchase_order']


class PurchaseOrderLineWriteSerializer(serializers.Serializer):
    part = serializers.IntegerField()
    quantity_ordered = serializers.IntegerField(min_value=1)
    unit_price = serializers.DecimalField(max_digits=12, decimal_places=2)
    tax_rate = serializers.DecimalField(max_digits=5, decimal_places=2, default=18)


class PurchaseOrderSerializer(serializers.ModelSerializer):
    lines = PurchaseOrderLineSerializer(many=True, read_only=True)
    lines_data = PurchaseOrderLineWriteSerializer(many=True, write_only=True, required=False)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PurchaseOrder
        fields = ['id', 'po_number', 'branch', 'branch_name', 'supplier', 'supplier_name',
                  'status', 'order_date', 'expected_delivery', 'actual_delivery', 'subtotal',
                  'tax', 'shipping', 'grand_total', 'notes', 'created_by', 'created_by_name',
                  'approved_by', 'created_at', 'updated_at', 'lines', 'lines_data']
        read_only_fields = ['id', 'po_number', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def create(self, validated_data):
        lines_data = validated_data.pop('lines_data', [])
        po = PurchaseOrder.objects.create(**validated_data)
        
        subtotal = Decimal('0')
        tax_total = Decimal('0')
        
        for line_data in lines_data:
            part = Part.objects.get(id=line_data['part'])
            quantity = line_data['quantity_ordered']
            unit_price_val = line_data.get('unit_price')
            if unit_price_val is not None:
                unit_price = Decimal(str(unit_price_val))
            else:
                unit_price = part.cost_price if part.cost_price else Decimal('0')
            tax_rate = Decimal(str(line_data.get('tax_rate', 18)))
            line_total = quantity * unit_price
            line_tax = line_total * (tax_rate / 100)
            
            PurchaseOrderLine.objects.create(
                purchase_order=po,
                part=part,
                quantity_ordered=quantity,
                unit_price=unit_price,
                tax_rate=tax_rate,
                total=line_total + line_tax
            )
            subtotal += line_total
            tax_total += line_tax
        
        po.subtotal = subtotal
        po.tax = tax_total
        shipping = po.shipping if po.shipping is not None else Decimal('0')
        po.grand_total = subtotal + tax_total + shipping
        po.save()
        
        return po


class TechnicianScheduleSerializer(serializers.ModelSerializer):
    technician_name = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    working_hours = serializers.FloatField(read_only=True)
    
    class Meta:
        model = TechnicianSchedule
        fields = ['id', 'technician', 'technician_name', 'branch', 'branch_name', 'date',
                  'shift_start', 'shift_end', 'break_start', 'break_end', 'is_available',
                  'is_on_leave', 'leave_reason', 'notes', 'working_hours', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_technician_name(self, obj):
        return f"{obj.technician.first_name} {obj.technician.last_name}".strip() or obj.technician.username


class AppointmentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    vehicle_info = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    advisor_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Appointment
        fields = ['id', 'appointment_id', 'customer', 'customer_name', 'vehicle', 'vehicle_info',
                  'branch', 'branch_name', 'service_advisor', 'advisor_name', 'appointment_date',
                  'appointment_time', 'estimated_duration', 'service_type', 'complaint', 'status',
                  'job_card', 'reminder_sent', 'confirmation_sent', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'appointment_id', 'created_at', 'updated_at']
    
    def get_vehicle_info(self, obj):
        return f"{obj.vehicle.year or ''} {obj.vehicle.make} {obj.vehicle.model} - {obj.vehicle.plate_number}"
    
    def get_advisor_name(self, obj):
        if obj.service_advisor:
            return f"{obj.service_advisor.first_name} {obj.service_advisor.last_name}".strip() or obj.service_advisor.username
        return None


class AnalyticsSnapshotSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = AnalyticsSnapshot
        fields = ['id', 'branch', 'branch_name', 'date', 'total_jobs', 'completed_jobs', 'revenue',
                  'labor_revenue', 'parts_revenue', 'average_job_value', 'average_cycle_time',
                  'sla_compliance_rate', 'customer_satisfaction', 'technician_utilization',
                  'first_time_fix_rate', 'new_customers', 'repeat_customers', 'appointments_scheduled',
                  'appointments_completed', 'created_at']
        read_only_fields = ['id', 'created_at']


class LicenseSerializer(serializers.ModelSerializer):
    is_valid = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = License
        fields = ['id', 'license_key', 'license_type', 'status', 'organization_name', 'issued_date',
                  'expiry_date', 'max_branches', 'max_users', 'features', 'is_primary', 'support_expires',
                  'notes', 'is_valid', 'created_at', 'updated_at']
        read_only_fields = ['id', 'issued_date', 'created_at', 'updated_at']


class SystemSettingSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SystemSetting
        fields = ['id', 'key', 'value', 'value_type', 'category', 'description', 'is_secret',
                  'updated_by', 'updated_by_name', 'updated_at']
        read_only_fields = ['id', 'updated_at']
    
    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return f"{obj.updated_by.first_name} {obj.updated_by.last_name}".strip() or obj.updated_by.username
        return None
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.is_secret:
            ret['value'] = '********'
        return ret


class PaymentIntentSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    
    class Meta:
        model = PaymentIntent
        fields = ['id', 'intent_id', 'invoice', 'invoice_number', 'gateway', 'gateway_reference',
                  'amount', 'currency', 'status', 'gateway_response', 'customer_email', 'customer_phone',
                  'metadata', 'created_at', 'updated_at']
        read_only_fields = ['id', 'intent_id', 'created_at', 'updated_at']


class TallySyncJobSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TallySyncJob
        fields = ['id', 'job_id', 'sync_type', 'branch', 'branch_name', 'status', 'records_total',
                  'records_synced', 'records_failed', 'error_log', 'started_at', 'completed_at',
                  'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'job_id', 'created_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None


class TallyLedgerMappingSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = TallyLedgerMapping
        fields = ['id', 'mapping_type', 'local_id', 'local_name', 'tally_ledger_name', 'tally_group',
                  'branch', 'branch_name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class IntegrationConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = IntegrationConfig
        fields = ['id', 'name', 'integration_type', 'is_enabled', 'config', 'last_sync', 'sync_status',
                  'webhook_url', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret.pop('credentials', None)
        return ret


class AdminDashboardSerializer(serializers.Serializer):
    total_users = serializers.IntegerField()
    total_branches = serializers.IntegerField()
    active_licenses = serializers.IntegerField()
    license_info = LicenseSerializer(allow_null=True)
    integrations_status = serializers.DictField()
    system_health = serializers.DictField()


# ==================== CRM MODULE SERIALIZERS ====================

class LeadSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True, allow_null=True)
    owner_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    referred_by_customer_name = serializers.CharField(source='referred_by_customer.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Lead
        fields = ['id', 'lead_id', 'branch', 'branch_name', 'name', 'phone', 'email', 'alternate_phone',
                  'company_name', 'address', 'city', 'source', 'status', 'lead_type',
                  'vehicle_make', 'vehicle_model', 'vehicle_year', 'registration_number',
                  'service_interest', 'contract_interest', 'budget_range', 'expected_value', 'priority',
                  'owner', 'owner_name', 'assigned_to', 'assigned_to_name',
                  'referred_by_customer', 'referred_by_customer_name', 'converted_customer', 'converted_job_card',
                  'lost_reason', 'lost_to_competitor', 'next_follow_up', 'last_contact_date', 'contact_attempts',
                  'notes', 'tags', 'created_at', 'updated_at']
        read_only_fields = ['id', 'lead_id', 'created_at', 'updated_at']
    
    def get_owner_name(self, obj):
        if obj.owner:
            return f"{obj.owner.first_name} {obj.owner.last_name}".strip() or obj.owner.username
        return None
    
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.username
        return None


class CustomerInteractionSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True, allow_null=True)
    lead_name = serializers.CharField(source='lead.name', read_only=True, allow_null=True)
    job_card_number = serializers.CharField(source='job_card.job_card_number', read_only=True, allow_null=True)
    handled_by_name = serializers.SerializerMethodField()
    initiated_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomerInteraction
        fields = ['id', 'interaction_id', 'customer', 'customer_name', 'lead', 'lead_name',
                  'job_card', 'job_card_number', 'contract', 'branch', 'interaction_type', 'channel',
                  'direction', 'subject', 'description', 'outcome', 'sentiment', 'duration_minutes',
                  'next_action', 'next_action_date', 'initiated_by', 'initiated_by_name',
                  'handled_by', 'handled_by_name', 'attachments', 'metadata', 'is_private', 'created_at']
        read_only_fields = ['id', 'interaction_id', 'created_at']
    
    def get_handled_by_name(self, obj):
        if obj.handled_by:
            return f"{obj.handled_by.first_name} {obj.handled_by.last_name}".strip() or obj.handled_by.username
        return None
    
    def get_initiated_by_name(self, obj):
        if obj.initiated_by:
            return f"{obj.initiated_by.first_name} {obj.initiated_by.last_name}".strip() or obj.initiated_by.username
        return None


class TicketSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    vehicle_info = serializers.SerializerMethodField()
    job_card_number = serializers.CharField(source='job_card.job_card_number', read_only=True, allow_null=True)
    assigned_to_name = serializers.SerializerMethodField()
    escalated_to_name = serializers.SerializerMethodField()
    raised_by_name = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True, allow_null=True)
    age_hours = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = ['id', 'ticket_id', 'customer', 'customer_name', 'vehicle', 'vehicle_info',
                  'job_card', 'job_card_number', 'contract', 'invoice', 'branch', 'branch_name',
                  'ticket_type', 'status', 'priority', 'subject', 'description', 'resolution', 'root_cause',
                  'compensation_offered', 'raised_by', 'raised_by_name', 'assigned_to', 'assigned_to_name',
                  'escalated_to', 'escalated_to_name', 'escalation_level', 'escalation_reason',
                  'sla_response_hours', 'sla_resolution_hours', 'first_response_at', 'sla_breached',
                  'customer_satisfaction', 'feedback', 'attachments', 'age_hours',
                  'resolved_at', 'closed_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'ticket_id', 'created_at', 'updated_at']
    
    def get_vehicle_info(self, obj):
        if obj.vehicle:
            return f"{obj.vehicle.year or ''} {obj.vehicle.make} {obj.vehicle.model} - {obj.vehicle.plate_number}"
        return None
    
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.username
        return None
    
    def get_escalated_to_name(self, obj):
        if obj.escalated_to:
            return f"{obj.escalated_to.first_name} {obj.escalated_to.last_name}".strip() or obj.escalated_to.username
        return None
    
    def get_raised_by_name(self, obj):
        if obj.raised_by:
            return f"{obj.raised_by.first_name} {obj.raised_by.last_name}".strip() or obj.raised_by.username
        return None
    
    def get_age_hours(self, obj):
        from django.utils import timezone
        if obj.created_at:
            delta = timezone.now() - obj.created_at
            return round(delta.total_seconds() / 3600, 1)
        return 0


class FollowUpTaskSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True, allow_null=True)
    lead_name = serializers.CharField(source='lead.name', read_only=True, allow_null=True)
    assigned_to_name = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = FollowUpTask
        fields = ['id', 'task_id', 'customer', 'customer_name', 'lead', 'lead_name',
                  'ticket', 'job_card', 'contract', 'branch', 'follow_up_type', 'status', 'priority',
                  'subject', 'description', 'due_date', 'reminder_date', 'assigned_to', 'assigned_to_name',
                  'created_by', 'created_by_name', 'outcome', 'next_action', 'is_overdue',
                  'completed_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'task_id', 'created_at', 'updated_at']
    
    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return f"{obj.assigned_to.first_name} {obj.assigned_to.last_name}".strip() or obj.assigned_to.username
        return None
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_is_overdue(self, obj):
        from django.utils import timezone
        if obj.status in ['PENDING', 'IN_PROGRESS'] and obj.due_date:
            return timezone.now() > obj.due_date
        return False


class CampaignSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True, allow_null=True)
    created_by_name = serializers.SerializerMethodField()
    open_rate = serializers.FloatField(read_only=True)
    click_rate = serializers.FloatField(read_only=True)
    conversion_rate = serializers.FloatField(read_only=True)
    
    class Meta:
        model = Campaign
        fields = ['id', 'campaign_id', 'name', 'campaign_type', 'status', 'branch', 'branch_name',
                  'channel', 'target_segment', 'target_criteria', 'message_template', 'subject',
                  'offer_details', 'discount_percent', 'valid_from', 'valid_until',
                  'scheduled_at', 'started_at', 'completed_at',
                  'total_recipients', 'messages_sent', 'messages_delivered', 'messages_opened', 'messages_clicked',
                  'conversions', 'revenue_generated', 'cost', 'open_rate', 'click_rate', 'conversion_rate',
                  'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'campaign_id', 'messages_sent', 'messages_delivered', 'messages_opened',
                           'messages_clicked', 'conversions', 'revenue_generated', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None


class CampaignRecipientSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_phone = serializers.CharField(source='customer.phone', read_only=True)
    customer_email = serializers.CharField(source='customer.email', read_only=True)
    
    class Meta:
        model = CampaignRecipient
        fields = ['id', 'campaign', 'customer', 'customer_name', 'customer_phone', 'customer_email',
                  'sent_at', 'delivered_at', 'opened_at', 'clicked_at', 'converted', 'converted_at',
                  'conversion_value', 'unsubscribed', 'error_message']


class CustomerScoreSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    customer_id = serializers.CharField(source='customer.customer_id', read_only=True)
    
    class Meta:
        model = CustomerScore
        fields = ['id', 'customer', 'customer_id', 'customer_name', 'overall_score',
                  'visit_frequency_score', 'revenue_score', 'payment_behavior_score',
                  'complaint_score', 'loyalty_score', 'engagement_score',
                  'segment', 'churn_risk', 'lifetime_value', 'predicted_next_visit',
                  'last_calculated', 'calculation_metadata']
        read_only_fields = ['id', 'overall_score', 'segment', 'churn_risk', 'last_calculated']


class CRMEventSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True, allow_null=True)
    lead_name = serializers.CharField(source='lead.name', read_only=True, allow_null=True)
    triggered_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CRMEvent
        fields = ['id', 'event_id', 'event_type', 'customer', 'customer_name', 'lead', 'lead_name',
                  'related_object_type', 'related_object_id', 'description', 'metadata',
                  'triggered_by', 'triggered_by_name', 'is_system_generated', 'created_at']
        read_only_fields = ['id', 'event_id', 'created_at']
    
    def get_triggered_by_name(self, obj):
        if obj.triggered_by:
            return f"{obj.triggered_by.first_name} {obj.triggered_by.last_name}".strip() or obj.triggered_by.username
        return None


class Customer360Serializer(serializers.ModelSerializer):
    vehicles = VehicleSerializer(many=True, read_only=True)
    interactions = CustomerInteractionSerializer(many=True, read_only=True)
    tickets = TicketSerializer(many=True, read_only=True)
    follow_up_tasks = FollowUpTaskSerializer(many=True, read_only=True)
    score = CustomerScoreSerializer(read_only=True)
    contracts = ContractSerializer(source='contracts_as_customer', many=True, read_only=True)
    job_cards_count = serializers.SerializerMethodField()
    open_tickets_count = serializers.SerializerMethodField()
    pending_tasks_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Customer
        fields = ['id', 'customer_id', 'name', 'phone', 'email', 'alternate_phone', 'alternate_email',
                  'address', 'city', 'state', 'pincode', 'customer_type', 'customer_category',
                  'preferred_channel', 'loyalty_points', 'total_revenue', 'total_visits', 'last_visit_date',
                  'date_of_birth', 'anniversary_date', 'notes', 'tags', 'do_not_contact', 'is_active',
                  'vehicles', 'interactions', 'tickets', 'follow_up_tasks', 'score', 'contracts',
                  'job_cards_count', 'open_tickets_count', 'pending_tasks_count', 'created_at', 'updated_at']
    
    def get_job_cards_count(self, obj):
        return obj.job_cards.count()
    
    def get_open_tickets_count(self, obj):
        return obj.tickets.exclude(status__in=['RESOLVED', 'CLOSED']).count()
    
    def get_pending_tasks_count(self, obj):
        return obj.follow_up_tasks.filter(status__in=['PENDING', 'IN_PROGRESS']).count()


class DepartmentSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    manager_name = serializers.SerializerMethodField()
    employee_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'branch', 'branch_name', 'manager', 'manager_name', 
                  'description', 'allowed_roles', 'is_active', 'employee_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_manager_name(self, obj):
        if obj.manager and obj.manager.user:
            return f"{obj.manager.user.first_name} {obj.manager.user.last_name}".strip() or obj.manager.user.username
        return None
    
    def get_employee_count(self, obj):
        return obj.employees.filter(is_active=True).count()


class EmployeeAssignmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_email = serializers.SerializerMethodField()
    department_name = serializers.CharField(source='department.name', read_only=True)
    
    class Meta:
        model = EmployeeAssignment
        fields = ['id', 'profile', 'employee_name', 'employee_email', 'department', 'department_name',
                  'designation', 'start_date', 'end_date', 'allocation_percentage', 'is_primary', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_employee_name(self, obj):
        if obj.profile and obj.profile.user:
            return f"{obj.profile.user.first_name} {obj.profile.user.last_name}".strip() or obj.profile.user.username
        return None
    
    def get_employee_email(self, obj):
        if obj.profile and obj.profile.user:
            return obj.profile.user.email
        return None


class WorkShiftSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = WorkShift
        fields = ['id', 'name', 'branch', 'branch_name', 'start_time', 'end_time', 
                  'break_duration_minutes', 'working_days', 'is_active']
        read_only_fields = ['id']


class AttendanceRecordSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    shift_name = serializers.CharField(source='shift.name', read_only=True, allow_null=True)
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = AttendanceRecord
        fields = ['id', 'profile', 'employee_name', 'date', 'status', 'check_in', 'check_out',
                  'work_hours', 'overtime_hours', 'shift', 'shift_name', 'source', 'notes',
                  'approved_by', 'approved_by_name', 'created_at']
        read_only_fields = ['id', 'created_at', 'work_hours']
    
    def get_employee_name(self, obj):
        if obj.profile and obj.profile.user:
            return f"{obj.profile.user.first_name} {obj.profile.user.last_name}".strip() or obj.profile.user.username
        return None
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return None


class RolePermissionSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = RolePermission
        fields = ['id', 'role', 'role_display', 'module', 'can_view', 'can_create', 
                  'can_edit', 'can_delete', 'can_approve', 'can_export', 'custom_permissions']
        read_only_fields = ['id']


class EmailConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailConfiguration
        fields = ['id', 'name', 'smtp_host', 'smtp_port', 'smtp_username', 'smtp_password',
                  'use_tls', 'use_ssl', 'from_email', 'from_name', 'is_active', 'is_default',
                  'last_tested', 'test_status', 'created_at']
        read_only_fields = ['id', 'last_tested', 'test_status', 'created_at']
        extra_kwargs = {'smtp_password': {'write_only': True}}


class WhatsAppConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = WhatsAppConfiguration
        fields = ['id', 'name', 'provider', 'api_key', 'api_secret', 'phone_number', 
                  'account_sid', 'webhook_url', 'is_active', 'is_default',
                  'last_tested', 'test_status', 'created_at']
        read_only_fields = ['id', 'last_tested', 'test_status', 'created_at']
        extra_kwargs = {'api_key': {'write_only': True}, 'api_secret': {'write_only': True}}


class PaymentGatewayConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentGatewayConfiguration
        fields = ['id', 'name', 'gateway_type', 'api_key', 'api_secret', 'merchant_id',
                  'webhook_secret', 'environment', 'is_active', 'is_default',
                  'supported_currencies', 'config', 'last_tested', 'test_status', 'created_at']
        read_only_fields = ['id', 'last_tested', 'test_status', 'created_at']
        extra_kwargs = {'api_key': {'write_only': True}, 'api_secret': {'write_only': True}, 'webhook_secret': {'write_only': True}}


class TallyConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = TallyConfiguration
        fields = ['id', 'name', 'tally_url', 'company_name', 'port', 'sync_invoices',
                  'sync_customers', 'sync_payments', 'auto_sync_enabled', 'sync_interval_minutes',
                  'last_sync', 'sync_status', 'is_active', 'created_at']
        read_only_fields = ['id', 'last_sync', 'sync_status', 'created_at']


class PartReservationSerializer(serializers.ModelSerializer):
    part_name = serializers.CharField(source='part.name', read_only=True)
    part_sku = serializers.CharField(source='part.sku', read_only=True)
    job_card_number = serializers.CharField(source='job_card.job_card_number', read_only=True)
    reserved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PartReservation
        fields = ['id', 'reservation_number', 'job_card', 'job_card_number', 'part', 'part_name',
                  'part_sku', 'task', 'quantity', 'status', 'reserved_by', 'reserved_by_name',
                  'reserved_at', 'expires_at', 'issued_at', 'released_at', 'notes']
        read_only_fields = ['id', 'reservation_number', 'reserved_at', 'issued_at', 'released_at']
    
    def get_reserved_by_name(self, obj):
        if obj.reserved_by:
            return f"{obj.reserved_by.first_name} {obj.reserved_by.last_name}".strip() or obj.reserved_by.username
        return None


class GRNLineSerializer(serializers.ModelSerializer):
    part_name = serializers.CharField(source='part.name', read_only=True)
    part_sku = serializers.CharField(source='part.sku', read_only=True)
    
    class Meta:
        model = GRNLine
        fields = ['id', 'grn', 'po_line', 'part', 'part_name', 'part_sku',
                  'quantity_received', 'quantity_accepted', 'quantity_rejected',
                  'rejection_reason', 'batch_number', 'expiry_date', 'location', 'quality_rating']
        read_only_fields = ['id']


class GoodsReceiptNoteSerializer(serializers.ModelSerializer):
    po_number = serializers.CharField(source='purchase_order.po_number', read_only=True)
    supplier_name = serializers.CharField(source='purchase_order.supplier.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    received_by_name = serializers.SerializerMethodField()
    inspected_by_name = serializers.SerializerMethodField()
    lines = GRNLineSerializer(many=True, read_only=True)
    
    class Meta:
        model = GoodsReceiptNote
        fields = ['id', 'grn_number', 'purchase_order', 'po_number', 'supplier_name',
                  'branch', 'branch_name', 'status', 'receipt_date', 'invoice_number',
                  'invoice_date', 'invoice_amount', 'delivery_challan', 'vehicle_number',
                  'received_by', 'received_by_name', 'inspected_by', 'inspected_by_name',
                  'inspection_date', 'inspection_notes', 'total_received_qty',
                  'total_accepted_qty', 'total_rejected_qty', 'notes', 'lines', 'created_at']
        read_only_fields = ['id', 'grn_number', 'receipt_date', 'created_at']
    
    def get_received_by_name(self, obj):
        if obj.received_by:
            return f"{obj.received_by.first_name} {obj.received_by.last_name}".strip() or obj.received_by.username
        return None
    
    def get_inspected_by_name(self, obj):
        if obj.inspected_by:
            return f"{obj.inspected_by.first_name} {obj.inspected_by.last_name}".strip() or obj.inspected_by.username
        return None


class StockTransferLineSerializer(serializers.ModelSerializer):
    part_name = serializers.CharField(source='part.name', read_only=True)
    part_sku = serializers.CharField(source='part.sku', read_only=True)
    
    class Meta:
        model = StockTransferLine
        fields = ['id', 'transfer', 'part', 'part_name', 'part_sku',
                  'quantity', 'quantity_received', 'batch_number', 'notes']
        read_only_fields = ['id']


class StockTransferSerializer(serializers.ModelSerializer):
    from_branch_name = serializers.CharField(source='from_branch.name', read_only=True)
    to_branch_name = serializers.CharField(source='to_branch.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    received_by_name = serializers.SerializerMethodField()
    lines = StockTransferLineSerializer(many=True, read_only=True)
    
    class Meta:
        model = StockTransfer
        fields = ['id', 'transfer_number', 'from_branch', 'from_branch_name',
                  'to_branch', 'to_branch_name', 'status', 'transfer_date',
                  'expected_arrival', 'actual_arrival', 'created_by', 'created_by_name',
                  'approved_by', 'approved_by_name', 'received_by', 'received_by_name',
                  'vehicle_number', 'driver_name', 'driver_phone', 'notes', 'lines',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'transfer_number', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return None
    
    def get_received_by_name(self, obj):
        if obj.received_by:
            return f"{obj.received_by.first_name} {obj.received_by.last_name}".strip() or obj.received_by.username
        return None


class PRLineSerializer(serializers.ModelSerializer):
    part_name = serializers.CharField(source='part.name', read_only=True)
    part_sku = serializers.CharField(source='part.sku', read_only=True)
    
    class Meta:
        model = PRLine
        fields = ['id', 'purchase_requisition', 'part', 'part_name', 'part_sku',
                  'quantity', 'current_stock', 'min_stock', 'notes']
        read_only_fields = ['id']


class PurchaseRequisitionSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    job_card_number = serializers.CharField(source='job_card.job_card_number', read_only=True, allow_null=True)
    supplier_name = serializers.CharField(source='suggested_supplier.name', read_only=True, allow_null=True)
    po_number = serializers.CharField(source='purchase_order.po_number', read_only=True, allow_null=True)
    created_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    lines = PRLineSerializer(many=True, read_only=True)
    
    class Meta:
        model = PurchaseRequisition
        fields = ['id', 'pr_number', 'branch', 'branch_name', 'status', 'source',
                  'priority', 'required_date', 'job_card', 'job_card_number',
                  'suggested_supplier', 'supplier_name', 'purchase_order', 'po_number',
                  'created_by', 'created_by_name', 'approved_by', 'approved_by_name',
                  'approval_date', 'rejection_reason', 'notes', 'lines',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'pr_number', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return None


class SupplierPerformanceSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    
    class Meta:
        model = SupplierPerformance
        fields = ['id', 'supplier', 'supplier_name', 'period_start', 'period_end',
                  'total_orders', 'orders_on_time', 'orders_late', 'total_items_ordered',
                  'items_accepted', 'items_rejected', 'total_value', 'price_variance',
                  'avg_delivery_days', 'on_time_rate', 'quality_rate', 'overall_score',
                  'created_at']
        read_only_fields = ['id', 'created_at']


class InventoryAlertSerializer(serializers.ModelSerializer):
    part_name = serializers.CharField(source='part.name', read_only=True)
    part_sku = serializers.CharField(source='part.sku', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    resolved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = InventoryAlert
        fields = ['id', 'alert_id', 'alert_type', 'part', 'part_name', 'part_sku',
                  'branch', 'branch_name', 'message', 'severity', 'is_read',
                  'is_resolved', 'resolved_by', 'resolved_by_name', 'resolved_at',
                  'resolution_notes', 'created_at']
        read_only_fields = ['id', 'alert_id', 'created_at']
    
    def get_resolved_by_name(self, obj):
        if obj.resolved_by:
            return f"{obj.resolved_by.first_name} {obj.resolved_by.last_name}".strip() or obj.resolved_by.username
        return None


# =====================================================
# ENTERPRISE ACCOUNTS & FINANCE SERIALIZERS
# =====================================================

class AccountSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True, allow_null=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True, allow_null=True)
    children_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Account
        fields = ['id', 'code', 'name', 'category', 'account_type', 'parent', 'parent_name',
                  'branch', 'branch_name', 'description', 'is_system', 'is_active',
                  'opening_balance', 'current_balance', 'children_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_children_count(self, obj):
        return obj.children.count()


class TaxRateSerializer(serializers.ModelSerializer):
    liability_account_name = serializers.CharField(source='liability_account.name', read_only=True, allow_null=True)
    input_account_name = serializers.CharField(source='input_account.name', read_only=True, allow_null=True)
    
    class Meta:
        model = TaxRate
        fields = ['id', 'name', 'tax_type', 'rate', 'hsn_sac_code', 'description',
                  'is_compound', 'is_active', 'effective_from', 'effective_to',
                  'liability_account', 'liability_account_name', 'input_account', 'input_account_name',
                  'created_at']
        read_only_fields = ['id', 'created_at']


class InvoiceLineSerializer(serializers.ModelSerializer):
    part_name = serializers.CharField(source='part.name', read_only=True, allow_null=True)
    task_name = serializers.CharField(source='task.name', read_only=True, allow_null=True)
    tax_rate_name = serializers.CharField(source='tax_rate.name', read_only=True, allow_null=True)
    
    class Meta:
        model = InvoiceLine
        fields = ['id', 'invoice', 'line_number', 'line_type', 'description', 'hsn_sac_code',
                  'part', 'part_name', 'task', 'task_name', 'quantity', 'unit', 'unit_price',
                  'discount_percent', 'discount_amount', 'taxable_amount', 'tax_rate', 'tax_rate_name',
                  'cgst_rate', 'cgst_amount', 'sgst_rate', 'sgst_amount', 'igst_rate', 'igst_amount',
                  'cess_rate', 'cess_amount', 'total_amount', 'is_warranty_covered', 'is_contract_covered',
                  'coverage_percent']
        read_only_fields = ['id', 'discount_amount', 'taxable_amount', 'cgst_amount', 'sgst_amount',
                           'igst_amount', 'cess_amount', 'total_amount']


class EnhancedInvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    job_card_number = serializers.CharField(source='job_card.job_card_number', read_only=True, allow_null=True)
    contract_number = serializers.CharField(source='contract.contract_number', read_only=True, allow_null=True)
    lines = InvoiceLineSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EnhancedInvoice
        fields = ['id', 'invoice_number', 'invoice_type', 'status', 'job_card', 'job_card_number',
                  'contract', 'contract_number', 'customer', 'customer_name', 'branch', 'branch_name',
                  'billing_address', 'shipping_address', 'gstin', 'place_of_supply', 'is_igst',
                  'subtotal', 'discount_amount', 'discount_percent', 'taxable_amount',
                  'cgst_amount', 'sgst_amount', 'igst_amount', 'cess_amount', 'total_tax',
                  'grand_total', 'amount_in_words', 'amount_paid', 'balance_due',
                  'invoice_date', 'due_date', 'payment_terms', 'terms_and_conditions', 'notes',
                  'is_reverse_charge', 'is_export', 'is_sez', 'e_invoice_irn', 'e_way_bill_no',
                  'approved_by', 'approved_by_name', 'approved_at', 'created_by', 'created_by_name',
                  'lines', 'created_at', 'updated_at']
        read_only_fields = ['id', 'invoice_number', 'balance_due', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return None


class CreditNoteLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = CreditNoteLine
        fields = ['id', 'credit_note', 'original_line', 'description', 'hsn_sac_code',
                  'quantity', 'unit_price', 'taxable_amount', 'tax_amount', 'total_amount']
        read_only_fields = ['id']


class CreditNoteSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    original_invoice_number = serializers.CharField(source='original_invoice.invoice_number', read_only=True)
    lines = CreditNoteLineSerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = CreditNote
        fields = ['id', 'credit_note_number', 'original_invoice', 'original_invoice_number',
                  'customer', 'customer_name', 'branch', 'branch_name', 'reason', 'reason_detail',
                  'subtotal', 'tax_amount', 'total_amount', 'status', 'is_adjusted', 'adjusted_invoice',
                  'is_refunded', 'refund_amount', 'refund_date', 'credit_note_date',
                  'approved_by', 'approved_by_name', 'approved_at', 'created_by', 'created_by_name',
                  'lines', 'created_at', 'updated_at']
        read_only_fields = ['id', 'credit_note_number', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return None


class PaymentAllocationSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    
    class Meta:
        model = PaymentAllocation
        fields = ['id', 'payment', 'invoice', 'invoice_number', 'amount', 'allocated_at']
        read_only_fields = ['id', 'allocated_at']


class EnhancedPaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True, allow_null=True)
    allocations = PaymentAllocationSerializer(many=True, read_only=True)
    received_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EnhancedPayment
        fields = ['id', 'payment_number', 'invoice', 'invoice_number', 'customer', 'customer_name',
                  'branch', 'branch_name', 'amount', 'payment_mode', 'status', 'payment_date',
                  'payment_time', 'reference_number', 'bank_name', 'cheque_number', 'cheque_date',
                  'card_last_four', 'transaction_id', 'is_advance', 'advance_balance',
                  'is_refund', 'refund_reason', 'original_payment', 'notes',
                  'received_by', 'received_by_name', 'allocations', 'created_at', 'updated_at']
        read_only_fields = ['id', 'payment_number', 'created_at', 'updated_at']
    
    def get_received_by_name(self, obj):
        if obj.received_by:
            return f"{obj.received_by.first_name} {obj.received_by.last_name}".strip() or obj.received_by.username
        return None


class ExpenseCategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True, allow_null=True)
    expense_account_name = serializers.CharField(source='expense_account.name', read_only=True, allow_null=True)
    
    class Meta:
        model = ExpenseCategory
        fields = ['id', 'name', 'code', 'parent', 'parent_name', 'expense_account', 'expense_account_name',
                  'description', 'budget_limit', 'requires_approval', 'approval_threshold', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class ExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True, allow_null=True)
    job_card_number = serializers.CharField(source='job_card.job_card_number', read_only=True, allow_null=True)
    submitted_by_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Expense
        fields = ['id', 'expense_number', 'category', 'category_name', 'branch', 'branch_name',
                  'supplier', 'supplier_name', 'description', 'expense_date', 'amount', 'tax_amount',
                  'total_amount', 'status', 'payment_mode', 'reference_number', 'invoice_number',
                  'invoice_date', 'cost_center', 'job_card', 'job_card_number', 'is_reimbursable',
                  'is_recurring', 'recurring_frequency', 'attachments', 'notes',
                  'submitted_by', 'submitted_by_name', 'submitted_at', 'approved_by', 'approved_by_name',
                  'approved_at', 'rejection_reason', 'created_at', 'updated_at']
        read_only_fields = ['id', 'expense_number', 'created_at', 'updated_at']
    
    def get_submitted_by_name(self, obj):
        if obj.submitted_by:
            return f"{obj.submitted_by.first_name} {obj.submitted_by.last_name}".strip() or obj.submitted_by.username
        return None
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return None


class LedgerEntrySerializer(serializers.ModelSerializer):
    account_code = serializers.CharField(source='account.code', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    journal_number = serializers.CharField(source='journal.journal_number', read_only=True)
    
    class Meta:
        model = LedgerEntry
        fields = ['id', 'journal', 'journal_number', 'account', 'account_code', 'account_name',
                  'branch', 'branch_name', 'debit', 'credit', 'narration', 'cost_center',
                  'entry_date', 'running_balance', 'created_at']
        read_only_fields = ['id', 'created_at']


class JournalEntrySerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    ledger_entries = LedgerEntrySerializer(many=True, read_only=True)
    created_by_name = serializers.SerializerMethodField()
    posted_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = JournalEntry
        fields = ['id', 'journal_number', 'entry_type', 'branch', 'branch_name', 'entry_date',
                  'description', 'reference_type', 'reference_id', 'reference_number',
                  'total_debit', 'total_credit', 'is_balanced', 'is_posted', 'posted_at',
                  'posted_by', 'posted_by_name', 'is_reversed', 'reversal_of',
                  'created_by', 'created_by_name', 'ledger_entries', 'created_at', 'updated_at']
        read_only_fields = ['id', 'journal_number', 'is_balanced', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_posted_by_name(self, obj):
        if obj.posted_by:
            return f"{obj.posted_by.first_name} {obj.posted_by.last_name}".strip() or obj.posted_by.username
        return None


class CustomerReceivableSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    invoice_number = serializers.CharField(source='invoice.invoice_number', read_only=True)
    
    class Meta:
        model = CustomerReceivable
        fields = ['id', 'customer', 'customer_name', 'branch', 'branch_name', 'invoice', 'invoice_number',
                  'original_amount', 'outstanding_amount', 'due_date', 'days_overdue', 'aging_bucket',
                  'last_reminder_date', 'reminder_count', 'is_disputed', 'dispute_reason',
                  'is_written_off', 'written_off_amount', 'written_off_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'days_overdue', 'aging_bucket', 'created_at', 'updated_at']


class VendorPayableSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    po_number = serializers.CharField(source='purchase_order.po_number', read_only=True, allow_null=True)
    grn_number = serializers.CharField(source='grn.grn_number', read_only=True, allow_null=True)
    
    class Meta:
        model = VendorPayable
        fields = ['id', 'supplier', 'supplier_name', 'branch', 'branch_name', 'purchase_order', 'po_number',
                  'grn', 'grn_number', 'invoice_number', 'invoice_date', 'original_amount', 'outstanding_amount',
                  'tds_amount', 'tds_rate', 'net_payable', 'due_date', 'days_overdue', 'aging_bucket',
                  'is_approved', 'approved_by', 'approved_at', 'is_paid', 'paid_date', 'payment_reference',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'days_overdue', 'aging_bucket', 'created_at', 'updated_at']


class FinancialAuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name', read_only=True, allow_null=True)
    
    class Meta:
        model = FinancialAuditLog
        fields = ['id', 'user', 'user_name', 'user_role', 'branch', 'branch_name', 'action',
                  'model_name', 'object_id', 'object_repr', 'document_number', 'old_data', 'new_data',
                  'amount_before', 'amount_after', 'reason', 'is_critical', 'timestamp']
        read_only_fields = ['id', 'timestamp']
    
    def get_user_name(self, obj):
        if obj.user:
            return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.username
        return None


class FinancialPeriodSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    closed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = FinancialPeriod
        fields = ['id', 'name', 'branch', 'branch_name', 'start_date', 'end_date', 'status',
                  'is_year_end', 'closed_by', 'closed_by_name', 'closed_at', 'closing_balance', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_closed_by_name(self, obj):
        if obj.closed_by:
            return f"{obj.closed_by.first_name} {obj.closed_by.last_name}".strip() or obj.closed_by.username
        return None


class BudgetEntrySerializer(serializers.ModelSerializer):
    account_code = serializers.CharField(source='account.code', read_only=True)
    account_name = serializers.CharField(source='account.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    period_name = serializers.CharField(source='period.name', read_only=True)
    
    class Meta:
        model = BudgetEntry
        fields = ['id', 'account', 'account_code', 'account_name', 'branch', 'branch_name',
                  'period', 'period_name', 'budgeted_amount', 'actual_amount', 'variance',
                  'variance_percent', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'variance', 'variance_percent', 'created_at', 'updated_at']


class FinanceDashboardSerializer(serializers.Serializer):
    total_revenue = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_receivables = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_payables = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_expenses = serializers.DecimalField(max_digits=14, decimal_places=2)
    cash_balance = serializers.DecimalField(max_digits=14, decimal_places=2)
    bank_balance = serializers.DecimalField(max_digits=14, decimal_places=2)
    outstanding_invoices = serializers.IntegerField()
    overdue_invoices = serializers.IntegerField()
    pending_payments = serializers.IntegerField()
    pending_expenses = serializers.IntegerField()
    receivables_aging = serializers.DictField()
    payables_aging = serializers.DictField()
    revenue_trend = serializers.ListField()
    expense_trend = serializers.ListField()


# HRMS Serializers
class SkillSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skill
        fields = ['id', 'name', 'code', 'category', 'description', 'is_certifiable', 
                  'certification_required', 'max_level', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class EmployeeSkillSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    skill_category = serializers.CharField(source='skill.category', read_only=True)
    employee_name = serializers.SerializerMethodField()
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeSkill
        fields = ['id', 'employee', 'employee_name', 'skill', 'skill_name', 'skill_category',
                  'level', 'years_of_experience', 'approval_status', 'approved_by', 'approved_by_name',
                  'approved_date', 'certification_number', 'certification_expiry', 
                  'certifying_authority', 'jobs_completed', 'average_rating', 'last_used_date',
                  'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_employee_name(self, obj):
        return f"{obj.employee.user.first_name} {obj.employee.user.last_name}".strip() or obj.employee.user.username
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return None


class EmployeeSerializer(serializers.ModelSerializer):
    profile_name = serializers.SerializerMethodField()
    reporting_manager_name = serializers.SerializerMethodField()
    skills = EmployeeSkillSerializer(source='profile.employee_skills', many=True, read_only=True)
    
    class Meta:
        model = Employee
        fields = ['id', 'profile', 'profile_name', 'department', 'designation', 
                  'reporting_manager', 'reporting_manager_name', 'employment_type',
                  'joining_date', 'confirmation_date', 'separation_date', 'separation_reason',
                  'base_salary', 'currency', 'bank_name', 'bank_account_number', 'ifsc_code',
                  'pan_number', 'uan_number', 'pf_number', 'esi_number', 'ctc',
                  'performance_rating', 'last_appraisal_date', 'next_appraisal_date',
                  'is_billable', 'is_active', 'skills', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_profile_name(self, obj):
        return f"{obj.profile.user.first_name} {obj.profile.user.last_name}".strip() or obj.profile.user.username
    
    def get_reporting_manager_name(self, obj):
        if obj.reporting_manager:
            return f"{obj.reporting_manager.profile.user.first_name} {obj.reporting_manager.profile.user.last_name}".strip()
        return None


class TrainingProgramSerializer(serializers.ModelSerializer):
    created_by_name = serializers.SerializerMethodField()
    enrolled_count = serializers.SerializerMethodField()
    
    class Meta:
        model = TrainingProgram
        fields = ['id', 'name', 'code', 'description', 'training_type', 'skill', 
                  'skill_level_on_completion', 'duration_hours', 'start_date', 'end_date',
                  'location', 'trainer_name', 'trainer_organization', 'max_participants',
                  'cost_per_participant', 'is_mandatory', 'status', 'created_by',
                  'created_by_name', 'enrolled_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None
    
    def get_enrolled_count(self, obj):
        return obj.enrollments.count()


class TrainingEnrollmentSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    program_name = serializers.CharField(source='program.name', read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = TrainingEnrollment
        fields = ['id', 'program', 'program_name', 'employee', 'employee_name',
                  'enrollment_date', 'status', 'attendance_percentage', 'score',
                  'completion_date', 'certificate_issued', 'feedback', 'approved_by',
                  'approved_by_name', 'approval_date', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_employee_name(self, obj):
        return f"{obj.employee.user.first_name} {obj.employee.user.last_name}".strip() or obj.employee.user.username
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return None


class IncentiveRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncentiveRule
        fields = ['id', 'name', 'code', 'description', 'rule_type', 'skill_category',
                  'skill_level', 'metric_type', 'threshold_value', 'amount_type',
                  'incentive_amount', 'max_amount_per_month', 'is_active',
                  'effective_from', 'effective_to', 'created_at']
        read_only_fields = ['id', 'created_at']


class EmployeeIncentiveSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    rule_name = serializers.CharField(source='rule.name', read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = EmployeeIncentive
        fields = ['id', 'employee', 'employee_name', 'rule', 'rule_name', 'period_start',
                  'period_end', 'metric_value', 'calculated_amount', 'final_amount',
                  'status', 'approved_by', 'approved_by_name', 'approved_date',
                  'paid_date', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_employee_name(self, obj):
        return f"{obj.employee.user.first_name} {obj.employee.user.last_name}".strip() or obj.employee.user.username
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return None


class LeaveTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveType
        fields = ['id', 'name', 'code', 'description', 'days_allowed', 'is_paid',
                  'is_encashable', 'carry_forward_allowed', 'max_carry_forward',
                  'requires_approval', 'min_days_advance', 'max_consecutive_days',
                  'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class LeaveBalanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    
    class Meta:
        model = LeaveBalance
        fields = ['id', 'employee', 'employee_name', 'leave_type', 'leave_type_name',
                  'year', 'opening_balance', 'accrued', 'used', 'encashed',
                  'carry_forward', 'closing_balance', 'updated_at']
        read_only_fields = ['id', 'updated_at']
    
    def get_employee_name(self, obj):
        return f"{obj.employee.user.first_name} {obj.employee.user.last_name}".strip() or obj.employee.user.username


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    leave_type_name = serializers.CharField(source='leave_type.name', read_only=True)
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = LeaveRequest
        fields = ['id', 'employee', 'employee_name', 'leave_type', 'leave_type_name',
                  'start_date', 'end_date', 'days_count', 'is_half_day', 'half_day_type',
                  'reason', 'status', 'approved_by', 'approved_by_name', 'approved_date',
                  'rejection_reason', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_employee_name(self, obj):
        return f"{obj.employee.user.first_name} {obj.employee.user.last_name}".strip() or obj.employee.user.username
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return None


class HolidaySerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Holiday
        fields = ['id', 'name', 'date', 'description', 'is_optional', 'is_restricted',
                  'applicable_departments', 'branch', 'branch_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class HRShiftSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True, allow_null=True)
    
    class Meta:
        model = HRShift
        fields = ['id', 'name', 'code', 'start_time', 'end_time', 'break_duration_minutes',
                  'grace_period_minutes', 'is_night_shift', 'is_active', 'branch', 'branch_name']
        read_only_fields = ['id']


class EmployeeShiftSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    shift_name = serializers.CharField(source='shift.name', read_only=True)
    
    class Meta:
        model = EmployeeShift
        fields = ['id', 'employee', 'employee_name', 'shift', 'shift_name',
                  'effective_from', 'effective_to', 'is_current']
        read_only_fields = ['id']
    
    def get_employee_name(self, obj):
        return f"{obj.employee.user.first_name} {obj.employee.user.last_name}".strip() or obj.employee.user.username


class HRAttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    shift_name = serializers.CharField(source='shift.name', read_only=True, allow_null=True)
    approved_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = HRAttendance
        fields = ['id', 'employee', 'employee_name', 'date', 'status', 'check_in_time',
                  'check_out_time', 'break_duration_minutes', 'total_hours', 'overtime_hours',
                  'shift', 'shift_name', 'is_regularized', 'regularization_reason',
                  'approved_by', 'approved_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_employee_name(self, obj):
        return f"{obj.employee.user.first_name} {obj.employee.user.last_name}".strip() or obj.employee.user.username
    
    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}".strip() or obj.approved_by.username
        return None


class PayrollSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    generated_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Payroll
        fields = ['id', 'employee', 'employee_name', 'period_start', 'period_end',
                  'base_salary', 'hra', 'conveyance', 'medical', 'special_allowance',
                  'other_allowances', 'incentives', 'overtime_amount', 'gross_salary',
                  'pf_employee', 'pf_employer', 'esi_employee', 'esi_employer',
                  'professional_tax', 'tds', 'other_deductions', 'total_deductions',
                  'net_amount', 'status', 'generated_by', 'generated_by_name',
                  'approved_by', 'approved_date', 'paid_date', 'payment_mode',
                  'transaction_reference', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_employee_name(self, obj):
        return f"{obj.employee.user.first_name} {obj.employee.user.last_name}".strip() or obj.employee.user.username
    
    def get_generated_by_name(self, obj):
        if obj.generated_by:
            return f"{obj.generated_by.first_name} {obj.generated_by.last_name}".strip() or obj.generated_by.username
        return None


class SkillRequirementSerializer(serializers.ModelSerializer):
    skill_name = serializers.CharField(source='skill.name', read_only=True)
    
    class Meta:
        model = SkillRequirement
        fields = ['id', 'skill', 'skill_name', 'required_level', 'is_mandatory', 'weight']
        read_only_fields = ['id']


class SkillAuditLogSerializer(serializers.ModelSerializer):
    employee_skill_name = serializers.SerializerMethodField()
    changed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = SkillAuditLog
        fields = ['id', 'employee_skill', 'employee_skill_name', 'action', 'old_value',
                  'new_value', 'changed_by', 'changed_by_name', 'reason', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def get_employee_skill_name(self, obj):
        return f"{obj.employee_skill.employee.user.username} - {obj.employee_skill.skill.name}"
    
    def get_changed_by_name(self, obj):
        if obj.changed_by:
            return f"{obj.changed_by.first_name} {obj.changed_by.last_name}".strip() or obj.changed_by.username
        return None


class SkillMatrixSerializer(serializers.Serializer):
    """Serializer for skill matrix dashboard data"""
    skills_by_category = serializers.DictField()
    skill_coverage = serializers.ListField()
    certification_expiry_alerts = serializers.ListField()
    skill_gap_analysis = serializers.ListField()


class TechnicianSkillMatchSerializer(serializers.Serializer):
    """Serializer for technician skill matching"""
    profile_id = serializers.IntegerField()
    employee_name = serializers.CharField()
    match_score = serializers.FloatField()
    matching_skills = serializers.ListField()
    missing_skills = serializers.ListField()
    is_available = serializers.BooleanField()
    current_workload = serializers.IntegerField()


class ConfigOptionSerializer(serializers.ModelSerializer):
    category_code = serializers.CharField(source='category.code', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = ConfigOption
        fields = ['id', 'category', 'category_code', 'category_name', 'code', 'label', 
                  'description', 'color', 'icon', 'metadata', 'display_order', 
                  'is_default', 'is_system', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConfigCategorySerializer(serializers.ModelSerializer):
    options = ConfigOptionSerializer(many=True, read_only=True)
    options_count = serializers.IntegerField(source='options.count', read_only=True)
    
    class Meta:
        model = ConfigCategory
        fields = ['id', 'code', 'name', 'description', 'module', 'display_order',
                  'is_system', 'is_active', 'created_at', 'updated_at', 'options', 'options_count']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConfigCategoryListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing categories without options"""
    options_count = serializers.IntegerField(source='options.count', read_only=True)
    
    class Meta:
        model = ConfigCategory
        fields = ['id', 'code', 'name', 'description', 'module', 'display_order',
                  'is_system', 'is_active', 'options_count']


class SystemConfigSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)
    
    class Meta:
        model = SystemConfig
        fields = ['id', 'key', 'value', 'value_type', 'module', 'category', 'branch', 'branch_name',
                  'description', 'is_sensitive', 'is_branch_overridable', 'is_active', 'version',
                  'created_by', 'created_by_name', 'updated_by', 'updated_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'version', 'created_at', 'updated_at']


class SystemConfigHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source='changed_by.username', read_only=True)
    
    class Meta:
        model = SystemConfigHistory
        fields = ['id', 'config', 'old_value', 'new_value', 'version', 'changed_by', 'changed_by_name', 'change_reason', 'changed_at']
        read_only_fields = ['id', 'changed_at']


class WorkflowConfigSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = WorkflowConfig
        fields = ['id', 'code', 'name', 'workflow_type', 'description', 'stages', 'transitions',
                  'stage_permissions', 'mandatory_fields', 'sla_config', 'branch', 'branch_name',
                  'is_active', 'version', 'created_by', 'created_by_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'version', 'created_at', 'updated_at']


class ApprovalRuleSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    escalation_to_name = serializers.CharField(source='escalation_to.username', read_only=True)
    
    class Meta:
        model = ApprovalRule
        fields = ['id', 'code', 'name', 'module', 'entity_type', 'approval_type', 'levels', 'conditions',
                  'auto_approve_threshold', 'escalation_hours', 'escalation_to', 'escalation_to_name',
                  'branch', 'branch_name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class NotificationTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationTemplate
        fields = ['id', 'code', 'name', 'channel', 'subject', 'body', 'variables', 'language', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class NotificationRuleSerializer(serializers.ModelSerializer):
    template_name = serializers.CharField(source='template.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = NotificationRule
        fields = ['id', 'code', 'name', 'event_type', 'module', 'template', 'template_name',
                  'recipient_roles', 'conditions', 'delay_minutes', 'is_escalation',
                  'branch', 'branch_name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class AutomationRuleSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = AutomationRule
        fields = ['id', 'code', 'name', 'description', 'module', 'trigger_type', 'trigger_event',
                  'trigger_schedule', 'conditions', 'action_type', 'action_config', 'priority',
                  'branch', 'branch_name', 'is_active', 'last_triggered', 'trigger_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'last_triggered', 'trigger_count', 'created_at', 'updated_at']


class DelegationRuleSerializer(serializers.ModelSerializer):
    delegator_name = serializers.CharField(source='delegator.username', read_only=True)
    delegate_name = serializers.CharField(source='delegate.username', read_only=True)
    approved_by_name = serializers.CharField(source='approved_by.username', read_only=True)
    
    class Meta:
        model = DelegationRule
        fields = ['id', 'delegator', 'delegator_name', 'delegate', 'delegate_name', 'roles', 'permissions',
                  'start_date', 'end_date', 'reason', 'is_active', 'approved_by', 'approved_by_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class BranchHolidayCalendarSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = BranchHolidayCalendar
        fields = ['id', 'name', 'date', 'holiday_type', 'branch', 'branch_name', 'is_half_day', 'description', 'year', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class OperatingHoursSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = OperatingHours
        fields = ['id', 'branch', 'branch_name', 'day', 'is_open', 'open_time', 'close_time', 'break_start', 'break_end', 'is_active']
        read_only_fields = ['id']


class SLAConfigSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = SLAConfig
        fields = ['id', 'code', 'name', 'module', 'entity_type', 'priority', 'response_hours', 'resolution_hours',
                  'escalation_levels', 'penalty_config', 'branch', 'branch_name', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConfigAuditLogSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.CharField(source='performed_by.username', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    
    class Meta:
        model = ConfigAuditLog
        fields = ['id', 'entity_type', 'entity_id', 'entity_name', 'action', 'old_values', 'new_values',
                  'change_summary', 'performed_by', 'performed_by_name', 'ip_address', 'user_agent',
                  'branch', 'branch_name', 'created_at']
        read_only_fields = ['id', 'created_at']


class MenuConfigSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(source='parent.name', read_only=True)
    children = serializers.SerializerMethodField()
    
    class Meta:
        model = MenuConfig
        fields = ['id', 'code', 'name', 'module', 'icon', 'path', 'parent', 'parent_name',
                  'display_order', 'required_roles', 'is_visible', 'is_active', 'children', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_children(self, obj):
        children = obj.children.filter(is_active=True).order_by('display_order')
        return MenuConfigSerializer(children, many=True).data


class FeatureFlagSerializer(serializers.ModelSerializer):
    enabled_branch_names = serializers.SerializerMethodField()
    
    class Meta:
        model = FeatureFlag
        fields = ['id', 'code', 'name', 'description', 'is_enabled', 'enabled_roles', 'enabled_branches',
                  'enabled_branch_names', 'rollout_percentage', 'start_date', 'end_date', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_enabled_branch_names(self, obj):
        return [b.name for b in obj.enabled_branches.all()]


class AdminDashboardSerializer(serializers.Serializer):
    """Serializer for admin dashboard overview"""
    total_configs = serializers.IntegerField()
    total_workflows = serializers.IntegerField()
    total_approval_rules = serializers.IntegerField()
    total_automation_rules = serializers.IntegerField()
    total_notification_rules = serializers.IntegerField()
    active_feature_flags = serializers.IntegerField()
    pending_delegations = serializers.IntegerField()
    recent_config_changes = serializers.ListField()
    system_health = serializers.DictField()


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = ['id', 'code', 'name', 'symbol', 'decimal_places', 'exchange_rate', 
                  'is_base_currency', 'is_active', 'display_order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class LanguageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Language
        fields = ['id', 'code', 'name', 'native_name', 'direction', 'is_default', 
                  'is_active', 'display_order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class SystemPreferenceSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.CharField(source='updated_by.username', read_only=True)
    
    class Meta:
        model = SystemPreference
        fields = ['id', 'key', 'preference_type', 'value', 'description', 
                  'updated_by', 'updated_by_name', 'updated_at']
        read_only_fields = ['id', 'updated_at']


class Customer360OverviewSerializer(serializers.ModelSerializer):
    vehicles_count = serializers.SerializerMethodField()
    active_contracts_count = serializers.SerializerMethodField()
    open_job_cards_count = serializers.SerializerMethodField()
    pending_invoices_count = serializers.SerializerMethodField()
    total_service_visits = serializers.SerializerMethodField()
    last_service_date = serializers.SerializerMethodField()
    preferred_branch_name = serializers.CharField(source='preferred_branch.name', read_only=True, allow_null=True)
    
    class Meta:
        model = Customer
        fields = ['id', 'customer_id', 'name', 'phone', 'email', 'alternate_phone', 'alternate_email',
                  'address', 'city', 'state', 'pincode', 'gst_number', 'pan_number',
                  'customer_type', 'customer_category', 'preferred_channel', 'preferred_branch',
                  'preferred_branch_name', 'loyalty_points', 'credit_limit', 'outstanding_balance',
                  'total_revenue', 'total_visits', 'last_visit_date', 'date_of_birth', 'anniversary_date',
                  'notes', 'tags', 'do_not_contact', 'is_active', 'created_at', 'updated_at',
                  'vehicles_count', 'active_contracts_count', 'open_job_cards_count',
                  'pending_invoices_count', 'total_service_visits', 'last_service_date']
    
    def get_vehicles_count(self, obj):
        return obj.vehicles.count()
    
    def get_active_contracts_count(self, obj):
        from django.utils import timezone
        return obj.contracts.filter(status='ACTIVE', end_date__gte=timezone.now().date()).count()
    
    def get_open_job_cards_count(self, obj):
        return obj.job_cards.exclude(workflow_stage='COMPLETED').count()
    
    def get_pending_invoices_count(self, obj):
        return Invoice.objects.filter(customer=obj, payment_status__in=['UNPAID', 'PARTIAL']).count()
    
    def get_total_service_visits(self, obj):
        return obj.job_cards.filter(workflow_stage='COMPLETED').count()
    
    def get_last_service_date(self, obj):
        last_job = obj.job_cards.filter(workflow_stage='COMPLETED').order_by('-actual_delivery').first()
        return last_job.actual_delivery if last_job else None


class VehicleWithServiceHistorySerializer(serializers.ModelSerializer):
    service_count = serializers.SerializerMethodField()
    last_service_date = serializers.SerializerMethodField()
    last_odometer = serializers.SerializerMethodField()
    active_contract = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    
    class Meta:
        model = Vehicle
        fields = ['id', 'vehicle_id', 'vin', 'plate_number', 'make', 'model', 'variant', 
                  'year', 'color', 'vehicle_type', 'fuel_type', 'transmission', 'current_odometer',
                  'insurance_expiry', 'warranty_expiry', 'amc_expiry', 'created_at',
                  'service_count', 'last_service_date', 'last_odometer', 'active_contract', 'status']
    
    def get_service_count(self, obj):
        return obj.job_cards.filter(workflow_stage='COMPLETED').count()
    
    def get_last_service_date(self, obj):
        last_job = obj.job_cards.filter(workflow_stage='COMPLETED').order_by('-actual_delivery').first()
        return last_job.actual_delivery if last_job else None
    
    def get_last_odometer(self, obj):
        last_job = obj.job_cards.order_by('-created_at').first()
        return last_job.odometer_in if last_job else obj.current_odometer
    
    def get_active_contract(self, obj):
        from django.utils import timezone
        contract = Contract.objects.filter(
            contract_vehicles__vehicle=obj,
            status='ACTIVE',
            end_date__gte=timezone.now().date()
        ).first()
        if contract:
            return {
                'id': contract.id,
                'contract_number': contract.contract_number,
                'contract_type': contract.contract_type,
                'end_date': contract.end_date,
                'services_remaining': contract.services_remaining
            }
        return None
    
    def get_status(self, obj):
        return 'ACTIVE'


class ServiceHistorySerializer(serializers.ModelSerializer):
    vehicle_info = serializers.SerializerMethodField()
    advisor_name = serializers.SerializerMethodField()
    technicians = serializers.SerializerMethodField()
    service_duration_hours = serializers.SerializerMethodField()
    is_rework = serializers.SerializerMethodField()
    sla_status = serializers.SerializerMethodField()
    invoice_info = serializers.SerializerMethodField()
    contract_info = serializers.SerializerMethodField()
    
    class Meta:
        model = JobCard
        fields = ['id', 'job_card_number', 'service_tracking_id', 'vehicle', 'vehicle_info',
                  'workflow_stage', 'job_type', 'priority', 'complaint', 'diagnosis',
                  'odometer_in', 'odometer_out', 'estimated_hours', 'actual_hours',
                  'estimated_amount', 'actual_amount', 'is_warranty', 'is_amc', 'is_insurance',
                  'is_goodwill', 'promised_delivery', 'sla_deadline', 'actual_delivery',
                  'customer_rating', 'created_at', 'updated_at', 'advisor_name', 'technicians',
                  'service_duration_hours', 'is_rework', 'sla_status', 'invoice_info', 'contract_info']
    
    def get_vehicle_info(self, obj):
        return f"{obj.vehicle.year or ''} {obj.vehicle.make} {obj.vehicle.model} - {obj.vehicle.plate_number}"
    
    def get_advisor_name(self, obj):
        if obj.service_advisor:
            return f"{obj.service_advisor.first_name} {obj.service_advisor.last_name}".strip() or obj.service_advisor.username
        return None
    
    def get_technicians(self, obj):
        tasks = obj.tasks.all()
        technicians = set()
        for task in tasks:
            if task.assigned_to:
                name = f"{task.assigned_to.first_name} {task.assigned_to.last_name}".strip() or task.assigned_to.username
                technicians.add(name)
        return list(technicians)
    
    def get_service_duration_hours(self, obj):
        return float(obj.actual_hours) if obj.actual_hours else None
    
    def get_is_rework(self, obj):
        return obj.events.filter(event_type='REWORK').exists() if hasattr(obj, 'events') else False
    
    def get_sla_status(self, obj):
        from django.utils import timezone
        if obj.workflow_stage == 'COMPLETED':
            if obj.sla_deadline and obj.actual_delivery:
                return 'MET' if obj.actual_delivery <= obj.sla_deadline else 'BREACHED'
            return 'N/A'
        elif obj.sla_deadline:
            return 'AT_RISK' if timezone.now() > obj.sla_deadline else 'ON_TRACK'
        return 'N/A'
    
    def get_invoice_info(self, obj):
        invoice = Invoice.objects.filter(job_card=obj).first()
        if invoice:
            return {
                'id': invoice.id,
                'invoice_number': invoice.invoice_number,
                'grand_total': float(invoice.grand_total),
                'payment_status': invoice.payment_status
            }
        return None
    
    def get_contract_info(self, obj):
        if obj.is_warranty or obj.is_amc:
            contract = Contract.objects.filter(
                customer=obj.customer,
                contract_vehicles__vehicle=obj.vehicle,
                status='ACTIVE'
            ).first()
            if contract:
                return {
                    'id': contract.id,
                    'contract_number': contract.contract_number,
                    'contract_type': contract.contract_type
                }
        return None


class CustomerInvoiceSummarySerializer(serializers.ModelSerializer):
    job_card_number = serializers.CharField(source='job_card.job_card_number', read_only=True)
    vehicle_info = serializers.SerializerMethodField()
    contract_covered = serializers.SerializerMethodField()
    contract_type = serializers.SerializerMethodField()
    
    class Meta:
        model = Invoice
        fields = ['id', 'invoice_number', 'job_card', 'job_card_number', 'vehicle_info',
                  'labor_total', 'parts_total', 'consumables_total', 'subtotal',
                  'discount', 'tax', 'grand_total', 'amount_paid', 'balance_due',
                  'payment_status', 'invoice_date', 'due_date', 'contract_covered', 'contract_type']
    
    def get_vehicle_info(self, obj):
        if obj.job_card and obj.job_card.vehicle:
            v = obj.job_card.vehicle
            return f"{v.year or ''} {v.make} {v.model} - {v.plate_number}"
        return None
    
    def get_contract_covered(self, obj):
        if obj.job_card:
            return obj.job_card.is_warranty or obj.job_card.is_amc
        return False
    
    def get_contract_type(self, obj):
        if obj.job_card:
            if obj.job_card.is_warranty:
                return 'WARRANTY'
            elif obj.job_card.is_amc:
                return 'AMC'
        return None


class CustomerContractSummarySerializer(serializers.ModelSerializer):
    vehicles = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()
    services_remaining = serializers.SerializerMethodField()
    utilization_percent = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = Contract
        fields = ['id', 'contract_number', 'contract_type', 'status', 'provider',
                  'start_date', 'end_date', 'contract_value', 'max_services', 'services_used',
                  'labor_coverage_percent', 'consumables_included', 'services_included',
                  'parts_coverage', 'is_active', 'is_expired', 'days_remaining',
                  'services_remaining', 'utilization_percent', 'vehicles', 'created_at']
    
    def get_vehicles(self, obj):
        return [{
            'id': cv.vehicle.id,
            'plate_number': cv.vehicle.plate_number,
            'make': cv.vehicle.make,
            'model': cv.vehicle.model
        } for cv in obj.contract_vehicles.all()]
    
    def get_days_remaining(self, obj):
        from django.utils import timezone
        if obj.end_date and obj.end_date >= timezone.now().date():
            return (obj.end_date - timezone.now().date()).days
        return None
    
    def get_services_remaining(self, obj):
        if obj.max_services:
            return max(0, obj.max_services - (obj.services_used or 0))
        return None
    
    def get_utilization_percent(self, obj):
        if obj.max_services and obj.max_services > 0:
            return round(((obj.services_used or 0) / obj.max_services) * 100, 1)
        return None
    
    def get_is_active(self, obj):
        from django.utils import timezone
        return obj.status == 'ACTIVE' and obj.end_date >= timezone.now().date()
    
    def get_is_expired(self, obj):
        from django.utils import timezone
        return obj.status == 'EXPIRED' or (obj.end_date and obj.end_date < timezone.now().date())


class CommunicationLogSerializer(serializers.ModelSerializer):
    handled_by_name = serializers.SerializerMethodField()
    initiated_by_name = serializers.SerializerMethodField()
    related_job_card = serializers.CharField(source='job_card.job_card_number', read_only=True, allow_null=True)
    delivery_status = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomerInteraction
        fields = ['id', 'interaction_id', 'interaction_type', 'channel', 'direction',
                  'subject', 'description', 'outcome', 'sentiment', 'duration_minutes',
                  'next_action', 'next_action_date', 'initiated_by', 'initiated_by_name',
                  'handled_by', 'handled_by_name', 'related_job_card', 'delivery_status',
                  'is_private', 'created_at']
    
    def get_handled_by_name(self, obj):
        if obj.handled_by:
            return f"{obj.handled_by.first_name} {obj.handled_by.last_name}".strip() or obj.handled_by.username
        return None
    
    def get_initiated_by_name(self, obj):
        if obj.initiated_by:
            return f"{obj.initiated_by.first_name} {obj.initiated_by.last_name}".strip() or obj.initiated_by.username
        return None
    
    def get_delivery_status(self, obj):
        metadata = obj.metadata or {}
        return metadata.get('delivery_status', 'SENT')


class ContractEligibilitySerializer(serializers.Serializer):
    has_active_contract = serializers.BooleanField()
    contract_id = serializers.IntegerField(allow_null=True)
    contract_number = serializers.CharField(allow_null=True)
    contract_type = serializers.CharField(allow_null=True)
    contract_status = serializers.CharField(allow_null=True)
    validity_start = serializers.DateField(allow_null=True)
    validity_end = serializers.DateField(allow_null=True)
    days_remaining = serializers.IntegerField(allow_null=True)
    services_remaining = serializers.IntegerField(allow_null=True)
    labor_coverage_percent = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)
    parts_coverage = serializers.DictField(allow_null=True)
    covered_service_types = serializers.ListField(child=serializers.CharField(), allow_null=True)
    consumables_included = serializers.BooleanField(allow_null=True)
    is_eligible_for_free_service = serializers.BooleanField()
    eligibility_message = serializers.CharField()
