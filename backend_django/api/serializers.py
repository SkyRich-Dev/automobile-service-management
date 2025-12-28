from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Profile, Branch, Customer, Vehicle, Part, JobCard, Task, 
    ServiceEvent, Estimate, EstimateLine, PartIssue, Invoice, Payment,
    DigitalInspection, Bay, TechnicianMetrics, TimelineEvent,
    WorkflowStage, UserRole, WORKFLOW_TRANSITIONS,
    Notification, Contract, Supplier, PurchaseOrder, PurchaseOrderLine,
    TechnicianSchedule, Appointment, AnalyticsSnapshot
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
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
    class Meta:
        model = Customer
        fields = ['id', 'customer_id', 'name', 'phone', 'email', 'alternate_phone', 'address', 'city', 
                  'customer_type', 'loyalty_points', 'credit_limit', 'outstanding_balance', 'notes', 
                  'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'customer_id', 'created_at', 'updated_at']


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
    
    class Meta:
        model = Part
        fields = ['id', 'part_number', 'name', 'sku', 'category', 'subcategory', 'brand', 'is_oem',
                  'cost_price', 'price', 'mrp', 'stock', 'min_stock', 'max_stock', 'reserved', 
                  'location', 'available_stock', 'is_low_stock', 'is_active']
        read_only_fields = ['id', 'part_number']


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


class ContractSerializer(serializers.ModelSerializer):
    vehicle_info = serializers.SerializerMethodField()
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    days_remaining = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Contract
        fields = ['id', 'contract_number', 'vehicle', 'vehicle_info', 'customer', 'customer_name',
                  'contract_type', 'provider', 'policy_number', 'start_date', 'end_date',
                  'coverage_amount', 'deductible', 'premium', 'services_included', 'services_used',
                  'max_services', 'terms_conditions', 'is_active', 'is_expired', 'days_remaining',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'contract_number', 'created_at', 'updated_at']
    
    def get_vehicle_info(self, obj):
        return f"{obj.vehicle.year or ''} {obj.vehicle.make} {obj.vehicle.model} - {obj.vehicle.plate_number}"


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


class PurchaseOrderSerializer(serializers.ModelSerializer):
    lines = PurchaseOrderLineSerializer(many=True, read_only=True)
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    branch_name = serializers.CharField(source='branch.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PurchaseOrder
        fields = ['id', 'po_number', 'branch', 'branch_name', 'supplier', 'supplier_name',
                  'status', 'order_date', 'expected_delivery', 'actual_delivery', 'subtotal',
                  'tax', 'shipping', 'grand_total', 'notes', 'created_by', 'created_by_name',
                  'approved_by', 'created_at', 'updated_at', 'lines']
        read_only_fields = ['id', 'po_number', 'created_at', 'updated_at']
    
    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.username
        return None


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
