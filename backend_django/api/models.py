from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
import uuid


class UserRole(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Admin'
    CEO_OWNER = 'CEO_OWNER', 'CEO / Owner'
    REGIONAL_MANAGER = 'REGIONAL_MANAGER', 'Regional Manager'
    BRANCH_MANAGER = 'BRANCH_MANAGER', 'Branch Manager'
    SERVICE_MANAGER = 'SERVICE_MANAGER', 'Service Manager'
    SALES_MANAGER = 'SALES_MANAGER', 'Sales Manager'
    ACCOUNTS_MANAGER = 'ACCOUNTS_MANAGER', 'Accounts Manager'
    SUPERVISOR = 'SUPERVISOR', 'Supervisor'
    SERVICE_ADVISOR = 'SERVICE_ADVISOR', 'Service Advisor'
    SERVICE_ENGINEER = 'SERVICE_ENGINEER', 'Service Engineer'
    SALES_EXECUTIVE = 'SALES_EXECUTIVE', 'Sales Executive'
    ACCOUNTANT = 'ACCOUNTANT', 'Accountant'
    INVENTORY_MANAGER = 'INVENTORY_MANAGER', 'Inventory Manager'
    HR_MANAGER = 'HR_MANAGER', 'HR Manager'
    TECHNICIAN = 'TECHNICIAN', 'Technician / Mechanic'
    CRM_EXECUTIVE = 'CRM_EXECUTIVE', 'CRM Executive'
    CUSTOMER = 'CUSTOMER', 'Customer'


class WorkflowStage(models.TextChoices):
    APPOINTMENT = 'APPOINTMENT', 'Appointment'
    CHECK_IN = 'CHECK_IN', 'Check-in'
    INSPECTION = 'INSPECTION', 'Digital Inspection'
    JOB_CARD = 'JOB_CARD', 'Job Card Created'
    ESTIMATE = 'ESTIMATE', 'Estimate Prepared'
    APPROVAL = 'APPROVAL', 'Customer Approval'
    EXECUTION = 'EXECUTION', 'Task Execution'
    QC = 'QC', 'Quality Check'
    BILLING = 'BILLING', 'Billing'
    DELIVERY = 'DELIVERY', 'Delivery'
    COMPLETED = 'COMPLETED', 'Service Completed'


WORKFLOW_TRANSITIONS = {
    WorkflowStage.APPOINTMENT: [WorkflowStage.CHECK_IN],
    WorkflowStage.CHECK_IN: [WorkflowStage.INSPECTION],
    WorkflowStage.INSPECTION: [WorkflowStage.JOB_CARD],
    WorkflowStage.JOB_CARD: [WorkflowStage.ESTIMATE],
    WorkflowStage.ESTIMATE: [WorkflowStage.APPROVAL],
    WorkflowStage.APPROVAL: [WorkflowStage.EXECUTION, WorkflowStage.ESTIMATE],
    WorkflowStage.EXECUTION: [WorkflowStage.QC],
    WorkflowStage.QC: [WorkflowStage.BILLING, WorkflowStage.EXECUTION],
    WorkflowStage.BILLING: [WorkflowStage.DELIVERY],
    WorkflowStage.DELIVERY: [WorkflowStage.COMPLETED],
    WorkflowStage.COMPLETED: [],
}


class TaskStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    ASSIGNED = 'ASSIGNED', 'Assigned'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    PAUSED = 'PAUSED', 'Paused'
    COMPLETED = 'COMPLETED', 'Completed'
    QC_PASSED = 'QC_PASSED', 'QC Passed'
    QC_FAILED = 'QC_FAILED', 'QC Failed'
    REJECTED = 'REJECTED', 'Rejected'


class ApprovalStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'
    REVISION_REQUESTED = 'REVISION_REQUESTED', 'Revision Requested'


class Branch(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    address = models.TextField()
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    country = models.CharField(max_length=100, default='India')
    parent_branch = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='sub_branches')
    is_active = models.BooleanField(default=True)
    is_headquarters = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        verbose_name_plural = "Branches"

    def __str__(self):
        return f"{self.code} - {self.name}"


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=30, choices=UserRole.choices, default=UserRole.CUSTOMER)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='employees')
    employee_id = models.CharField(max_length=50, blank=True, null=True, unique=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    avatar = models.URLField(blank=True, null=True)
    skills = models.JSONField(default=list, blank=True)
    certifications = models.JSONField(default=list, blank=True)
    is_available = models.BooleanField(default=True)
    hourly_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


class TechnicianMetrics(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name='metrics')
    total_jobs_completed = models.IntegerField(default=0)
    total_productive_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_idle_hours = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    rework_count = models.IntegerField(default=0)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Metrics for {self.profile.user.username}"

    @property
    def utilization_percentage(self):
        total = float(self.total_productive_hours + self.total_idle_hours)
        if total == 0:
            return 0
        return round((float(self.total_productive_hours) / total) * 100, 2)


class CustomerCategory(models.TextChoices):
    RETAIL = 'RETAIL', 'Retail'
    FLEET = 'FLEET', 'Fleet'
    VIP = 'VIP', 'VIP'
    CORPORATE = 'CORPORATE', 'Corporate'
    WALK_IN = 'WALK_IN', 'Walk-in'


class CommunicationChannel(models.TextChoices):
    PHONE = 'PHONE', 'Phone'
    EMAIL = 'EMAIL', 'Email'
    WHATSAPP = 'WHATSAPP', 'WhatsApp'
    SMS = 'SMS', 'SMS'
    IN_APP = 'IN_APP', 'In-App'


class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='customer_profile')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers')
    preferred_branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='preferred_customers')
    customer_id = models.CharField(max_length=50, unique=True, blank=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    alternate_phone = models.CharField(max_length=20, blank=True, null=True)
    alternate_email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    pincode = models.CharField(max_length=10, blank=True, null=True)
    gst_number = models.CharField(max_length=50, blank=True, null=True)
    pan_number = models.CharField(max_length=20, blank=True, null=True)
    customer_type = models.CharField(max_length=50, default='Individual')
    customer_category = models.CharField(max_length=20, choices=CustomerCategory.choices, default=CustomerCategory.RETAIL)
    preferred_channel = models.CharField(max_length=20, choices=CommunicationChannel.choices, default=CommunicationChannel.PHONE)
    loyalty_points = models.IntegerField(default=0)
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_revenue = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_visits = models.IntegerField(default=0)
    last_visit_date = models.DateField(null=True, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    anniversary_date = models.DateField(null=True, blank=True)
    referral_source = models.CharField(max_length=100, blank=True, null=True)
    referred_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='referrals')
    notes = models.TextField(blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    do_not_contact = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.customer_id:
            self.customer_id = f"CUST-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.customer_id} - {self.name}"


class Vehicle(models.Model):
    class VehicleType(models.TextChoices):
        CAR = 'CAR', 'Car'
        BIKE = 'BIKE', 'Bike'
        TRUCK = 'TRUCK', 'Truck'
        BUS = 'BUS', 'Bus'
        OTHER = 'OTHER', 'Other'

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='vehicles')
    vehicle_id = models.CharField(max_length=50, unique=True, blank=True)
    vin = models.CharField(max_length=100, unique=True)
    plate_number = models.CharField(max_length=20)
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    variant = models.CharField(max_length=100, blank=True, null=True)
    year = models.IntegerField(blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)
    engine_number = models.CharField(max_length=100, blank=True, null=True)
    fuel_type = models.CharField(max_length=50, blank=True, null=True)
    transmission = models.CharField(max_length=50, blank=True, null=True)
    vehicle_type = models.CharField(max_length=20, choices=VehicleType.choices, default=VehicleType.CAR)
    current_odometer = models.IntegerField(default=0)
    insurance_expiry = models.DateField(null=True, blank=True)
    puc_expiry = models.DateField(null=True, blank=True)
    warranty_expiry = models.DateField(null=True, blank=True)
    amc_expiry = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def save(self, *args, **kwargs):
        if not self.vehicle_id:
            self.vehicle_id = f"VEH-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.year} {self.make} {self.model} - {self.plate_number}"


class Bay(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='bays')
    bay_number = models.CharField(max_length=20)
    bay_type = models.CharField(max_length=50)
    is_available = models.BooleanField(default=True)
    current_job = models.ForeignKey('JobCard', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_bay')

    class Meta:
        unique_together = ['branch', 'bay_number']

    def __str__(self):
        return f"{self.branch.code} - Bay {self.bay_number}"


class JobCard(models.Model):
    job_card_number = models.CharField(max_length=50, unique=True, blank=True)
    service_tracking_id = models.CharField(max_length=50, unique=True, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='job_cards', null=True, blank=True)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='job_cards')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='job_cards')
    service_advisor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='advised_jobs')
    lead_technician = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='lead_jobs')
    bay = models.ForeignKey(Bay, on_delete=models.SET_NULL, null=True, blank=True, related_name='jobs')
    workflow_stage = models.CharField(max_length=20, choices=WorkflowStage.choices, default=WorkflowStage.APPOINTMENT)
    job_type = models.CharField(max_length=50, default='General Service')
    priority = models.CharField(max_length=20, default='Normal')
    complaint = models.TextField(blank=True, null=True)
    diagnosis = models.TextField(blank=True, null=True)
    odometer_in = models.IntegerField(default=0)
    odometer_out = models.IntegerField(null=True, blank=True)
    fuel_level_in = models.CharField(max_length=20, blank=True, null=True)
    fuel_level_out = models.CharField(max_length=20, blank=True, null=True)
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    actual_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    labor_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    parts_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    estimated_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    actual_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_warranty = models.BooleanField(default=False)
    is_amc = models.BooleanField(default=False)
    is_insurance = models.BooleanField(default=False)
    is_goodwill = models.BooleanField(default=False)
    goodwill_reason = models.TextField(blank=True, null=True)
    promised_delivery = models.DateTimeField(null=True, blank=True)
    sla_deadline = models.DateTimeField(null=True, blank=True)
    actual_delivery = models.DateTimeField(null=True, blank=True)
    ai_summary = models.TextField(blank=True, null=True)
    customer_feedback = models.TextField(blank=True, null=True)
    customer_rating = models.IntegerField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_jobs')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.job_card_number:
            self.job_card_number = f"JC-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        if not self.service_tracking_id:
            self.service_tracking_id = f"ST-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)

    def can_transition_to(self, new_stage):
        allowed = WORKFLOW_TRANSITIONS.get(self.workflow_stage, [])
        return new_stage in allowed

    def transition_to(self, new_stage, actor, comment=None):
        if not self.can_transition_to(new_stage):
            raise ValidationError(f"Cannot transition from {self.workflow_stage} to {new_stage}")
        old_stage = self.workflow_stage
        self.workflow_stage = new_stage
        self.save()
        ServiceEvent.objects.create(
            job_card=self,
            event_type=ServiceEventType.WORKFLOW_TRANSITION,
            actor=actor,
            old_value=old_stage,
            new_value=new_stage,
            comment=comment
        )
        return self

    def __str__(self):
        return f"{self.job_card_number} - {self.vehicle}"


class DigitalInspection(models.Model):
    job_card = models.OneToOneField(JobCard, on_delete=models.CASCADE, related_name='inspection')
    inspector = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    inspection_date = models.DateTimeField(auto_now_add=True, null=True)
    checklist_data = models.JSONField(default=dict)
    findings = models.TextField(blank=True)
    recommendations = models.TextField(blank=True)
    photos = models.JSONField(default=list)
    videos = models.JSONField(default=list)
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"Inspection for {self.job_card.job_card_number}"


class Estimate(models.Model):
    job_card = models.ForeignKey(JobCard, on_delete=models.CASCADE, related_name='estimates')
    version = models.IntegerField(default=1)
    estimate_number = models.CharField(max_length=50, unique=True, blank=True)
    labor_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    parts_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    approval_status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_estimates')
    approval_date = models.DateTimeField(null=True, blank=True)
    approval_comment = models.TextField(blank=True, null=True)
    customer_signature = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_estimates')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    is_current = models.BooleanField(default=True)

    class Meta:
        ordering = ['-version']
        unique_together = ['job_card', 'version']

    def save(self, *args, **kwargs):
        if not self.estimate_number:
            self.estimate_number = f"EST-{self.job_card.job_card_number}-V{self.version}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.estimate_number} - {self.approval_status}"


class EstimateLine(models.Model):
    class LineType(models.TextChoices):
        LABOR = 'LABOR', 'Labor'
        PART = 'PART', 'Part'
        CONSUMABLE = 'CONSUMABLE', 'Consumable'
        MISC = 'MISC', 'Miscellaneous'

    estimate = models.ForeignKey(Estimate, on_delete=models.CASCADE, related_name='lines')
    line_type = models.CharField(max_length=20, choices=LineType.choices)
    description = models.CharField(max_length=500)
    part = models.ForeignKey('Part', on_delete=models.SET_NULL, null=True, blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.description} - {self.total}"


class Task(models.Model):
    job_card = models.ForeignKey(JobCard, on_delete=models.CASCADE, related_name='tasks')
    task_number = models.CharField(max_length=50, blank=True)
    description = models.TextField()
    category = models.CharField(max_length=100, blank=True)
    assigned_technician = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tasks')
    status = models.CharField(max_length=20, choices=TaskStatus.choices, default=TaskStatus.PENDING)
    priority = models.CharField(max_length=20, default='Normal')
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    actual_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    labor_rate = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    labor_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    pause_time = models.DateTimeField(null=True, blank=True)
    total_pause_duration = models.DurationField(default=timezone.timedelta)
    checklist = models.JSONField(default=list)
    checklist_completed = models.BooleanField(default=False)
    evidence_photos = models.JSONField(default=list)
    evidence_videos = models.JSONField(default=list)
    technician_notes = models.TextField(blank=True)
    qc_passed = models.BooleanField(null=True, blank=True)
    qc_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='qc_tasks')
    qc_date = models.DateTimeField(null=True, blank=True)
    qc_notes = models.TextField(blank=True)
    is_rework = models.BooleanField(default=False)
    rework_reason = models.TextField(blank=True)
    original_task = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='rework_tasks')
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def save(self, *args, **kwargs):
        if not self.task_number:
            self.task_number = f"TASK-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def start(self, technician):
        if self.status != TaskStatus.PENDING and self.status != TaskStatus.ASSIGNED:
            raise ValidationError("Task cannot be started from current status")
        self.start_time = timezone.now()
        self.status = TaskStatus.IN_PROGRESS
        self.assigned_technician = technician
        self.save()

    def complete(self):
        if self.status != TaskStatus.IN_PROGRESS:
            raise ValidationError("Task must be in progress to complete")
        if not self.checklist_completed:
            raise ValidationError("Checklist must be completed before completing task")
        if not self.evidence_photos:
            raise ValidationError("Evidence must be uploaded before completing task")
        self.end_time = timezone.now()
        self.status = TaskStatus.COMPLETED
        if self.start_time:
            duration = self.end_time - self.start_time - self.total_pause_duration
            self.actual_hours = round(duration.total_seconds() / 3600, 2)
        self.save()

    def __str__(self):
        return f"{self.task_number} - {self.description[:50]}"


class ItemType(models.TextChoices):
    SPARE_PART = 'SPARE_PART', 'Spare Part'
    CONSUMABLE = 'CONSUMABLE', 'Consumable'
    LUBRICANT = 'LUBRICANT', 'Lubricant'
    ACCESSORY = 'ACCESSORY', 'Accessory'
    TOOL = 'TOOL', 'Tool'
    SERVICE_KIT = 'SERVICE_KIT', 'Service Kit'


class TaxCategory(models.TextChoices):
    GST_5 = 'GST_5', 'GST 5%'
    GST_12 = 'GST_12', 'GST 12%'
    GST_18 = 'GST_18', 'GST 18%'
    GST_28 = 'GST_28', 'GST 28%'
    EXEMPT = 'EXEMPT', 'Exempt'


class ValuationMethod(models.TextChoices):
    FIFO = 'FIFO', 'First In First Out'
    LIFO = 'LIFO', 'Last In First Out'
    AVERAGE = 'AVERAGE', 'Weighted Average'


class Part(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='parts', null=True, blank=True)
    part_number = models.CharField(max_length=100, unique=True, blank=True, null=True)
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100)
    subcategory = models.CharField(max_length=100, blank=True)
    brand = models.CharField(max_length=100, blank=True)
    item_type = models.CharField(max_length=20, choices=ItemType.choices, default=ItemType.SPARE_PART)
    is_oem = models.BooleanField(default=True)
    unit = models.CharField(max_length=50, default='Nos')
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    mrp = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    tax_category = models.CharField(max_length=20, choices=TaxCategory.choices, default=TaxCategory.GST_18)
    hsn_code = models.CharField(max_length=20, blank=True)
    stock = models.IntegerField(default=0)
    min_stock = models.IntegerField(default=5)
    max_stock = models.IntegerField(default=100)
    reserved = models.IntegerField(default=0)
    reorder_quantity = models.IntegerField(default=10)
    location = models.CharField(max_length=100, blank=True, null=True)
    rack_number = models.CharField(max_length=50, blank=True)
    bin_number = models.CharField(max_length=50, blank=True)
    batch_number = models.CharField(max_length=100, blank=True, null=True)
    serial_number = models.CharField(max_length=100, blank=True, null=True)
    expiry_date = models.DateField(null=True, blank=True)
    last_purchase_date = models.DateField(null=True, blank=True)
    valuation_method = models.CharField(max_length=20, choices=ValuationMethod.choices, default=ValuationMethod.AVERAGE)
    average_cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    compatible_vehicles = models.JSONField(default=list, blank=True)
    warranty_eligible = models.BooleanField(default=False)
    warranty_period_months = models.IntegerField(default=0)
    is_returnable = models.BooleanField(default=True)
    return_period_days = models.IntegerField(default=7)
    primary_supplier = models.ForeignKey('Supplier', on_delete=models.SET_NULL, null=True, blank=True, related_name='primary_parts')
    lead_time_days = models.IntegerField(default=3)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    @property
    def available_stock(self):
        return self.stock - self.reserved

    @property
    def is_low_stock(self):
        return self.available_stock <= self.min_stock

    @property
    def price(self):
        return self.selling_price

    def __str__(self):
        return f"{self.name} ({self.sku})"


class PartIssue(models.Model):
    issue_number = models.CharField(max_length=50, unique=True, blank=True)
    job_card = models.ForeignKey(JobCard, on_delete=models.CASCADE, related_name='part_issues')
    task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True, blank=True, related_name='part_issues')
    part = models.ForeignKey(Part, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2)
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='issued_parts')
    issued_at = models.DateTimeField(auto_now_add=True, null=True)
    is_returned = models.BooleanField(default=False)
    return_quantity = models.IntegerField(default=0)
    return_reason = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.issue_number:
            self.issue_number = f"PI-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.issue_number} - {self.part.name}"


class ServiceEventType(models.TextChoices):
    WORKFLOW_TRANSITION = 'WORKFLOW_TRANSITION', 'Workflow Transition'
    STATUS_CHANGE = 'STATUS_CHANGE', 'Status Change'
    TASK_LOG = 'TASK_LOG', 'Task Log'
    ESTIMATE_CREATED = 'ESTIMATE_CREATED', 'Estimate Created'
    ESTIMATE_APPROVED = 'ESTIMATE_APPROVED', 'Estimate Approved'
    ESTIMATE_REJECTED = 'ESTIMATE_REJECTED', 'Estimate Rejected'
    PART_ISSUED = 'PART_ISSUED', 'Part Issued'
    PART_RETURNED = 'PART_RETURNED', 'Part Returned'
    QC_PASSED = 'QC_PASSED', 'QC Passed'
    QC_FAILED = 'QC_FAILED', 'QC Failed'
    PAYMENT_RECEIVED = 'PAYMENT_RECEIVED', 'Payment Received'
    INVOICE_GENERATED = 'INVOICE_GENERATED', 'Invoice Generated'
    COMMUNICATION = 'COMMUNICATION', 'Communication'
    APPROVAL = 'APPROVAL', 'Approval'
    SYSTEM = 'SYSTEM', 'System'
    AI_INSIGHT = 'AI_INSIGHT', 'AI Insight'
    REMARK_ADDED = 'REMARK_ADDED', 'Remark Added'
    CUSTOMER_NOTIFIED = 'CUSTOMER_NOTIFIED', 'Customer Notified'
    ESCALATION = 'ESCALATION', 'Escalation'


class ServiceEvent(models.Model):
    job_card = models.ForeignKey(JobCard, on_delete=models.CASCADE, related_name='timeline_events')
    event_type = models.CharField(max_length=30, choices=ServiceEventType.choices)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    actor_role = models.CharField(max_length=30, choices=UserRole.choices, null=True, blank=True)
    old_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)
    comment = models.TextField(blank=True, null=True)
    metadata = models.JSONField(default=dict)
    evidence = models.JSONField(default=list)
    timestamp = models.DateTimeField(auto_now_add=True, null=True)
    is_immutable = models.BooleanField(default=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['job_card', 'event_type']),
            models.Index(fields=['timestamp']),
        ]

    def save(self, *args, **kwargs):
        if self.pk and self.is_immutable:
            raise ValidationError("Immutable event cannot be modified")
        if self.actor:
            try:
                self.actor_role = self.actor.profile.role
            except:
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.event_type} - {self.timestamp}"


class Invoice(models.Model):
    invoice_number = models.CharField(max_length=50, unique=True, blank=True)
    job_card = models.OneToOneField(JobCard, on_delete=models.CASCADE, related_name='invoice')
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='invoices')
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='invoices')
    labor_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    parts_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    consumables_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    payment_status = models.CharField(max_length=20, default='Pending')
    invoice_date = models.DateTimeField(auto_now_add=True, null=True)
    due_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            self.invoice_number = f"INV-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        self.balance_due = self.grand_total - self.amount_paid
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} - {self.customer.name}"


class Payment(models.Model):
    class PaymentMethod(models.TextChoices):
        CASH = 'CASH', 'Cash'
        CARD = 'CARD', 'Card'
        UPI = 'UPI', 'UPI'
        BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Transfer'
        CHEQUE = 'CHEQUE', 'Cheque'
        CREDIT = 'CREDIT', 'Credit'

    payment_number = models.CharField(max_length=50, unique=True, blank=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    reference_number = models.CharField(max_length=100, blank=True)
    payment_date = models.DateTimeField(auto_now_add=True, null=True)
    received_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    notes = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.payment_number:
            self.payment_number = f"PAY-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)
        self.invoice.amount_paid += self.amount
        self.invoice.save()

    def __str__(self):
        return f"{self.payment_number} - {self.amount}"


class AuditLog(models.Model):
    class Action(models.TextChoices):
        CREATE = 'CREATE', 'Create'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'
        LOGIN = 'LOGIN', 'Login'
        LOGOUT = 'LOGOUT', 'Logout'
        APPROVE = 'APPROVE', 'Approve'
        REJECT = 'REJECT', 'Reject'
        OVERRIDE = 'OVERRIDE', 'Override'

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    user_role = models.CharField(max_length=30, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=20, choices=Action.choices)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100)
    object_repr = models.CharField(max_length=500)
    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.action} - {self.model_name} - {self.timestamp}"


class TimelineEvent(models.Model):
    job_card = models.ForeignKey(JobCard, on_delete=models.CASCADE, related_name='legacy_timeline')
    event_type = models.CharField(max_length=30, choices=ServiceEventType.choices)
    status = models.CharField(max_length=100, blank=True, null=True)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=30, choices=UserRole.choices, null=True, blank=True)
    comment = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.event_type} - {self.timestamp}"


class NotificationType(models.TextChoices):
    APPOINTMENT_REMINDER = 'APPOINTMENT_REMINDER', 'Appointment Reminder'
    SERVICE_UPDATE = 'SERVICE_UPDATE', 'Service Update'
    ESTIMATE_READY = 'ESTIMATE_READY', 'Estimate Ready'
    APPROVAL_REQUIRED = 'APPROVAL_REQUIRED', 'Approval Required'
    SERVICE_COMPLETE = 'SERVICE_COMPLETE', 'Service Complete'
    PAYMENT_RECEIVED = 'PAYMENT_RECEIVED', 'Payment Received'
    INVOICE_GENERATED = 'INVOICE_GENERATED', 'Invoice Generated'
    WARRANTY_EXPIRY = 'WARRANTY_EXPIRY', 'Warranty Expiry'
    AMC_EXPIRY = 'AMC_EXPIRY', 'AMC Expiry'
    FEEDBACK_REQUEST = 'FEEDBACK_REQUEST', 'Feedback Request'
    GENERAL = 'GENERAL', 'General'


class NotificationChannel(models.TextChoices):
    EMAIL = 'EMAIL', 'Email'
    SMS = 'SMS', 'SMS'
    PUSH = 'PUSH', 'Push Notification'
    IN_APP = 'IN_APP', 'In-App'
    WHATSAPP = 'WHATSAPP', 'WhatsApp'


class Notification(models.Model):
    notification_id = models.CharField(max_length=50, unique=True, blank=True)
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices)
    channel = models.CharField(max_length=20, choices=NotificationChannel.choices, default=NotificationChannel.IN_APP)
    title = models.CharField(max_length=255)
    message = models.TextField()
    job_card = models.ForeignKey(JobCard, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    is_read = models.BooleanField(default=False)
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.notification_id:
            self.notification_id = f"NOTIF-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.notification_type} - {self.title}"


class ContractType(models.TextChoices):
    WARRANTY = 'WARRANTY', 'Warranty'
    EXTENDED_WARRANTY = 'EXTENDED_WARRANTY', 'Extended Warranty'
    AMC = 'AMC', 'Annual Maintenance Contract'
    SERVICE_PACKAGE = 'SERVICE_PACKAGE', 'Service Package'
    INSURANCE = 'INSURANCE', 'Insurance'
    FLEET = 'FLEET', 'Fleet Service Contract'
    SUBSCRIPTION = 'SUBSCRIPTION', 'Subscription Plan'
    CORPORATE = 'CORPORATE', 'Corporate Contract'
    OEM_DEALER = 'OEM_DEALER', 'OEM/Dealer Agreement'
    CUSTOM = 'CUSTOM', 'Custom Contract'


class ContractStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
    ACTIVE = 'ACTIVE', 'Active'
    SUSPENDED = 'SUSPENDED', 'Suspended'
    EXPIRED = 'EXPIRED', 'Expired'
    TERMINATED = 'TERMINATED', 'Terminated'


class BillingModel(models.TextChoices):
    ONE_TIME = 'ONE_TIME', 'One-Time Payment'
    MONTHLY = 'MONTHLY', 'Monthly'
    QUARTERLY = 'QUARTERLY', 'Quarterly'
    HALF_YEARLY = 'HALF_YEARLY', 'Half-Yearly'
    ANNUAL = 'ANNUAL', 'Annual'


class Contract(models.Model):
    contract_number = models.CharField(max_length=50, unique=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='contracts')
    branch = models.ForeignKey('Branch', on_delete=models.CASCADE, related_name='contracts', null=True, blank=True)
    contract_type = models.CharField(max_length=30, choices=ContractType.choices)
    status = models.CharField(max_length=30, choices=ContractStatus.choices, default=ContractStatus.DRAFT)
    provider = models.CharField(max_length=255, blank=True)
    policy_number = models.CharField(max_length=100, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    coverage_period_months = models.IntegerField(default=12)
    coverage_km_limit = models.IntegerField(null=True, blank=True)
    coverage_hours_limit = models.IntegerField(null=True, blank=True)
    grace_period_days = models.IntegerField(default=7)
    contract_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    billing_model = models.CharField(max_length=20, choices=BillingModel.choices, default=BillingModel.ONE_TIME)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    deductible = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    penalty_clause = models.TextField(blank=True)
    services_included = models.JSONField(default=list)
    parts_coverage = models.JSONField(default=dict)
    labor_coverage_percent = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    consumables_included = models.BooleanField(default=False)
    max_services = models.IntegerField(null=True, blank=True)
    services_used = models.IntegerField(default=0)
    km_used = models.IntegerField(default=0)
    hours_used = models.IntegerField(default=0)
    response_time_hours = models.IntegerField(default=24)
    resolution_time_hours = models.IntegerField(default=72)
    priority_handling = models.BooleanField(default=False)
    auto_renewal = models.BooleanField(default=False)
    renewal_reminder_days = models.IntegerField(default=30)
    terms_conditions = models.TextField(blank=True)
    suspension_reason = models.TextField(blank=True)
    suspended_at = models.DateTimeField(null=True, blank=True)
    termination_reason = models.TextField(blank=True)
    terminated_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='contracts_created')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='contracts_approved')
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='contracts', null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.contract_number:
            prefix = self.contract_type[:3] if self.contract_type else 'CON'
            self.contract_number = f"{prefix}-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    @property
    def is_active(self):
        return self.status == ContractStatus.ACTIVE

    @property
    def is_expired(self):
        return self.end_date < timezone.now().date() or self.status == ContractStatus.EXPIRED

    @property
    def days_remaining(self):
        delta = self.end_date - timezone.now().date()
        return max(0, delta.days)

    @property
    def services_remaining(self):
        if self.max_services:
            return max(0, self.max_services - self.services_used)
        return None

    @property
    def km_remaining(self):
        if self.coverage_km_limit:
            return max(0, self.coverage_km_limit - self.km_used)
        return None

    @property
    def utilization_percent(self):
        if self.max_services and self.max_services > 0:
            return min(100, (self.services_used / self.max_services) * 100)
        return 0

    def __str__(self):
        return f"{self.contract_number} - {self.customer.name}"


class ContractVehicle(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='contract_vehicles')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='contract_links')
    added_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['contract', 'vehicle']

    def __str__(self):
        return f"{self.contract.contract_number} - {self.vehicle.registration_number}"


class ContractCoverageRule(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='coverage_rules')
    service_type = models.CharField(max_length=100)
    is_covered = models.BooleanField(default=True)
    coverage_percent = models.DecimalField(max_digits=5, decimal_places=2, default=100)
    max_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    visit_limit = models.IntegerField(null=True, blank=True)
    visits_used = models.IntegerField(default=0)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['contract', 'service_type']

    def __str__(self):
        return f"{self.contract.contract_number} - {self.service_type}"


class ContractConsumption(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='consumptions')
    job_card = models.ForeignKey('JobCard', on_delete=models.CASCADE, related_name='contract_consumptions')
    invoice = models.ForeignKey('Invoice', on_delete=models.SET_NULL, null=True, blank=True, related_name='contract_consumptions')
    service_date = models.DateField()
    service_type = models.CharField(max_length=100)
    parts_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    labor_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    covered_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    customer_payable = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    km_at_service = models.IntegerField(null=True, blank=True)
    hours_at_service = models.IntegerField(null=True, blank=True)
    sla_met = models.BooleanField(default=True)
    response_time_actual = models.IntegerField(null=True, blank=True)
    resolution_time_actual = models.IntegerField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-service_date']

    def __str__(self):
        return f"{self.contract.contract_number} - {self.job_card.job_card_number}"


class ContractApprovalStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'


class ContractApproval(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='approvals')
    approver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contract_approvals')
    approval_level = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=ContractApprovalStatus.choices, default=ContractApprovalStatus.PENDING)
    comments = models.TextField(blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['approval_level', '-created_at']
        unique_together = ['contract', 'approver', 'approval_level']

    def __str__(self):
        return f"{self.contract.contract_number} - Level {self.approval_level} - {self.status}"


class ContractAuditAction(models.TextChoices):
    CREATED = 'CREATED', 'Created'
    UPDATED = 'UPDATED', 'Updated'
    ACTIVATED = 'ACTIVATED', 'Activated'
    SUSPENDED = 'SUSPENDED', 'Suspended'
    RESUMED = 'RESUMED', 'Resumed'
    TERMINATED = 'TERMINATED', 'Terminated'
    RENEWED = 'RENEWED', 'Renewed'
    UPGRADED = 'UPGRADED', 'Upgraded'
    SERVICE_CONSUMED = 'SERVICE_CONSUMED', 'Service Consumed'
    GOODWILL_APPLIED = 'GOODWILL_APPLIED', 'Goodwill Applied'


class ContractAuditLog(models.Model):
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name='audit_logs')
    action = models.CharField(max_length=30, choices=ContractAuditAction.choices)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='contract_audit_actions')
    old_values = models.JSONField(default=dict)
    new_values = models.JSONField(default=dict)
    job_card = models.ForeignKey('JobCard', on_delete=models.SET_NULL, null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.contract.contract_number} - {self.action} - {self.created_at}"


class Supplier(models.Model):
    supplier_id = models.CharField(max_length=50, unique=True, blank=True)
    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    gst_number = models.CharField(max_length=50, blank=True)
    pan_number = models.CharField(max_length=20, blank=True)
    payment_terms = models.CharField(max_length=100, default='Net 30')
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    categories = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def save(self, *args, **kwargs):
        if not self.supplier_id:
            self.supplier_id = f"SUP-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.supplier_id} - {self.name}"


class PurchaseOrderStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
    APPROVED = 'APPROVED', 'Approved'
    ORDERED = 'ORDERED', 'Ordered'
    PARTIALLY_RECEIVED = 'PARTIALLY_RECEIVED', 'Partially Received'
    RECEIVED = 'RECEIVED', 'Received'
    CANCELLED = 'CANCELLED', 'Cancelled'


class PurchaseOrder(models.Model):
    po_number = models.CharField(max_length=50, unique=True, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='purchase_orders')
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchase_orders')
    status = models.CharField(max_length=30, choices=PurchaseOrderStatus.choices, default=PurchaseOrderStatus.DRAFT)
    order_date = models.DateField(null=True, blank=True)
    expected_delivery = models.DateField(null=True, blank=True)
    actual_delivery = models.DateField(null=True, blank=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    shipping = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_pos')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_pos')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.po_number:
            self.po_number = f"PO-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.po_number} - {self.supplier.name}"


class PurchaseOrderLine(models.Model):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='lines')
    part = models.ForeignKey(Part, on_delete=models.CASCADE)
    quantity_ordered = models.IntegerField(default=1)
    quantity_received = models.IntegerField(default=0)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    total = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.part.name} x {self.quantity_ordered}"


class ReservationStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    ISSUED = 'ISSUED', 'Issued'
    RELEASED = 'RELEASED', 'Released'
    CANCELLED = 'CANCELLED', 'Cancelled'
    EXPIRED = 'EXPIRED', 'Expired'


class PartReservation(models.Model):
    reservation_number = models.CharField(max_length=50, unique=True, blank=True)
    job_card = models.ForeignKey(JobCard, on_delete=models.CASCADE, related_name='part_reservations')
    part = models.ForeignKey(Part, on_delete=models.CASCADE, related_name='reservations')
    task = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True, blank=True, related_name='reserved_parts')
    quantity = models.IntegerField(default=1)
    status = models.CharField(max_length=20, choices=ReservationStatus.choices, default=ReservationStatus.ACTIVE)
    reserved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='part_reservations')
    reserved_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    issued_at = models.DateTimeField(null=True, blank=True)
    released_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        if not self.reservation_number:
            self.reservation_number = f"RES-{uuid.uuid4().hex[:8].upper()}"
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new and self.status == ReservationStatus.ACTIVE:
            self.part.reserved += self.quantity
            self.part.save()

    def release(self):
        if self.status == ReservationStatus.ACTIVE:
            self.part.reserved = max(0, self.part.reserved - self.quantity)
            self.part.save()
            self.status = ReservationStatus.RELEASED
            self.released_at = timezone.now()
            self.save(update_fields=['status', 'released_at'])

    def __str__(self):
        return f"{self.reservation_number} - {self.part.name}"


class GRNStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    PENDING_INSPECTION = 'PENDING_INSPECTION', 'Pending Inspection'
    INSPECTED = 'INSPECTED', 'Inspected'
    ACCEPTED = 'ACCEPTED', 'Accepted'
    PARTIAL_ACCEPT = 'PARTIAL_ACCEPT', 'Partially Accepted'
    REJECTED = 'REJECTED', 'Rejected'


class GoodsReceiptNote(models.Model):
    grn_number = models.CharField(max_length=50, unique=True, blank=True)
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name='grns')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='grns')
    status = models.CharField(max_length=20, choices=GRNStatus.choices, default=GRNStatus.DRAFT)
    receipt_date = models.DateTimeField(auto_now_add=True)
    invoice_number = models.CharField(max_length=100, blank=True)
    invoice_date = models.DateField(null=True, blank=True)
    invoice_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    delivery_challan = models.CharField(max_length=100, blank=True)
    vehicle_number = models.CharField(max_length=50, blank=True)
    received_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='received_grns')
    inspected_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='inspected_grns')
    inspection_date = models.DateTimeField(null=True, blank=True)
    inspection_notes = models.TextField(blank=True)
    total_received_qty = models.IntegerField(default=0)
    total_accepted_qty = models.IntegerField(default=0)
    total_rejected_qty = models.IntegerField(default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.grn_number:
            self.grn_number = f"GRN-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.grn_number} - {self.purchase_order.po_number}"


class GRNLine(models.Model):
    grn = models.ForeignKey(GoodsReceiptNote, on_delete=models.CASCADE, related_name='lines')
    po_line = models.ForeignKey(PurchaseOrderLine, on_delete=models.CASCADE, related_name='grn_lines')
    part = models.ForeignKey(Part, on_delete=models.CASCADE)
    quantity_received = models.IntegerField(default=0)
    quantity_accepted = models.IntegerField(default=0)
    quantity_rejected = models.IntegerField(default=0)
    rejection_reason = models.TextField(blank=True)
    batch_number = models.CharField(max_length=100, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=100, blank=True)
    quality_rating = models.IntegerField(default=5)

    def accept_stock(self):
        if self.quantity_accepted > 0:
            self.part.stock += self.quantity_accepted
            self.part.last_purchase_date = timezone.now().date()
            if self.batch_number:
                self.part.batch_number = self.batch_number
            if self.expiry_date:
                self.part.expiry_date = self.expiry_date
            self.part.save()
            self.po_line.quantity_received += self.quantity_accepted
            self.po_line.save()

    def __str__(self):
        return f"{self.grn.grn_number} - {self.part.name}"


class StockTransferStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
    APPROVED = 'APPROVED', 'Approved'
    IN_TRANSIT = 'IN_TRANSIT', 'In Transit'
    RECEIVED = 'RECEIVED', 'Received'
    CANCELLED = 'CANCELLED', 'Cancelled'


class StockTransfer(models.Model):
    transfer_number = models.CharField(max_length=50, unique=True, blank=True)
    from_branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='outgoing_transfers')
    to_branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='incoming_transfers')
    status = models.CharField(max_length=20, choices=StockTransferStatus.choices, default=StockTransferStatus.DRAFT)
    transfer_date = models.DateField(null=True, blank=True)
    expected_arrival = models.DateField(null=True, blank=True)
    actual_arrival = models.DateField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_transfers')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_transfers')
    received_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='received_transfers')
    vehicle_number = models.CharField(max_length=50, blank=True)
    driver_name = models.CharField(max_length=100, blank=True)
    driver_phone = models.CharField(max_length=20, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.transfer_number:
            self.transfer_number = f"TRF-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def dispatch(self):
        if self.status == StockTransferStatus.APPROVED:
            for line in self.lines.all():
                line.part.stock = max(0, line.part.stock - line.quantity)
                line.part.save()
            self.status = StockTransferStatus.IN_TRANSIT
            self.transfer_date = timezone.now().date()
            self.save()

    def receive(self, received_by):
        if self.status == StockTransferStatus.IN_TRANSIT:
            for line in self.lines.all():
                to_part = Part.objects.filter(sku=line.part.sku, branch=self.to_branch).first()
                if to_part:
                    to_part.stock += line.quantity_received or line.quantity
                    to_part.save()
            self.status = StockTransferStatus.RECEIVED
            self.actual_arrival = timezone.now().date()
            self.received_by = received_by
            self.save()

    def __str__(self):
        return f"{self.transfer_number}"


class StockTransferLine(models.Model):
    transfer = models.ForeignKey(StockTransfer, on_delete=models.CASCADE, related_name='lines')
    part = models.ForeignKey(Part, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    quantity_received = models.IntegerField(default=0)
    batch_number = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.part.name} x {self.quantity}"


class PRStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'
    CONVERTED_TO_PO = 'CONVERTED_TO_PO', 'Converted to PO'
    CANCELLED = 'CANCELLED', 'Cancelled'


class PRSource(models.TextChoices):
    MANUAL = 'MANUAL', 'Manual Request'
    LOW_STOCK = 'LOW_STOCK', 'Low Stock Alert'
    JOB_CARD = 'JOB_CARD', 'Job Card Requirement'
    SCHEDULED = 'SCHEDULED', 'Scheduled Replenishment'


class PurchaseRequisition(models.Model):
    pr_number = models.CharField(max_length=50, unique=True, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='purchase_requisitions')
    status = models.CharField(max_length=20, choices=PRStatus.choices, default=PRStatus.DRAFT)
    source = models.CharField(max_length=20, choices=PRSource.choices, default=PRSource.MANUAL)
    priority = models.CharField(max_length=20, default='NORMAL', choices=[('LOW', 'Low'), ('NORMAL', 'Normal'), ('HIGH', 'High'), ('URGENT', 'Urgent')])
    required_date = models.DateField(null=True, blank=True)
    job_card = models.ForeignKey(JobCard, on_delete=models.SET_NULL, null=True, blank=True, related_name='purchase_requisitions')
    suggested_supplier = models.ForeignKey('Supplier', on_delete=models.SET_NULL, null=True, blank=True, related_name='suggested_prs')
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.SET_NULL, null=True, blank=True, related_name='source_prs')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_prs')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_prs')
    approval_date = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.pr_number:
            self.pr_number = f"PR-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def convert_to_po(self, supplier, created_by):
        if self.status == PRStatus.APPROVED:
            po = PurchaseOrder.objects.create(
                branch=self.branch,
                supplier=supplier,
                status=PurchaseOrderStatus.DRAFT,
                created_by=created_by,
                notes=f"Created from PR: {self.pr_number}"
            )
            for line in self.lines.all():
                PurchaseOrderLine.objects.create(
                    purchase_order=po,
                    part=line.part,
                    quantity_ordered=line.quantity,
                    unit_price=line.part.cost_price,
                    total=line.quantity * line.part.cost_price
                )
            self.purchase_order = po
            self.status = PRStatus.CONVERTED_TO_PO
            self.save()
            return po
        return None

    def __str__(self):
        return f"{self.pr_number}"


class PRLine(models.Model):
    purchase_requisition = models.ForeignKey(PurchaseRequisition, on_delete=models.CASCADE, related_name='lines')
    part = models.ForeignKey(Part, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    current_stock = models.IntegerField(default=0)
    min_stock = models.IntegerField(default=0)
    notes = models.TextField(blank=True)

    def __str__(self):
        return f"{self.part.name} x {self.quantity}"


class SupplierPerformance(models.Model):
    supplier = models.ForeignKey('Supplier', on_delete=models.CASCADE, related_name='performance_records')
    period_start = models.DateField()
    period_end = models.DateField()
    total_orders = models.IntegerField(default=0)
    orders_on_time = models.IntegerField(default=0)
    orders_late = models.IntegerField(default=0)
    total_items_ordered = models.IntegerField(default=0)
    items_accepted = models.IntegerField(default=0)
    items_rejected = models.IntegerField(default=0)
    total_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    price_variance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    avg_delivery_days = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    on_time_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    quality_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    overall_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['supplier', 'period_start', 'period_end']
        ordering = ['-period_end']

    def calculate_scores(self):
        if self.total_orders > 0:
            self.on_time_rate = round((self.orders_on_time / self.total_orders) * 100, 2)
        else:
            self.on_time_rate = 0
        
        if self.total_items_ordered > 0:
            self.quality_rate = round((self.items_accepted / self.total_items_ordered) * 100, 2)
        else:
            self.quality_rate = 0
        
        price_score = 50 - min(50, abs(float(self.price_variance)) / 100) if self.price_variance else 50
        self.overall_score = round((self.on_time_rate * 0.4) + (self.quality_rate * 0.4) + (price_score * 0.2), 2)
        self.save()

    def __str__(self):
        return f"{self.supplier.name} - {self.period_start} to {self.period_end}"


class AlertType(models.TextChoices):
    LOW_STOCK = 'LOW_STOCK', 'Low Stock'
    OVERSTOCK = 'OVERSTOCK', 'Overstock'
    EXPIRY_WARNING = 'EXPIRY_WARNING', 'Expiry Warning'
    EXPIRED = 'EXPIRED', 'Expired'
    RESERVATION_EXPIRY = 'RESERVATION_EXPIRY', 'Reservation Expiry'
    REORDER_POINT = 'REORDER_POINT', 'Reorder Point'


class InventoryAlert(models.Model):
    alert_id = models.CharField(max_length=50, unique=True, blank=True)
    alert_type = models.CharField(max_length=30, choices=AlertType.choices)
    part = models.ForeignKey(Part, on_delete=models.CASCADE, related_name='alerts')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='inventory_alerts')
    message = models.TextField()
    severity = models.CharField(max_length=20, default='MEDIUM', choices=[('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High'), ('CRITICAL', 'Critical')])
    is_read = models.BooleanField(default=False)
    is_resolved = models.BooleanField(default=False)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resolved_alerts')
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.alert_id:
            self.alert_id = f"ALT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def resolve(self, user, notes=''):
        self.is_resolved = True
        self.resolved_by = user
        self.resolved_at = timezone.now()
        self.resolution_notes = notes
        self.save()

    def __str__(self):
        return f"{self.alert_id} - {self.alert_type}"


class StockAdjustmentType(models.TextChoices):
    INCREASE = 'INCREASE', 'Stock Increase'
    DECREASE = 'DECREASE', 'Stock Decrease'
    SCRAP = 'SCRAP', 'Scrap'
    DAMAGE = 'DAMAGE', 'Damage'
    THEFT = 'THEFT', 'Theft/Loss'
    CORRECTION = 'CORRECTION', 'Correction'
    OPENING_STOCK = 'OPENING_STOCK', 'Opening Stock'


class StockAdjustmentStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'


class StockAdjustment(models.Model):
    adjustment_number = models.CharField(max_length=50, unique=True, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='stock_adjustments')
    part = models.ForeignKey(Part, on_delete=models.CASCADE, related_name='adjustments')
    adjustment_type = models.CharField(max_length=20, choices=StockAdjustmentType.choices)
    quantity = models.IntegerField()
    stock_before = models.IntegerField(default=0)
    stock_after = models.IntegerField(default=0)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=StockAdjustmentStatus.choices, default=StockAdjustmentStatus.DRAFT)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_adjustments')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_adjustments')
    approval_date = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    reference_document = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.adjustment_number:
            self.adjustment_number = f"ADJ-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        if not self.pk:
            self.stock_before = self.part.stock
        super().save(*args, **kwargs)

    def approve(self, user):
        if self.status == StockAdjustmentStatus.PENDING_APPROVAL:
            self.status = StockAdjustmentStatus.APPROVED
            self.approved_by = user
            self.approval_date = timezone.now()
            if self.adjustment_type in [StockAdjustmentType.INCREASE, StockAdjustmentType.OPENING_STOCK, StockAdjustmentType.CORRECTION]:
                self.part.stock += abs(self.quantity)
            else:
                self.part.stock = max(0, self.part.stock - abs(self.quantity))
            self.stock_after = self.part.stock
            self.part.save()
            self.save()
            InventoryAuditLog.objects.create(
                part=self.part,
                branch=self.branch,
                action='ADJUSTMENT',
                quantity=self.quantity,
                stock_before=self.stock_before,
                stock_after=self.stock_after,
                reference_type='ADJUSTMENT',
                reference_id=self.id,
                reference_number=self.adjustment_number,
                reason=self.reason,
                performed_by=user
            )

    def __str__(self):
        return f"{self.adjustment_number} - {self.part.name}"


class StockReturnStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    APPROVED = 'APPROVED', 'Approved'
    RESTOCKED = 'RESTOCKED', 'Restocked'
    SCRAPPED = 'SCRAPPED', 'Scrapped'


class StockReturn(models.Model):
    return_number = models.CharField(max_length=50, unique=True, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='stock_returns')
    job_card = models.ForeignKey(JobCard, on_delete=models.CASCADE, related_name='stock_returns')
    part_issue = models.ForeignKey(PartIssue, on_delete=models.CASCADE, related_name='returns')
    part = models.ForeignKey(Part, on_delete=models.CASCADE, related_name='returns')
    quantity = models.IntegerField(default=1)
    return_reason = models.TextField()
    condition = models.CharField(max_length=20, choices=[
        ('GOOD', 'Good - Restock'),
        ('DEFECTIVE', 'Defective'),
        ('DAMAGED', 'Damaged'),
        ('WRONG_PART', 'Wrong Part'),
    ], default='GOOD')
    status = models.CharField(max_length=20, choices=StockReturnStatus.choices, default=StockReturnStatus.PENDING)
    returned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='returned_parts')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_returns')
    approval_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.return_number:
            self.return_number = f"RET-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def approve_and_restock(self, user):
        if self.status == StockReturnStatus.PENDING and self.condition == 'GOOD':
            stock_before = self.part.stock
            self.part.stock += self.quantity
            self.part.save()
            self.status = StockReturnStatus.RESTOCKED
            self.approved_by = user
            self.approval_date = timezone.now()
            self.part_issue.return_quantity += self.quantity
            self.part_issue.is_returned = self.part_issue.return_quantity >= self.part_issue.quantity
            self.part_issue.save()
            self.save()
            InventoryAuditLog.objects.create(
                part=self.part,
                branch=self.branch,
                action='RETURN',
                quantity=self.quantity,
                stock_before=stock_before,
                stock_after=self.part.stock,
                reference_type='RETURN',
                reference_id=self.id,
                reference_number=self.return_number,
                reason=self.return_reason,
                performed_by=user
            )

    def __str__(self):
        return f"{self.return_number} - {self.part.name}"


class InventoryAuditLog(models.Model):
    log_id = models.CharField(max_length=50, unique=True, blank=True)
    part = models.ForeignKey(Part, on_delete=models.CASCADE, related_name='audit_logs')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='inventory_audit_logs')
    action = models.CharField(max_length=30, choices=[
        ('ISSUE', 'Part Issued'),
        ('RETURN', 'Part Returned'),
        ('RESERVE', 'Part Reserved'),
        ('RELEASE', 'Reservation Released'),
        ('GRN', 'Goods Received'),
        ('TRANSFER_OUT', 'Transfer Out'),
        ('TRANSFER_IN', 'Transfer In'),
        ('ADJUSTMENT', 'Stock Adjustment'),
        ('SCRAP', 'Scrapped'),
    ])
    quantity = models.IntegerField()
    stock_before = models.IntegerField()
    stock_after = models.IntegerField()
    reference_type = models.CharField(max_length=30)
    reference_id = models.IntegerField()
    reference_number = models.CharField(max_length=100)
    reason = models.TextField(blank=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    is_immutable = models.BooleanField(default=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['part', 'timestamp']),
            models.Index(fields=['branch', 'timestamp']),
            models.Index(fields=['reference_type', 'reference_id']),
        ]

    def save(self, *args, **kwargs):
        if self.pk and self.is_immutable:
            raise ValidationError("Audit log entries cannot be modified")
        if not self.log_id:
            self.log_id = f"LOG-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.log_id} - {self.part.name} - {self.action}"


class TechnicianSchedule(models.Model):
    technician = models.ForeignKey(User, on_delete=models.CASCADE, related_name='schedules')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='schedules')
    date = models.DateField()
    shift_start = models.TimeField()
    shift_end = models.TimeField()
    break_start = models.TimeField(null=True, blank=True)
    break_end = models.TimeField(null=True, blank=True)
    is_available = models.BooleanField(default=True)
    is_on_leave = models.BooleanField(default=False)
    leave_reason = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        unique_together = ['technician', 'date']
        ordering = ['date', 'shift_start']

    @property
    def working_hours(self):
        from datetime import datetime, timedelta
        start = datetime.combine(self.date, self.shift_start)
        end = datetime.combine(self.date, self.shift_end)
        total = (end - start).seconds / 3600
        if self.break_start and self.break_end:
            break_start = datetime.combine(self.date, self.break_start)
            break_end = datetime.combine(self.date, self.break_end)
            total -= (break_end - break_start).seconds / 3600
        return round(total, 2)

    def __str__(self):
        return f"{self.technician.username} - {self.date}"


class Appointment(models.Model):
    class AppointmentStatus(models.TextChoices):
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        CONFIRMED = 'CONFIRMED', 'Confirmed'
        CHECKED_IN = 'CHECKED_IN', 'Checked In'
        CANCELLED = 'CANCELLED', 'Cancelled'
        NO_SHOW = 'NO_SHOW', 'No Show'
        COMPLETED = 'COMPLETED', 'Completed'

    appointment_id = models.CharField(max_length=50, unique=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='appointments')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='appointments')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='appointments')
    service_advisor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='appointments')
    appointment_date = models.DateField()
    appointment_time = models.TimeField()
    estimated_duration = models.DecimalField(max_digits=4, decimal_places=2, default=2)
    service_type = models.CharField(max_length=100)
    complaint = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=AppointmentStatus.choices, default=AppointmentStatus.SCHEDULED)
    job_card = models.OneToOneField(JobCard, on_delete=models.SET_NULL, null=True, blank=True, related_name='appointment')
    reminder_sent = models.BooleanField(default=False)
    confirmation_sent = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['appointment_date', 'appointment_time']

    def save(self, *args, **kwargs):
        if not self.appointment_id:
            self.appointment_id = f"APT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.appointment_id} - {self.customer.name}"


class AnalyticsSnapshot(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='analytics', null=True, blank=True)
    date = models.DateField()
    total_jobs = models.IntegerField(default=0)
    completed_jobs = models.IntegerField(default=0)
    revenue = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    labor_revenue = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    parts_revenue = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    average_job_value = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    average_cycle_time = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    sla_compliance_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    customer_satisfaction = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    technician_utilization = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    first_time_fix_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    new_customers = models.IntegerField(default=0)
    repeat_customers = models.IntegerField(default=0)
    appointments_scheduled = models.IntegerField(default=0)
    appointments_completed = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        unique_together = ['branch', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"Analytics {self.date} - {self.branch.name if self.branch else 'All'}"


class LicenseType(models.TextChoices):
    PERPETUAL = 'PERPETUAL', 'Perpetual License'
    ANNUAL = 'ANNUAL', 'Annual Subscription'
    MONTHLY = 'MONTHLY', 'Monthly Subscription'
    TRIAL = 'TRIAL', 'Trial License'


class LicenseStatus(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    EXPIRED = 'EXPIRED', 'Expired'
    SUSPENDED = 'SUSPENDED', 'Suspended'
    GRACE_PERIOD = 'GRACE_PERIOD', 'Grace Period'


class License(models.Model):
    license_key = models.CharField(max_length=100, unique=True)
    license_type = models.CharField(max_length=20, choices=LicenseType.choices, default=LicenseType.PERPETUAL)
    status = models.CharField(max_length=20, choices=LicenseStatus.choices, default=LicenseStatus.ACTIVE)
    organization_name = models.CharField(max_length=255)
    issued_date = models.DateField(auto_now_add=True)
    expiry_date = models.DateField(null=True, blank=True)
    max_branches = models.IntegerField(default=1)
    max_users = models.IntegerField(default=10)
    features = models.JSONField(default=dict, blank=True)
    is_primary = models.BooleanField(default=True)
    support_expires = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_valid(self):
        if self.status != LicenseStatus.ACTIVE:
            return False
        if self.license_type == LicenseType.PERPETUAL:
            return True
        if self.expiry_date and self.expiry_date < timezone.now().date():
            return False
        return True

    def __str__(self):
        return f"{self.organization_name} - {self.license_type}"


class SystemSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField(blank=True)
    value_type = models.CharField(max_length=20, default='string')
    category = models.CharField(max_length=50, default='general')
    description = models.TextField(blank=True)
    is_secret = models.BooleanField(default=False)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'key']

    def __str__(self):
        return f"{self.category}.{self.key}"


class PaymentGateway(models.TextChoices):
    STRIPE = 'STRIPE', 'Stripe'
    RAZORPAY = 'RAZORPAY', 'Razorpay'
    PAYPAL = 'PAYPAL', 'PayPal'
    MANUAL = 'MANUAL', 'Manual / Cash'


class PaymentIntentStatus(models.TextChoices):
    CREATED = 'CREATED', 'Created'
    PENDING = 'PENDING', 'Pending'
    PROCESSING = 'PROCESSING', 'Processing'
    SUCCEEDED = 'SUCCEEDED', 'Succeeded'
    FAILED = 'FAILED', 'Failed'
    CANCELLED = 'CANCELLED', 'Cancelled'
    REFUNDED = 'REFUNDED', 'Refunded'


class PaymentIntent(models.Model):
    intent_id = models.CharField(max_length=100, unique=True)
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payment_intents')
    gateway = models.CharField(max_length=20, choices=PaymentGateway.choices)
    gateway_reference = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default='INR')
    status = models.CharField(max_length=20, choices=PaymentIntentStatus.choices, default=PaymentIntentStatus.CREATED)
    gateway_response = models.JSONField(default=dict, blank=True)
    customer_email = models.EmailField(blank=True)
    customer_phone = models.CharField(max_length=20, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.intent_id:
            self.intent_id = f"PI-{uuid.uuid4().hex[:12].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.intent_id} - {self.gateway} - {self.status}"


class TallySyncStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    COMPLETED = 'COMPLETED', 'Completed'
    FAILED = 'FAILED', 'Failed'
    PARTIAL = 'PARTIAL', 'Partially Synced'


class TallySyncJob(models.Model):
    job_id = models.CharField(max_length=100, unique=True)
    sync_type = models.CharField(max_length=50)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True)
    status = models.CharField(max_length=20, choices=TallySyncStatus.choices, default=TallySyncStatus.PENDING)
    records_total = models.IntegerField(default=0)
    records_synced = models.IntegerField(default=0)
    records_failed = models.IntegerField(default=0)
    error_log = models.JSONField(default=list, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def save(self, *args, **kwargs):
        if not self.job_id:
            self.job_id = f"SYNC-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.job_id} - {self.sync_type} - {self.status}"


class TallyLedgerMapping(models.Model):
    mapping_type = models.CharField(max_length=50)
    local_id = models.CharField(max_length=100)
    local_name = models.CharField(max_length=255)
    tally_ledger_name = models.CharField(max_length=255)
    tally_group = models.CharField(max_length=255, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['mapping_type', 'local_id', 'branch']

    def __str__(self):
        return f"{self.mapping_type}: {self.local_name} -> {self.tally_ledger_name}"


class IntegrationConfig(models.Model):
    name = models.CharField(max_length=100)
    integration_type = models.CharField(max_length=50)
    is_enabled = models.BooleanField(default=False)
    config = models.JSONField(default=dict, blank=True)
    credentials = models.JSONField(default=dict, blank=True)
    last_sync = models.DateTimeField(null=True, blank=True)
    sync_status = models.CharField(max_length=50, blank=True)
    webhook_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.integration_type})"


# ==================== CRM MODULE MODELS ====================

class LeadSource(models.TextChoices):
    WALK_IN = 'WALK_IN', 'Walk-in'
    WEBSITE = 'WEBSITE', 'Website'
    MOBILE_APP = 'MOBILE_APP', 'Mobile App'
    WHATSAPP = 'WHATSAPP', 'WhatsApp'
    REFERRAL = 'REFERRAL', 'Referral'
    CAMPAIGN = 'CAMPAIGN', 'Campaign'
    FLEET_INQUIRY = 'FLEET_INQUIRY', 'Fleet Inquiry'
    SOCIAL_MEDIA = 'SOCIAL_MEDIA', 'Social Media'
    COLD_CALL = 'COLD_CALL', 'Cold Call'
    ADVERTISEMENT = 'ADVERTISEMENT', 'Advertisement'
    OTHER = 'OTHER', 'Other'


class LeadStatus(models.TextChoices):
    NEW = 'NEW', 'New'
    CONTACTED = 'CONTACTED', 'Contacted'
    QUALIFIED = 'QUALIFIED', 'Qualified'
    QUOTED = 'QUOTED', 'Quoted'
    NEGOTIATION = 'NEGOTIATION', 'Negotiation'
    CUSTOMER = 'CUSTOMER', 'Customer'
    CONVERTED = 'CONVERTED', 'Converted'
    LOST = 'LOST', 'Lost'


class Lead(models.Model):
    lead_id = models.CharField(max_length=50, unique=True, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='leads')
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    alternate_phone = models.CharField(max_length=20, blank=True, null=True)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    source = models.CharField(max_length=30, choices=LeadSource.choices, default=LeadSource.WALK_IN)
    status = models.CharField(max_length=20, choices=LeadStatus.choices, default=LeadStatus.NEW)
    lead_type = models.CharField(max_length=50, default='Service')
    vehicle_make = models.CharField(max_length=100, blank=True, null=True)
    vehicle_model = models.CharField(max_length=100, blank=True, null=True)
    vehicle_year = models.IntegerField(null=True, blank=True)
    registration_number = models.CharField(max_length=20, blank=True, null=True)
    service_interest = models.CharField(max_length=255, blank=True, null=True)
    contract_interest = models.CharField(max_length=100, blank=True, null=True)
    budget_range = models.CharField(max_length=100, blank=True, null=True)
    expected_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    priority = models.CharField(max_length=20, default='Medium')
    owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='owned_leads')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_leads')
    referred_by_customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='referred_leads')
    converted_customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='converted_from_lead')
    converted_job_card = models.ForeignKey('JobCard', on_delete=models.SET_NULL, null=True, blank=True, related_name='source_lead')
    converted_contract = models.ForeignKey(Contract, on_delete=models.SET_NULL, null=True, blank=True, related_name='source_lead')
    lost_reason = models.CharField(max_length=255, blank=True, null=True)
    lost_to_competitor = models.CharField(max_length=255, blank=True, null=True)
    next_follow_up = models.DateTimeField(null=True, blank=True)
    last_contact_date = models.DateTimeField(null=True, blank=True)
    contact_attempts = models.IntegerField(default=0)
    notes = models.TextField(blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'branch']),
            models.Index(fields=['owner', 'status']),
        ]

    def save(self, *args, **kwargs):
        if not self.lead_id:
            self.lead_id = f"LEAD-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.lead_id} - {self.name}"


class InteractionType(models.TextChoices):
    CALL_INBOUND = 'CALL_INBOUND', 'Inbound Call'
    CALL_OUTBOUND = 'CALL_OUTBOUND', 'Outbound Call'
    EMAIL_SENT = 'EMAIL_SENT', 'Email Sent'
    EMAIL_RECEIVED = 'EMAIL_RECEIVED', 'Email Received'
    WHATSAPP_SENT = 'WHATSAPP_SENT', 'WhatsApp Sent'
    WHATSAPP_RECEIVED = 'WHATSAPP_RECEIVED', 'WhatsApp Received'
    SMS_SENT = 'SMS_SENT', 'SMS Sent'
    WALK_IN = 'WALK_IN', 'Walk-in Visit'
    SERVICE_VISIT = 'SERVICE_VISIT', 'Service Visit'
    MEETING = 'MEETING', 'Meeting'
    COMPLAINT = 'COMPLAINT', 'Complaint'
    FEEDBACK = 'FEEDBACK', 'Feedback'
    FOLLOW_UP = 'FOLLOW_UP', 'Follow-up'
    QUOTE = 'QUOTE', 'Quote Provided'
    OTHER = 'OTHER', 'Other'


class InteractionOutcome(models.TextChoices):
    SUCCESSFUL = 'SUCCESSFUL', 'Successful'
    NO_ANSWER = 'NO_ANSWER', 'No Answer'
    BUSY = 'BUSY', 'Busy'
    CALLBACK_REQUESTED = 'CALLBACK_REQUESTED', 'Callback Requested'
    NOT_INTERESTED = 'NOT_INTERESTED', 'Not Interested'
    SCHEDULED = 'SCHEDULED', 'Appointment Scheduled'
    QUOTE_SENT = 'QUOTE_SENT', 'Quote Sent'
    ESCALATED = 'ESCALATED', 'Escalated'
    RESOLVED = 'RESOLVED', 'Resolved'
    PENDING = 'PENDING', 'Pending'


class CustomerInteraction(models.Model):
    interaction_id = models.CharField(max_length=50, unique=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=True, blank=True, related_name='interactions')
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, null=True, blank=True, related_name='interactions')
    job_card = models.ForeignKey('JobCard', on_delete=models.SET_NULL, null=True, blank=True, related_name='crm_interactions')
    contract = models.ForeignKey(Contract, on_delete=models.SET_NULL, null=True, blank=True, related_name='interactions')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True)
    interaction_type = models.CharField(max_length=30, choices=InteractionType.choices)
    channel = models.CharField(max_length=20, choices=CommunicationChannel.choices, default=CommunicationChannel.PHONE)
    direction = models.CharField(max_length=10, default='outbound')
    subject = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField()
    outcome = models.CharField(max_length=30, choices=InteractionOutcome.choices, null=True, blank=True)
    sentiment = models.CharField(max_length=20, blank=True, null=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    next_action = models.CharField(max_length=255, blank=True, null=True)
    next_action_date = models.DateTimeField(null=True, blank=True)
    initiated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='initiated_interactions')
    handled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='handled_interactions')
    attachments = models.JSONField(default=list, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    is_private = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer', 'created_at']),
            models.Index(fields=['lead', 'created_at']),
        ]

    def save(self, *args, **kwargs):
        if not self.interaction_id:
            self.interaction_id = f"INT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        target = self.customer or self.lead
        return f"{self.interaction_id} - {self.interaction_type} - {target}"


class TicketType(models.TextChoices):
    SERVICE_QUALITY = 'SERVICE_QUALITY', 'Service Quality Issue'
    BILLING_DISPUTE = 'BILLING_DISPUTE', 'Billing Dispute'
    DELAY_COMPLAINT = 'DELAY_COMPLAINT', 'Delay Complaint'
    WARRANTY_ISSUE = 'WARRANTY_ISSUE', 'Warranty Issue'
    CONTRACT_DISPUTE = 'CONTRACT_DISPUTE', 'Contract Dispute'
    PARTS_ISSUE = 'PARTS_ISSUE', 'Parts Issue'
    STAFF_BEHAVIOR = 'STAFF_BEHAVIOR', 'Staff Behavior'
    GENERAL_INQUIRY = 'GENERAL_INQUIRY', 'General Inquiry'
    FEEDBACK = 'FEEDBACK', 'Feedback'
    OTHER = 'OTHER', 'Other'


class TicketStatus(models.TextChoices):
    RAISED = 'RAISED', 'Raised'
    ASSIGNED = 'ASSIGNED', 'Assigned'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    PENDING_CUSTOMER = 'PENDING_CUSTOMER', 'Pending Customer'
    ESCALATED = 'ESCALATED', 'Escalated'
    RESOLVED = 'RESOLVED', 'Resolved'
    CLOSED = 'CLOSED', 'Closed'
    REOPENED = 'REOPENED', 'Reopened'


class TicketPriority(models.TextChoices):
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'
    CRITICAL = 'CRITICAL', 'Critical'


class Ticket(models.Model):
    ticket_id = models.CharField(max_length=50, unique=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='tickets')
    vehicle = models.ForeignKey(Vehicle, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    job_card = models.ForeignKey('JobCard', on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    contract = models.ForeignKey(Contract, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    invoice = models.ForeignKey(Invoice, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='tickets')
    ticket_type = models.CharField(max_length=30, choices=TicketType.choices)
    status = models.CharField(max_length=20, choices=TicketStatus.choices, default=TicketStatus.RAISED)
    priority = models.CharField(max_length=20, choices=TicketPriority.choices, default=TicketPriority.MEDIUM)
    subject = models.CharField(max_length=255)
    description = models.TextField()
    resolution = models.TextField(blank=True, null=True)
    root_cause = models.TextField(blank=True, null=True)
    compensation_offered = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    raised_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='raised_tickets')
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    escalated_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='escalated_tickets')
    escalation_level = models.IntegerField(default=0)
    escalation_reason = models.TextField(blank=True, null=True)
    sla_response_hours = models.IntegerField(default=24)
    sla_resolution_hours = models.IntegerField(default=72)
    first_response_at = models.DateTimeField(null=True, blank=True)
    sla_breached = models.BooleanField(default=False)
    customer_satisfaction = models.IntegerField(null=True, blank=True)
    feedback = models.TextField(blank=True, null=True)
    attachments = models.JSONField(default=list, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'priority']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['assigned_to', 'status']),
        ]

    def save(self, *args, **kwargs):
        if not self.ticket_id:
            self.ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.ticket_id} - {self.subject}"


class FollowUpType(models.TextChoices):
    SERVICE_REMINDER = 'SERVICE_REMINDER', 'Service Reminder'
    PAYMENT_FOLLOW_UP = 'PAYMENT_FOLLOW_UP', 'Payment Follow-up'
    RENEWAL_FOLLOW_UP = 'RENEWAL_FOLLOW_UP', 'Renewal Follow-up'
    COMPLAINT_FOLLOW_UP = 'COMPLAINT_FOLLOW_UP', 'Complaint Follow-up'
    FEEDBACK_FOLLOW_UP = 'FEEDBACK_FOLLOW_UP', 'Feedback Follow-up'
    LEAD_FOLLOW_UP = 'LEAD_FOLLOW_UP', 'Lead Follow-up'
    QUOTE_FOLLOW_UP = 'QUOTE_FOLLOW_UP', 'Quote Follow-up'
    GENERAL = 'GENERAL', 'General'


class FollowUpStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'
    OVERDUE = 'OVERDUE', 'Overdue'


class FollowUpTask(models.Model):
    task_id = models.CharField(max_length=50, unique=True, blank=True)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=True, blank=True, related_name='follow_up_tasks')
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, null=True, blank=True, related_name='follow_up_tasks')
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, null=True, blank=True, related_name='follow_up_tasks')
    job_card = models.ForeignKey('JobCard', on_delete=models.SET_NULL, null=True, blank=True, related_name='follow_up_tasks')
    contract = models.ForeignKey(Contract, on_delete=models.SET_NULL, null=True, blank=True, related_name='follow_up_tasks')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True)
    follow_up_type = models.CharField(max_length=30, choices=FollowUpType.choices)
    status = models.CharField(max_length=20, choices=FollowUpStatus.choices, default=FollowUpStatus.PENDING)
    priority = models.CharField(max_length=20, choices=TicketPriority.choices, default=TicketPriority.MEDIUM)
    subject = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    due_date = models.DateTimeField()
    reminder_date = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_follow_ups')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_follow_ups')
    outcome = models.TextField(blank=True, null=True)
    next_action = models.CharField(max_length=255, blank=True, null=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['due_date']
        indexes = [
            models.Index(fields=['assigned_to', 'status', 'due_date']),
            models.Index(fields=['customer', 'status']),
        ]

    def save(self, *args, **kwargs):
        if not self.task_id:
            self.task_id = f"TASK-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.task_id} - {self.subject}"


class CampaignType(models.TextChoices):
    SERVICE_REMINDER = 'SERVICE_REMINDER', 'Service Reminder'
    SEASONAL_OFFER = 'SEASONAL_OFFER', 'Seasonal Offer'
    CONTRACT_RENEWAL = 'CONTRACT_RENEWAL', 'Contract Renewal'
    UPSELL = 'UPSELL', 'Upsell'
    CROSS_SELL = 'CROSS_SELL', 'Cross-sell'
    BIRTHDAY = 'BIRTHDAY', 'Birthday'
    ANNIVERSARY = 'ANNIVERSARY', 'Anniversary'
    REACTIVATION = 'REACTIVATION', 'Reactivation'
    FEEDBACK = 'FEEDBACK', 'Feedback Request'
    PROMOTIONAL = 'PROMOTIONAL', 'Promotional'


class CampaignStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    SCHEDULED = 'SCHEDULED', 'Scheduled'
    ACTIVE = 'ACTIVE', 'Active'
    PAUSED = 'PAUSED', 'Paused'
    COMPLETED = 'COMPLETED', 'Completed'
    CANCELLED = 'CANCELLED', 'Cancelled'


class Campaign(models.Model):
    campaign_id = models.CharField(max_length=50, unique=True, blank=True)
    name = models.CharField(max_length=255)
    campaign_type = models.CharField(max_length=30, choices=CampaignType.choices)
    status = models.CharField(max_length=20, choices=CampaignStatus.choices, default=CampaignStatus.DRAFT)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='campaigns')
    channel = models.CharField(max_length=20, choices=CommunicationChannel.choices, default=CommunicationChannel.SMS)
    target_segment = models.CharField(max_length=100, blank=True, null=True)
    target_criteria = models.JSONField(default=dict, blank=True)
    message_template = models.TextField()
    subject = models.CharField(max_length=255, blank=True, null=True)
    offer_details = models.TextField(blank=True, null=True)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    valid_from = models.DateField(null=True, blank=True)
    valid_until = models.DateField(null=True, blank=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    total_recipients = models.IntegerField(default=0)
    messages_sent = models.IntegerField(default=0)
    messages_delivered = models.IntegerField(default=0)
    messages_opened = models.IntegerField(default=0)
    messages_clicked = models.IntegerField(default=0)
    conversions = models.IntegerField(default=0)
    revenue_generated = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    cost = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_campaigns')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.campaign_id:
            self.campaign_id = f"CAMP-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    @property
    def open_rate(self):
        if self.messages_delivered == 0:
            return 0
        return round((self.messages_opened / self.messages_delivered) * 100, 2)

    @property
    def click_rate(self):
        if self.messages_opened == 0:
            return 0
        return round((self.messages_clicked / self.messages_opened) * 100, 2)

    @property
    def conversion_rate(self):
        if self.messages_sent == 0:
            return 0
        return round((self.conversions / self.messages_sent) * 100, 2)

    def __str__(self):
        return f"{self.campaign_id} - {self.name}"


class CampaignRecipient(models.Model):
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, related_name='recipients')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='campaign_recipients')
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    converted = models.BooleanField(default=False)
    converted_at = models.DateTimeField(null=True, blank=True)
    conversion_value = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    unsubscribed = models.BooleanField(default=False)
    error_message = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ['campaign', 'customer']


class CustomerScore(models.Model):
    customer = models.OneToOneField(Customer, on_delete=models.CASCADE, related_name='score')
    overall_score = models.IntegerField(default=50)
    visit_frequency_score = models.IntegerField(default=0)
    revenue_score = models.IntegerField(default=0)
    payment_behavior_score = models.IntegerField(default=0)
    complaint_score = models.IntegerField(default=0)
    loyalty_score = models.IntegerField(default=0)
    engagement_score = models.IntegerField(default=0)
    segment = models.CharField(max_length=50, default='Standard')
    churn_risk = models.CharField(max_length=20, default='Low')
    lifetime_value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    predicted_next_visit = models.DateField(null=True, blank=True)
    last_calculated = models.DateTimeField(auto_now=True)
    calculation_metadata = models.JSONField(default=dict, blank=True)

    def calculate_score(self):
        weights = {
            'visit_frequency': 0.20,
            'revenue': 0.25,
            'payment_behavior': 0.15,
            'complaint': 0.15,
            'loyalty': 0.15,
            'engagement': 0.10
        }
        self.overall_score = int(
            self.visit_frequency_score * weights['visit_frequency'] +
            self.revenue_score * weights['revenue'] +
            self.payment_behavior_score * weights['payment_behavior'] +
            (100 - self.complaint_score) * weights['complaint'] +
            self.loyalty_score * weights['loyalty'] +
            self.engagement_score * weights['engagement']
        )
        if self.overall_score >= 80:
            self.segment = 'Premium'
            self.churn_risk = 'Low'
        elif self.overall_score >= 60:
            self.segment = 'Standard'
            self.churn_risk = 'Medium'
        else:
            self.segment = 'At-Risk'
            self.churn_risk = 'High'
        self.save()

    def __str__(self):
        return f"Score for {self.customer.name}: {self.overall_score}"


class CRMEvent(models.Model):
    event_id = models.CharField(max_length=50, unique=True, blank=True)
    event_type = models.CharField(max_length=50)
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, null=True, blank=True, related_name='crm_events')
    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, null=True, blank=True, related_name='crm_events')
    related_object_type = models.CharField(max_length=50, blank=True, null=True)
    related_object_id = models.IntegerField(null=True, blank=True)
    description = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)
    triggered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_system_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.event_id:
            self.event_id = f"EVT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.event_id} - {self.event_type}"


class AttendanceStatus(models.TextChoices):
    PRESENT = 'PRESENT', 'Present'
    ABSENT = 'ABSENT', 'Absent'
    HALF_DAY = 'HALF_DAY', 'Half Day'
    LATE = 'LATE', 'Late'
    ON_LEAVE = 'ON_LEAVE', 'On Leave'
    HOLIDAY = 'HOLIDAY', 'Holiday'


class Department(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='departments')
    manager = models.ForeignKey('Profile', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_departments')
    description = models.TextField(blank=True, null=True)
    allowed_roles = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.branch.name})"


class EmployeeAssignment(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='assignments')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='employees')
    designation = models.CharField(max_length=100, blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    allocation_percentage = models.IntegerField(default=100)
    is_primary = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.profile.user.get_full_name()} - {self.department.name}"


class WorkShift(models.Model):
    name = models.CharField(max_length=50)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='shifts')
    start_time = models.TimeField()
    end_time = models.TimeField()
    break_duration_minutes = models.IntegerField(default=60)
    working_days = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.branch.name})"


class AttendanceRecord(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=AttendanceStatus.choices, default=AttendanceStatus.PRESENT)
    check_in = models.DateTimeField(null=True, blank=True)
    check_out = models.DateTimeField(null=True, blank=True)
    work_hours = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    overtime_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    shift = models.ForeignKey(WorkShift, on_delete=models.SET_NULL, null=True, blank=True)
    source = models.CharField(max_length=20, default='MANUAL')
    notes = models.TextField(blank=True, null=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        unique_together = ['profile', 'date']
        ordering = ['-date']

    def calculate_work_hours(self):
        if self.check_in and self.check_out:
            delta = self.check_out - self.check_in
            hours = delta.total_seconds() / 3600
            if self.shift and self.shift.break_duration_minutes:
                hours -= self.shift.break_duration_minutes / 60
            self.work_hours = max(0, round(hours, 2))
            self.save()

    def __str__(self):
        return f"{self.profile.user.username} - {self.date} ({self.status})"


class RolePermission(models.Model):
    role = models.CharField(max_length=50, choices=UserRole.choices)
    module = models.CharField(max_length=50, default='dashboard')
    can_view = models.BooleanField(default=False)
    can_create = models.BooleanField(default=False)
    can_edit = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)
    can_approve = models.BooleanField(default=False)
    can_export = models.BooleanField(default=False)
    custom_permissions = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = ['role', 'module']

    def __str__(self):
        return f"{self.role} - {self.module}"


class EmailConfiguration(models.Model):
    name = models.CharField(max_length=100, default='Default')
    smtp_host = models.CharField(max_length=255)
    smtp_port = models.IntegerField(default=587)
    smtp_username = models.CharField(max_length=255)
    smtp_password = models.CharField(max_length=255)
    use_tls = models.BooleanField(default=True)
    use_ssl = models.BooleanField(default=False)
    from_email = models.EmailField()
    from_name = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    last_tested = models.DateTimeField(null=True, blank=True)
    test_status = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.smtp_host})"


class WhatsAppConfiguration(models.Model):
    name = models.CharField(max_length=100, default='Default')
    provider = models.CharField(max_length=50, default='twilio')
    api_key = models.CharField(max_length=255)
    api_secret = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=20)
    account_sid = models.CharField(max_length=255, blank=True)
    webhook_url = models.CharField(max_length=500, blank=True)
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    last_tested = models.DateTimeField(null=True, blank=True)
    test_status = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.provider})"


class PaymentGatewayConfiguration(models.Model):
    name = models.CharField(max_length=100)
    gateway_type = models.CharField(max_length=50)
    api_key = models.CharField(max_length=255)
    api_secret = models.CharField(max_length=255, blank=True)
    merchant_id = models.CharField(max_length=255, blank=True)
    webhook_secret = models.CharField(max_length=255, blank=True)
    environment = models.CharField(max_length=20, default='sandbox')
    is_active = models.BooleanField(default=True)
    is_default = models.BooleanField(default=False)
    supported_currencies = models.JSONField(default=list)
    config = models.JSONField(default=dict, blank=True)
    last_tested = models.DateTimeField(null=True, blank=True)
    test_status = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.gateway_type})"


class TallyConfiguration(models.Model):
    name = models.CharField(max_length=100, default='Default')
    tally_url = models.CharField(max_length=255)
    company_name = models.CharField(max_length=255)
    port = models.IntegerField(default=9000)
    sync_invoices = models.BooleanField(default=True)
    sync_customers = models.BooleanField(default=True)
    sync_payments = models.BooleanField(default=True)
    auto_sync_enabled = models.BooleanField(default=False)
    sync_interval_minutes = models.IntegerField(default=30)
    last_sync = models.DateTimeField(null=True, blank=True)
    sync_status = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.company_name})"


# =====================================================
# ENTERPRISE ACCOUNTS & FINANCE MODULE
# =====================================================

class AccountCategory(models.TextChoices):
    ASSETS = 'ASSETS', 'Assets'
    LIABILITIES = 'LIABILITIES', 'Liabilities'
    INCOME = 'INCOME', 'Income'
    EXPENSES = 'EXPENSES', 'Expenses'
    EQUITY = 'EQUITY', 'Equity'


class AccountType(models.TextChoices):
    CASH = 'CASH', 'Cash'
    BANK = 'BANK', 'Bank'
    RECEIVABLE = 'RECEIVABLE', 'Accounts Receivable'
    PAYABLE = 'PAYABLE', 'Accounts Payable'
    INVENTORY = 'INVENTORY', 'Inventory'
    FIXED_ASSET = 'FIXED_ASSET', 'Fixed Asset'
    REVENUE = 'REVENUE', 'Revenue'
    COGS = 'COGS', 'Cost of Goods Sold'
    EXPENSE = 'EXPENSE', 'Operating Expense'
    TAX_LIABILITY = 'TAX_LIABILITY', 'Tax Liability'
    TAX_ASSET = 'TAX_ASSET', 'Tax Asset (Input Credit)'
    CAPITAL = 'CAPITAL', 'Capital'
    RETAINED_EARNINGS = 'RETAINED_EARNINGS', 'Retained Earnings'
    DEFERRED_REVENUE = 'DEFERRED_REVENUE', 'Deferred Revenue'


class Account(models.Model):
    code = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=20, choices=AccountCategory.choices)
    account_type = models.CharField(max_length=30, choices=AccountType.choices)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='accounts')
    description = models.TextField(blank=True)
    is_system = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    opening_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    current_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['code']
        indexes = [
            models.Index(fields=['category', 'account_type']),
            models.Index(fields=['branch', 'category']),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"


class TaxType(models.TextChoices):
    GST = 'GST', 'GST'
    CGST = 'CGST', 'Central GST'
    SGST = 'SGST', 'State GST'
    IGST = 'IGST', 'Integrated GST'
    VAT = 'VAT', 'VAT'
    SERVICE_TAX = 'SERVICE_TAX', 'Service Tax'
    TDS = 'TDS', 'TDS'
    TCS = 'TCS', 'TCS'
    CESS = 'CESS', 'Cess'


class TaxRate(models.Model):
    name = models.CharField(max_length=100)
    tax_type = models.CharField(max_length=20, choices=TaxType.choices)
    rate = models.DecimalField(max_digits=5, decimal_places=2)
    hsn_sac_code = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    is_compound = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    effective_from = models.DateField(null=True, blank=True)
    effective_to = models.DateField(null=True, blank=True)
    liability_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='tax_liabilities')
    input_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='tax_inputs')
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.rate}%)"


class InvoiceStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
    APPROVED = 'APPROVED', 'Approved'
    ISSUED = 'ISSUED', 'Issued'
    PARTIALLY_PAID = 'PARTIALLY_PAID', 'Partially Paid'
    PAID = 'PAID', 'Paid'
    OVERDUE = 'OVERDUE', 'Overdue'
    CANCELLED = 'CANCELLED', 'Cancelled'
    CLOSED = 'CLOSED', 'Closed'


class InvoiceType(models.TextChoices):
    SERVICE = 'SERVICE', 'Service Invoice'
    SALES = 'SALES', 'Sales Invoice'
    CONTRACT = 'CONTRACT', 'Contract Invoice'
    AMC = 'AMC', 'AMC Invoice'
    PROFORMA = 'PROFORMA', 'Proforma Invoice'
    CREDIT_NOTE = 'CREDIT_NOTE', 'Credit Note'
    DEBIT_NOTE = 'DEBIT_NOTE', 'Debit Note'


class EnhancedInvoice(models.Model):
    invoice_number = models.CharField(max_length=50, unique=True, blank=True)
    invoice_type = models.CharField(max_length=20, choices=InvoiceType.choices, default=InvoiceType.SERVICE)
    status = models.CharField(max_length=20, choices=InvoiceStatus.choices, default=InvoiceStatus.DRAFT)
    job_card = models.ForeignKey(JobCard, on_delete=models.SET_NULL, null=True, blank=True, related_name='enhanced_invoices')
    contract = models.ForeignKey('Contract', on_delete=models.SET_NULL, null=True, blank=True, related_name='enhanced_invoices')
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='enhanced_invoices')
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='enhanced_invoices')
    billing_address = models.TextField(blank=True)
    shipping_address = models.TextField(blank=True)
    gstin = models.CharField(max_length=20, blank=True)
    place_of_supply = models.CharField(max_length=100, blank=True)
    is_igst = models.BooleanField(default=False)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    taxable_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    cgst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    sgst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    igst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cess_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    amount_in_words = models.CharField(max_length=500, blank=True)
    amount_paid = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    balance_due = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    invoice_date = models.DateField()
    due_date = models.DateField(null=True, blank=True)
    payment_terms = models.CharField(max_length=100, blank=True)
    terms_and_conditions = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    internal_notes = models.TextField(blank=True)
    is_reverse_charge = models.BooleanField(default=False)
    is_export = models.BooleanField(default=False)
    is_sez = models.BooleanField(default=False)
    e_invoice_irn = models.CharField(max_length=100, blank=True)
    e_invoice_ack_no = models.CharField(max_length=100, blank=True)
    e_invoice_ack_date = models.DateTimeField(null=True, blank=True)
    e_way_bill_no = models.CharField(max_length=50, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_enhanced_invoices')
    approved_at = models.DateTimeField(null=True, blank=True)
    issued_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='issued_invoices')
    issued_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='cancelled_invoices')
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.TextField(blank=True)
    receivable_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='receivable_invoices')
    revenue_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='revenue_invoices')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_enhanced_invoices')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-invoice_date', '-created_at']
        indexes = [
            models.Index(fields=['status', 'branch']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['invoice_date']),
            models.Index(fields=['due_date', 'status']),
        ]

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            prefix = 'INV' if self.invoice_type == InvoiceType.SERVICE else self.invoice_type[:3].upper()
            self.invoice_number = f"{prefix}-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        self.balance_due = self.grand_total - self.amount_paid
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice_number} - {self.customer.name}"


class InvoiceLine(models.Model):
    class LineType(models.TextChoices):
        LABOR = 'LABOR', 'Labor'
        PARTS = 'PARTS', 'Parts'
        CONSUMABLES = 'CONSUMABLES', 'Consumables'
        SERVICE = 'SERVICE', 'Service'
        ACCESSORY = 'ACCESSORY', 'Accessory'
        OTHER = 'OTHER', 'Other'

    invoice = models.ForeignKey(EnhancedInvoice, on_delete=models.CASCADE, related_name='lines')
    line_number = models.IntegerField(default=1)
    line_type = models.CharField(max_length=20, choices=LineType.choices, default=LineType.SERVICE)
    description = models.CharField(max_length=500)
    hsn_sac_code = models.CharField(max_length=20, blank=True)
    part = models.ForeignKey('Part', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoice_lines')
    task = models.ForeignKey('Task', on_delete=models.SET_NULL, null=True, blank=True, related_name='invoice_lines')
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit = models.CharField(max_length=20, default='Nos')
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    taxable_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.ForeignKey(TaxRate, on_delete=models.SET_NULL, null=True, blank=True)
    cgst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cgst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    sgst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    sgst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    igst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    igst_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    cess_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    cess_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_warranty_covered = models.BooleanField(default=False)
    is_contract_covered = models.BooleanField(default=False)
    coverage_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        ordering = ['line_number']

    def save(self, *args, **kwargs):
        gross = self.quantity * self.unit_price
        self.discount_amount = gross * (self.discount_percent / 100)
        self.taxable_amount = gross - self.discount_amount
        self.cgst_amount = self.taxable_amount * (self.cgst_rate / 100)
        self.sgst_amount = self.taxable_amount * (self.sgst_rate / 100)
        self.igst_amount = self.taxable_amount * (self.igst_rate / 100)
        self.cess_amount = self.taxable_amount * (self.cess_rate / 100)
        self.total_amount = self.taxable_amount + self.cgst_amount + self.sgst_amount + self.igst_amount + self.cess_amount
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.invoice.invoice_number} - Line {self.line_number}"


class CreditNote(models.Model):
    class Reason(models.TextChoices):
        SALES_RETURN = 'SALES_RETURN', 'Sales Return'
        DISCOUNT = 'DISCOUNT', 'Post-Sale Discount'
        DEFECTIVE = 'DEFECTIVE', 'Defective Product'
        SERVICE_ISSUE = 'SERVICE_ISSUE', 'Service Issue'
        BILLING_ERROR = 'BILLING_ERROR', 'Billing Error'
        GOODWILL = 'GOODWILL', 'Goodwill'
        OTHER = 'OTHER', 'Other'

    credit_note_number = models.CharField(max_length=50, unique=True, blank=True)
    original_invoice = models.ForeignKey(EnhancedInvoice, on_delete=models.PROTECT, related_name='credit_notes')
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='credit_notes')
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='credit_notes')
    reason = models.CharField(max_length=20, choices=Reason.choices)
    reason_detail = models.TextField(blank=True)
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=InvoiceStatus.choices, default=InvoiceStatus.DRAFT)
    is_adjusted = models.BooleanField(default=False)
    adjusted_invoice = models.ForeignKey(EnhancedInvoice, on_delete=models.SET_NULL, null=True, blank=True, related_name='adjusted_credit_notes')
    is_refunded = models.BooleanField(default=False)
    refund_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    refund_date = models.DateField(null=True, blank=True)
    credit_note_date = models.DateField()
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_credit_notes')
    approved_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_credit_notes')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.credit_note_number:
            self.credit_note_number = f"CN-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.credit_note_number} - {self.customer.name}"


class CreditNoteLine(models.Model):
    credit_note = models.ForeignKey(CreditNote, on_delete=models.CASCADE, related_name='lines')
    original_line = models.ForeignKey(InvoiceLine, on_delete=models.SET_NULL, null=True, blank=True)
    description = models.CharField(max_length=500)
    hsn_sac_code = models.CharField(max_length=20, blank=True)
    quantity = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    unit_price = models.DecimalField(max_digits=12, decimal_places=2)
    taxable_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.credit_note.credit_note_number} - {self.description[:50]}"


class EnhancedPayment(models.Model):
    class PaymentMode(models.TextChoices):
        CASH = 'CASH', 'Cash'
        BANK_TRANSFER = 'BANK_TRANSFER', 'Bank Transfer'
        UPI = 'UPI', 'UPI'
        CARD = 'CARD', 'Card'
        CHEQUE = 'CHEQUE', 'Cheque'
        WALLET = 'WALLET', 'Wallet'
        CREDIT = 'CREDIT', 'Credit'
        ADVANCE = 'ADVANCE', 'Advance'

    class PaymentStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        PROCESSING = 'PROCESSING', 'Processing'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        CANCELLED = 'CANCELLED', 'Cancelled'
        REFUNDED = 'REFUNDED', 'Refunded'

    payment_number = models.CharField(max_length=50, unique=True, blank=True)
    invoice = models.ForeignKey(EnhancedInvoice, on_delete=models.SET_NULL, null=True, blank=True, related_name='enhanced_payments')
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='enhanced_payments')
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='enhanced_payments')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    payment_mode = models.CharField(max_length=20, choices=PaymentMode.choices)
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    payment_date = models.DateField()
    payment_time = models.TimeField(null=True, blank=True)
    reference_number = models.CharField(max_length=100, blank=True)
    bank_name = models.CharField(max_length=100, blank=True)
    cheque_number = models.CharField(max_length=50, blank=True)
    cheque_date = models.DateField(null=True, blank=True)
    card_last_four = models.CharField(max_length=4, blank=True)
    transaction_id = models.CharField(max_length=100, blank=True)
    gateway_response = models.JSONField(default=dict, blank=True)
    is_advance = models.BooleanField(default=False)
    advance_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    is_refund = models.BooleanField(default=False)
    refund_reason = models.TextField(blank=True)
    original_payment = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='refunds')
    bank_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='bank_payments')
    cash_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='cash_payments')
    notes = models.TextField(blank=True)
    received_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='received_enhanced_payments')
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_payments')
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-payment_date', '-created_at']
        indexes = [
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['payment_date', 'branch']),
        ]

    def save(self, *args, **kwargs):
        if not self.payment_number:
            self.payment_number = f"PAY-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.payment_number} - {self.amount}"


class PaymentAllocation(models.Model):
    payment = models.ForeignKey(EnhancedPayment, on_delete=models.CASCADE, related_name='allocations')
    invoice = models.ForeignKey(EnhancedInvoice, on_delete=models.CASCADE, related_name='payment_allocations')
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    allocated_at = models.DateTimeField(auto_now_add=True, null=True)
    allocated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    class Meta:
        unique_together = ['payment', 'invoice']

    def __str__(self):
        return f"{self.payment.payment_number} -> {self.invoice.invoice_number}: {self.amount}"


class ExpenseCategory(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='children')
    expense_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='expense_categories')
    description = models.TextField(blank=True)
    budget_limit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    requires_approval = models.BooleanField(default=False)
    approval_threshold = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        verbose_name_plural = 'Expense Categories'
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"


class ExpenseStatus(models.TextChoices):
    DRAFT = 'DRAFT', 'Draft'
    SUBMITTED = 'SUBMITTED', 'Submitted'
    PENDING_APPROVAL = 'PENDING_APPROVAL', 'Pending Approval'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'
    PAID = 'PAID', 'Paid'
    CANCELLED = 'CANCELLED', 'Cancelled'


class Expense(models.Model):
    expense_number = models.CharField(max_length=50, unique=True, blank=True)
    category = models.ForeignKey(ExpenseCategory, on_delete=models.PROTECT, related_name='expenses')
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='expenses')
    supplier = models.ForeignKey('Supplier', on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    description = models.TextField()
    expense_date = models.DateField()
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2)
    status = models.CharField(max_length=20, choices=ExpenseStatus.choices, default=ExpenseStatus.DRAFT)
    payment_mode = models.CharField(max_length=20, choices=EnhancedPayment.PaymentMode.choices, null=True, blank=True)
    reference_number = models.CharField(max_length=100, blank=True)
    invoice_number = models.CharField(max_length=100, blank=True)
    invoice_date = models.DateField(null=True, blank=True)
    cost_center = models.CharField(max_length=100, blank=True)
    job_card = models.ForeignKey(JobCard, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    is_reimbursable = models.BooleanField(default=False)
    reimbursed_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reimbursable_expenses')
    is_recurring = models.BooleanField(default=False)
    recurring_frequency = models.CharField(max_length=20, blank=True)
    attachments = models.JSONField(default=list, blank=True)
    notes = models.TextField(blank=True)
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='submitted_expenses')
    submitted_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_expenses')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    paid_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='paid_expenses')
    paid_at = models.DateTimeField(null=True, blank=True)
    expense_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='expenses')
    payment_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='expense_payments')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_expenses')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-expense_date', '-created_at']
        indexes = [
            models.Index(fields=['status', 'branch']),
            models.Index(fields=['expense_date', 'category']),
        ]

    def save(self, *args, **kwargs):
        if not self.expense_number:
            self.expense_number = f"EXP-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.expense_number} - {self.description[:50]}"


class JournalEntry(models.Model):
    class EntryType(models.TextChoices):
        GENERAL = 'GENERAL', 'General'
        SALES = 'SALES', 'Sales'
        PURCHASE = 'PURCHASE', 'Purchase'
        RECEIPT = 'RECEIPT', 'Receipt'
        PAYMENT = 'PAYMENT', 'Payment'
        CONTRA = 'CONTRA', 'Contra'
        ADJUSTMENT = 'ADJUSTMENT', 'Adjustment'

    journal_number = models.CharField(max_length=50, unique=True, blank=True)
    entry_type = models.CharField(max_length=20, choices=EntryType.choices, default=EntryType.GENERAL)
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='journal_entries')
    entry_date = models.DateField()
    description = models.TextField()
    reference_type = models.CharField(max_length=50, blank=True)
    reference_id = models.IntegerField(null=True, blank=True)
    reference_number = models.CharField(max_length=100, blank=True)
    total_debit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    total_credit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    is_balanced = models.BooleanField(default=False)
    is_posted = models.BooleanField(default=False)
    posted_at = models.DateTimeField(null=True, blank=True)
    posted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='posted_journals')
    is_reversed = models.BooleanField(default=False)
    reversal_of = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='reversals')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_journals')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'Journal Entries'
        ordering = ['-entry_date', '-created_at']

    def save(self, *args, **kwargs):
        if not self.journal_number:
            self.journal_number = f"JV-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        self.is_balanced = self.total_debit == self.total_credit
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.journal_number} - {self.description[:50]}"


class LedgerEntry(models.Model):
    journal = models.ForeignKey(JournalEntry, on_delete=models.CASCADE, related_name='ledger_entries')
    account = models.ForeignKey(Account, on_delete=models.PROTECT, related_name='ledger_entries')
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='ledger_entries')
    debit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    credit = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    narration = models.CharField(max_length=500, blank=True)
    cost_center = models.CharField(max_length=100, blank=True)
    entry_date = models.DateField()
    running_balance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        verbose_name_plural = 'Ledger Entries'
        ordering = ['entry_date', 'created_at']
        indexes = [
            models.Index(fields=['account', 'entry_date']),
            models.Index(fields=['branch', 'entry_date']),
        ]

    def __str__(self):
        return f"{self.account.code} - Dr:{self.debit} Cr:{self.credit}"


class CustomerReceivable(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='receivables')
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='customer_receivables')
    invoice = models.OneToOneField(EnhancedInvoice, on_delete=models.CASCADE, related_name='receivable')
    original_amount = models.DecimalField(max_digits=14, decimal_places=2)
    outstanding_amount = models.DecimalField(max_digits=14, decimal_places=2)
    due_date = models.DateField()
    days_overdue = models.IntegerField(default=0)
    aging_bucket = models.CharField(max_length=20, default='Current')
    last_reminder_date = models.DateField(null=True, blank=True)
    reminder_count = models.IntegerField(default=0)
    is_disputed = models.BooleanField(default=False)
    dispute_reason = models.TextField(blank=True)
    is_written_off = models.BooleanField(default=False)
    written_off_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    written_off_date = models.DateField(null=True, blank=True)
    written_off_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='written_off_receivables')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-due_date']

    def update_aging(self):
        from datetime import date
        today = date.today()
        if self.due_date >= today:
            self.days_overdue = 0
            self.aging_bucket = 'Current'
        else:
            self.days_overdue = (today - self.due_date).days
            if self.days_overdue <= 30:
                self.aging_bucket = '1-30 Days'
            elif self.days_overdue <= 60:
                self.aging_bucket = '31-60 Days'
            elif self.days_overdue <= 90:
                self.aging_bucket = '61-90 Days'
            else:
                self.aging_bucket = '90+ Days'
        self.save()

    def __str__(self):
        return f"{self.customer.name} - {self.invoice.invoice_number}: {self.outstanding_amount}"


class VendorPayable(models.Model):
    supplier = models.ForeignKey('Supplier', on_delete=models.PROTECT, related_name='payables')
    branch = models.ForeignKey(Branch, on_delete=models.PROTECT, related_name='vendor_payables')
    purchase_order = models.ForeignKey('PurchaseOrder', on_delete=models.SET_NULL, null=True, blank=True, related_name='payables')
    grn = models.ForeignKey('GoodsReceiptNote', on_delete=models.SET_NULL, null=True, blank=True, related_name='payables')
    invoice_number = models.CharField(max_length=100)
    invoice_date = models.DateField()
    original_amount = models.DecimalField(max_digits=14, decimal_places=2)
    outstanding_amount = models.DecimalField(max_digits=14, decimal_places=2)
    tds_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tds_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    net_payable = models.DecimalField(max_digits=14, decimal_places=2)
    due_date = models.DateField()
    days_overdue = models.IntegerField(default=0)
    aging_bucket = models.CharField(max_length=20, default='Current')
    is_approved = models.BooleanField(default=False)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_payables')
    approved_at = models.DateTimeField(null=True, blank=True)
    is_paid = models.BooleanField(default=False)
    paid_date = models.DateField(null=True, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    payable_account = models.ForeignKey(Account, on_delete=models.SET_NULL, null=True, blank=True, related_name='payables')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-due_date']

    def __str__(self):
        return f"{self.supplier.name} - {self.invoice_number}: {self.outstanding_amount}"


class FinancialAuditLog(models.Model):
    class AuditAction(models.TextChoices):
        CREATE = 'CREATE', 'Create'
        UPDATE = 'UPDATE', 'Update'
        DELETE = 'DELETE', 'Delete'
        APPROVE = 'APPROVE', 'Approve'
        REJECT = 'REJECT', 'Reject'
        POST = 'POST', 'Post to Ledger'
        REVERSE = 'REVERSE', 'Reverse Entry'
        TAX_OVERRIDE = 'TAX_OVERRIDE', 'Tax Override'
        DISCOUNT_OVERRIDE = 'DISCOUNT_OVERRIDE', 'Discount Override'
        WRITE_OFF = 'WRITE_OFF', 'Write Off'
        PAYMENT_REVERSE = 'PAYMENT_REVERSE', 'Payment Reversal'
        CREDIT_NOTE = 'CREDIT_NOTE', 'Credit Note Issue'

    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    user_role = models.CharField(max_length=30)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=30, choices=AuditAction.choices)
    model_name = models.CharField(max_length=100)
    object_id = models.CharField(max_length=100)
    object_repr = models.CharField(max_length=500)
    document_number = models.CharField(max_length=100, blank=True)
    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)
    amount_before = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    amount_after = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    reason = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True, null=True)
    is_critical = models.BooleanField(default=False)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['model_name', 'object_id']),
            models.Index(fields=['action', 'timestamp']),
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['is_critical', 'timestamp']),
        ]

    def __str__(self):
        return f"{self.action} - {self.model_name} - {self.timestamp}"


class FinancialPeriod(models.Model):
    class PeriodStatus(models.TextChoices):
        OPEN = 'OPEN', 'Open'
        SOFT_CLOSE = 'SOFT_CLOSE', 'Soft Close'
        CLOSED = 'CLOSED', 'Closed'
        LOCKED = 'LOCKED', 'Locked'

    name = models.CharField(max_length=100)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='financial_periods')
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(max_length=20, choices=PeriodStatus.choices, default=PeriodStatus.OPEN)
    is_year_end = models.BooleanField(default=False)
    closed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='closed_periods')
    closed_at = models.DateTimeField(null=True, blank=True)
    closing_balance = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['-start_date']
        unique_together = ['branch', 'start_date', 'end_date']

    def __str__(self):
        return f"{self.name} ({self.start_date} - {self.end_date})"


class BudgetEntry(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='budget_entries')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='budget_entries')
    period = models.ForeignKey(FinancialPeriod, on_delete=models.CASCADE, related_name='budget_entries')
    budgeted_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    actual_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    variance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    variance_percent = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['account', 'branch', 'period']

    def save(self, *args, **kwargs):
        self.variance = self.actual_amount - self.budgeted_amount
        if self.budgeted_amount != 0:
            self.variance_percent = (self.variance / self.budgeted_amount) * 100
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.account.code} - {self.period.name}: Budget {self.budgeted_amount}"


class SkillCategory(models.TextChoices):
    MECHANICAL = 'MECHANICAL', 'Mechanical'
    ELECTRICAL = 'ELECTRICAL', 'Electrical'
    ELECTRONICS = 'ELECTRONICS', 'Electronics'
    EV_HYBRID = 'EV_HYBRID', 'EV / Hybrid'
    BODY_PAINT = 'BODY_PAINT', 'Body & Paint'
    DIAGNOSTICS = 'DIAGNOSTICS', 'Diagnostics'
    GENERAL = 'GENERAL', 'General Service'


class SkillLevel(models.TextChoices):
    BEGINNER = 'BEGINNER', 'Beginner'
    INTERMEDIATE = 'INTERMEDIATE', 'Intermediate'
    ADVANCED = 'ADVANCED', 'Advanced'
    EXPERT = 'EXPERT', 'Expert'


class RiskLevel(models.TextChoices):
    LOW = 'LOW', 'Low'
    MEDIUM = 'MEDIUM', 'Medium'
    HIGH = 'HIGH', 'High'
    CRITICAL = 'CRITICAL', 'Critical'


class Skill(models.Model):
    skill_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=20, choices=SkillCategory.choices)
    min_level_required = models.CharField(max_length=20, choices=SkillLevel.choices, default=SkillLevel.BEGINNER)
    certification_required = models.BooleanField(default=False)
    risk_level = models.CharField(max_length=20, choices=RiskLevel.choices, default=RiskLevel.LOW)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['category', 'name']

    def __str__(self):
        return f"{self.skill_id} - {self.name}"


class EmployeeSkill(models.Model):
    class ApprovalStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Approval'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        EXPIRED = 'EXPIRED', 'Expired'

    employee = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='employee_skills')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name='skilled_employees')
    skill_level = models.CharField(max_length=20, choices=SkillLevel.choices)
    certification_number = models.CharField(max_length=100, blank=True)
    certification_date = models.DateField(null=True, blank=True)
    certification_expiry = models.DateField(null=True, blank=True)
    issuing_authority = models.CharField(max_length=255, blank=True)
    approval_status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.PENDING)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_skills')
    approved_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    jobs_completed = models.IntegerField(default=0)
    rework_count = models.IntegerField(default=0)
    average_quality_score = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['employee', 'skill']
        ordering = ['skill__category', 'skill__name']

    def __str__(self):
        return f"{self.employee.user.username} - {self.skill.name} ({self.skill_level})"

    @property
    def is_valid(self):
        if self.approval_status != self.ApprovalStatus.APPROVED:
            return False
        if self.skill.certification_required and self.certification_expiry:
            return self.certification_expiry >= timezone.now().date()
        return True

    @property
    def is_certification_expiring_soon(self):
        if not self.certification_expiry:
            return False
        days_until_expiry = (self.certification_expiry - timezone.now().date()).days
        return 0 < days_until_expiry <= 30


class DepartmentType(models.TextChoices):
    SERVICE = 'SERVICE', 'Service'
    SALES = 'SALES', 'Sales'
    ACCOUNTS = 'ACCOUNTS', 'Accounts'
    INVENTORY = 'INVENTORY', 'Inventory'
    HR = 'HR', 'Human Resources'
    ADMIN = 'ADMIN', 'Administration'
    MANAGEMENT = 'MANAGEMENT', 'Management'


class EmploymentType(models.TextChoices):
    PERMANENT = 'PERMANENT', 'Permanent'
    CONTRACT = 'CONTRACT', 'Contract'
    TEMPORARY = 'TEMPORARY', 'Temporary'
    PROBATION = 'PROBATION', 'Probation'
    INTERN = 'INTERN', 'Intern'


class Employee(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name='employee_details')
    department = models.CharField(max_length=20, choices=DepartmentType.choices)
    designation = models.CharField(max_length=100)
    reporting_manager = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='direct_reports')
    employment_type = models.CharField(max_length=20, choices=EmploymentType.choices, default=EmploymentType.PERMANENT)
    joining_date = models.DateField()
    confirmation_date = models.DateField(null=True, blank=True)
    resignation_date = models.DateField(null=True, blank=True)
    last_working_date = models.DateField(null=True, blank=True)
    primary_skill = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True, blank=True, related_name='primary_employees')
    bank_name = models.CharField(max_length=100, blank=True)
    bank_account_number = models.CharField(max_length=50, blank=True)
    bank_ifsc = models.CharField(max_length=20, blank=True)
    pan_number = models.CharField(max_length=20, blank=True)
    aadhar_number = models.CharField(max_length=20, blank=True)
    pf_number = models.CharField(max_length=50, blank=True)
    esi_number = models.CharField(max_length=50, blank=True)
    uan_number = models.CharField(max_length=50, blank=True)
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    hra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    conveyance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    special_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    pf_contribution = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    esi_contribution = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    professional_tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tds = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    emergency_contact_name = models.CharField(max_length=100, blank=True)
    emergency_contact_phone = models.CharField(max_length=20, blank=True)
    emergency_contact_relation = models.CharField(max_length=50, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.profile.employee_id} - {self.profile.user.get_full_name() or self.profile.user.username}"

    @property
    def gross_salary(self):
        return self.basic_salary + self.hra + self.conveyance + self.special_allowance

    @property
    def total_deductions(self):
        return self.pf_contribution + self.esi_contribution + self.professional_tax + self.tds

    @property
    def net_salary(self):
        return self.gross_salary - self.total_deductions


class TrainingProgram(models.Model):
    class TrainingType(models.TextChoices):
        INTERNAL = 'INTERNAL', 'Internal Training'
        EXTERNAL = 'EXTERNAL', 'External Training'
        ONLINE = 'ONLINE', 'Online Course'
        ON_JOB = 'ON_JOB', 'On-the-Job Training'
        CERTIFICATION = 'CERTIFICATION', 'Certification Program'

    class TrainingStatus(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    program_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    training_type = models.CharField(max_length=20, choices=TrainingType.choices)
    skill = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True, blank=True, related_name='training_programs')
    target_skill_level = models.CharField(max_length=20, choices=SkillLevel.choices, null=True, blank=True)
    trainer_name = models.CharField(max_length=100, blank=True)
    trainer_organization = models.CharField(max_length=200, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='training_programs')
    start_date = models.DateField()
    end_date = models.DateField()
    duration_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    max_participants = models.IntegerField(default=0)
    cost_per_participant = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=TrainingStatus.choices, default=TrainingStatus.DRAFT)
    passing_criteria = models.TextField(blank=True)
    materials_link = models.URLField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_trainings')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.program_id} - {self.name}"


class TrainingEnrollment(models.Model):
    class EnrollmentStatus(models.TextChoices):
        ENROLLED = 'ENROLLED', 'Enrolled'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        FAILED = 'FAILED', 'Failed'
        WITHDRAWN = 'WITHDRAWN', 'Withdrawn'
        NO_SHOW = 'NO_SHOW', 'No Show'

    training = models.ForeignKey(TrainingProgram, on_delete=models.CASCADE, related_name='enrollments')
    employee = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='training_enrollments')
    status = models.CharField(max_length=20, choices=EnrollmentStatus.choices, default=EnrollmentStatus.ENROLLED)
    enrolled_at = models.DateTimeField(auto_now_add=True, null=True)
    enrolled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='enrolled_trainings')
    completion_date = models.DateField(null=True, blank=True)
    assessment_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    attendance_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    certificate_number = models.CharField(max_length=100, blank=True)
    certificate_issued = models.BooleanField(default=False)
    feedback = models.TextField(blank=True)
    skill_upgrade_applied = models.BooleanField(default=False)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ['training', 'employee']
        ordering = ['-enrolled_at']

    def __str__(self):
        return f"{self.employee.user.username} - {self.training.name}"


class SkillRequirement(models.Model):
    task = models.ForeignKey('Task', on_delete=models.CASCADE, related_name='skill_requirements')
    skill = models.ForeignKey(Skill, on_delete=models.CASCADE, related_name='task_requirements')
    min_level = models.CharField(max_length=20, choices=SkillLevel.choices)
    is_mandatory = models.BooleanField(default=True)

    class Meta:
        unique_together = ['task', 'skill']

    def __str__(self):
        return f"{self.task.name} requires {self.skill.name} ({self.min_level})"


class IncentiveType(models.TextChoices):
    PER_JOB = 'PER_JOB', 'Per Job Completion'
    SKILL_BONUS = 'SKILL_BONUS', 'Skill-Based Bonus'
    QUALITY_BONUS = 'QUALITY_BONUS', 'Quality Bonus'
    EFFICIENCY_BONUS = 'EFFICIENCY_BONUS', 'Efficiency Bonus'
    CERTIFICATION_BONUS = 'CERTIFICATION_BONUS', 'Certification Bonus'
    REWORK_PENALTY = 'REWORK_PENALTY', 'Rework Penalty'
    ATTENDANCE_BONUS = 'ATTENDANCE_BONUS', 'Attendance Bonus'


class IncentiveRule(models.Model):
    rule_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    incentive_type = models.CharField(max_length=30, choices=IncentiveType.choices)
    skill = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True, blank=True, related_name='incentive_rules')
    skill_level = models.CharField(max_length=20, choices=SkillLevel.choices, null=True, blank=True)
    base_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    min_quality_score = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    max_rework_allowed = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='incentive_rules')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['incentive_type', 'name']

    def __str__(self):
        return f"{self.rule_id} - {self.name}"


class EmployeeIncentive(models.Model):
    class IncentiveStatus(models.TextChoices):
        CALCULATED = 'CALCULATED', 'Calculated'
        APPROVED = 'APPROVED', 'Approved'
        PAID = 'PAID', 'Paid'
        CANCELLED = 'CANCELLED', 'Cancelled'

    employee = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='incentives')
    rule = models.ForeignKey(IncentiveRule, on_delete=models.SET_NULL, null=True, related_name='applications')
    job_card = models.ForeignKey('JobCard', on_delete=models.SET_NULL, null=True, blank=True, related_name='employee_incentives')
    task = models.ForeignKey('Task', on_delete=models.SET_NULL, null=True, blank=True, related_name='employee_incentives')
    period_start = models.DateField()
    period_end = models.DateField()
    base_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bonus_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    penalty_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    net_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    quality_score = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    jobs_count = models.IntegerField(default=0)
    rework_count = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=IncentiveStatus.choices, default=IncentiveStatus.CALCULATED)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_incentives')
    approved_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['-period_end', '-created_at']

    def save(self, *args, **kwargs):
        self.net_amount = self.base_amount + self.bonus_amount - self.penalty_amount
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.user.username} - {self.net_amount} ({self.period_start} to {self.period_end})"


class HRAttendance(models.Model):
    class AttendanceStatus(models.TextChoices):
        PRESENT = 'PRESENT', 'Present'
        ABSENT = 'ABSENT', 'Absent'
        HALF_DAY = 'HALF_DAY', 'Half Day'
        LATE = 'LATE', 'Late'
        ON_LEAVE = 'ON_LEAVE', 'On Leave'
        HOLIDAY = 'HOLIDAY', 'Holiday'
        WEEK_OFF = 'WEEK_OFF', 'Week Off'

    employee = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='hr_attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=AttendanceStatus.choices, default=AttendanceStatus.PRESENT)
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    break_duration_minutes = models.IntegerField(default=0)
    overtime_minutes = models.IntegerField(default=0)
    total_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    productive_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    is_remote = models.BooleanField(default=False)
    remarks = models.TextField(blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_attendance')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['employee', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.employee.user.username} - {self.date} - {self.status}"


class LeaveType(models.Model):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    annual_quota = models.IntegerField(default=0)
    is_paid = models.BooleanField(default=True)
    can_carry_forward = models.BooleanField(default=False)
    max_carry_forward = models.IntegerField(default=0)
    requires_approval = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.code} - {self.name}"


class LeaveBalance(models.Model):
    employee = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='leave_balances')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, related_name='balances')
    year = models.IntegerField()
    opening_balance = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    accrued = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    used = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    lapsed = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    carried_forward = models.DecimalField(max_digits=5, decimal_places=2, default=0)

    class Meta:
        unique_together = ['employee', 'leave_type', 'year']

    @property
    def available_balance(self):
        return self.opening_balance + self.accrued + self.carried_forward - self.used - self.lapsed

    def __str__(self):
        return f"{self.employee.user.username} - {self.leave_type.code} ({self.year}): {self.available_balance}"


class LeaveRequest(models.Model):
    class LeaveStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pending Approval'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'
        CANCELLED = 'CANCELLED', 'Cancelled'

    employee = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='leave_requests')
    leave_type = models.ForeignKey(LeaveType, on_delete=models.CASCADE, related_name='requests')
    start_date = models.DateField()
    end_date = models.DateField()
    days_count = models.DecimalField(max_digits=4, decimal_places=1, default=1)
    is_half_day = models.BooleanField(default=False)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=LeaveStatus.choices, default=LeaveStatus.PENDING)
    applied_at = models.DateTimeField(auto_now_add=True, null=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_leaves')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    rejection_reason = models.TextField(blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-applied_at']

    def __str__(self):
        return f"{self.employee.user.username} - {self.leave_type.code} ({self.start_date} to {self.end_date})"


class Holiday(models.Model):
    name = models.CharField(max_length=100)
    date = models.DateField()
    is_optional = models.BooleanField(default=False)
    branches = models.ManyToManyField(Branch, related_name='holidays', blank=True)
    year = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['date']
        unique_together = ['name', 'date']

    def __str__(self):
        return f"{self.name} - {self.date}"


class HRShift(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    break_duration_minutes = models.IntegerField(default=60)
    grace_period_minutes = models.IntegerField(default=15)
    is_night_shift = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='hr_shifts')

    def __str__(self):
        return f"{self.code} - {self.name}"


class EmployeeShift(models.Model):
    employee = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='hr_shift_assignments')
    shift = models.ForeignKey(HRShift, on_delete=models.CASCADE, related_name='employees')
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_current = models.BooleanField(default=True)

    class Meta:
        ordering = ['-effective_from']

    def __str__(self):
        return f"{self.employee.user.username} - {self.shift.name}"


class SkillAuditLog(models.Model):
    class AuditAction(models.TextChoices):
        SKILL_ADDED = 'SKILL_ADDED', 'Skill Added'
        SKILL_UPDATED = 'SKILL_UPDATED', 'Skill Updated'
        SKILL_REMOVED = 'SKILL_REMOVED', 'Skill Removed'
        LEVEL_UPGRADE = 'LEVEL_UPGRADE', 'Level Upgraded'
        LEVEL_DOWNGRADE = 'LEVEL_DOWNGRADE', 'Level Downgraded'
        CERTIFICATION_ADDED = 'CERTIFICATION_ADDED', 'Certification Added'
        CERTIFICATION_EXPIRED = 'CERTIFICATION_EXPIRED', 'Certification Expired'
        APPROVAL_GRANTED = 'APPROVAL_GRANTED', 'Approval Granted'
        APPROVAL_REVOKED = 'APPROVAL_REVOKED', 'Approval Revoked'
        TRAINING_COMPLETED = 'TRAINING_COMPLETED', 'Training Completed'
        ASSIGNMENT_OVERRIDE = 'ASSIGNMENT_OVERRIDE', 'Assignment Override'

    employee = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='skill_audit_logs')
    skill = models.ForeignKey(Skill, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=30, choices=AuditAction.choices)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    reason = models.TextField(blank=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='skill_audit_actions')
    timestamp = models.DateTimeField(auto_now_add=True, null=True)
    job_card = models.ForeignKey('JobCard', on_delete=models.SET_NULL, null=True, blank=True, related_name='skill_audit_logs')

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.action} - {self.employee.user.username} - {self.timestamp}"


class Payroll(models.Model):
    class PayrollStatus(models.TextChoices):
        DRAFT = 'DRAFT', 'Draft'
        CALCULATED = 'CALCULATED', 'Calculated'
        APPROVED = 'APPROVED', 'Approved'
        PAID = 'PAID', 'Paid'
        CANCELLED = 'CANCELLED', 'Cancelled'

    employee = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='payroll_records')
    month = models.IntegerField()
    year = models.IntegerField()
    basic_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    hra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    conveyance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    special_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    overtime_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    incentive_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bonus_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    gross_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    pf_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    esi_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    professional_tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tds_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    loan_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    net_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    days_worked = models.IntegerField(default=0)
    days_absent = models.IntegerField(default=0)
    lop_days = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=PayrollStatus.choices, default=PayrollStatus.DRAFT)
    calculated_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_payrolls')
    approved_at = models.DateTimeField(null=True, blank=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    payment_reference = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        unique_together = ['employee', 'month', 'year']
        ordering = ['-year', '-month']

    def save(self, *args, **kwargs):
        self.gross_salary = (self.basic_salary + self.hra + self.conveyance + 
                            self.special_allowance + self.overtime_amount + 
                            self.incentive_amount + self.bonus_amount)
        self.total_deductions = (self.pf_deduction + self.esi_deduction + 
                                 self.professional_tax + self.tds_deduction + 
                                 self.loan_deduction + self.other_deductions)
        self.net_salary = self.gross_salary - self.total_deductions
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee.user.username} - {self.month}/{self.year} - {self.net_salary}"


class ConfigCategory(models.Model):
    """Categories for system configuration options"""
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    module = models.CharField(max_length=50, default='SYSTEM')
    display_order = models.IntegerField(default=0)
    is_system = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Config Categories"
        ordering = ['module', 'display_order', 'name']

    def __str__(self):
        return f"{self.module} - {self.name}"


class ConfigOption(models.Model):
    """Individual configuration options within categories"""
    category = models.ForeignKey(ConfigCategory, on_delete=models.CASCADE, related_name='options')
    code = models.CharField(max_length=50)
    label = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=100, blank=True)
    icon = models.CharField(max_length=50, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    display_order = models.IntegerField(default=0)
    is_default = models.BooleanField(default=False)
    is_system = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['category', 'code']
        ordering = ['display_order', 'label']

    def __str__(self):
        return f"{self.category.code} - {self.label}"


class SystemConfig(models.Model):
    """Key-value system configuration with versioning and branch overrides"""
    CONFIG_TYPES = [
        ('STRING', 'String'),
        ('NUMBER', 'Number'),
        ('BOOLEAN', 'Boolean'),
        ('JSON', 'JSON Object'),
        ('LIST', 'List'),
        ('SECRET', 'Secret/Encrypted'),
    ]
    
    key = models.CharField(max_length=100)
    value = models.TextField()
    value_type = models.CharField(max_length=20, choices=CONFIG_TYPES, default='STRING')
    module = models.CharField(max_length=50, default='SYSTEM')
    category = models.CharField(max_length=50, default='GENERAL')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True, related_name='configs')
    description = models.TextField(blank=True)
    is_sensitive = models.BooleanField(default=False)
    is_branch_overridable = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    version = models.IntegerField(default=1)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_configs')
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='updated_configs')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['key', 'branch']
        ordering = ['module', 'category', 'key']

    def __str__(self):
        branch_str = f" ({self.branch.code})" if self.branch else " (Global)"
        return f"{self.key}{branch_str}"


class SystemConfigHistory(models.Model):
    """Version history for system configurations"""
    config = models.ForeignKey(SystemConfig, on_delete=models.CASCADE, related_name='history')
    old_value = models.TextField()
    new_value = models.TextField()
    version = models.IntegerField()
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    change_reason = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-changed_at']


class WorkflowConfig(models.Model):
    """Configurable workflow definitions"""
    WORKFLOW_TYPES = [
        ('SERVICE', 'Service Operations'),
        ('APPROVAL', 'Approval Flow'),
        ('INVENTORY', 'Inventory'),
        ('ACCOUNTS', 'Accounts & Finance'),
        ('HR', 'Human Resources'),
        ('CRM', 'CRM'),
        ('CONTRACT', 'Contracts'),
    ]
    
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    workflow_type = models.CharField(max_length=20, choices=WORKFLOW_TYPES)
    description = models.TextField(blank=True)
    stages = models.JSONField(default=list)
    transitions = models.JSONField(default=dict)
    stage_permissions = models.JSONField(default=dict)
    mandatory_fields = models.JSONField(default=dict)
    sla_config = models.JSONField(default=dict)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True, related_name='workflow_configs')
    is_active = models.BooleanField(default=True)
    version = models.IntegerField(default=1)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_workflows')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.workflow_type})"


class ApprovalRule(models.Model):
    """Dynamic approval rules configuration"""
    APPROVAL_TYPES = [
        ('SEQUENTIAL', 'Sequential'),
        ('PARALLEL', 'Parallel'),
        ('ANY', 'Any Approver'),
        ('HIERARCHY', 'Hierarchical'),
    ]
    
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    module = models.CharField(max_length=50)
    entity_type = models.CharField(max_length=50)
    approval_type = models.CharField(max_length=20, choices=APPROVAL_TYPES, default='SEQUENTIAL')
    levels = models.JSONField(default=list)
    conditions = models.JSONField(default=dict)
    auto_approve_threshold = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    escalation_hours = models.IntegerField(default=24)
    escalation_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='escalated_approvals')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True, related_name='approval_rules')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.module}"


class NotificationTemplate(models.Model):
    """Notification message templates - enhanced for enterprise notification center"""
    CHANNELS = [
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
        ('WHATSAPP', 'WhatsApp'),
        ('PUSH', 'Push Notification'),
        ('IN_APP', 'In-App Notification'),
    ]
    TEMPLATE_STATUS = [
        ('DRAFT', 'Draft'),
        ('ACTIVE', 'Active'),
        ('ARCHIVED', 'Archived'),
    ]
    
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    event = models.ForeignKey('NotificationEvent', on_delete=models.SET_NULL, null=True, blank=True, related_name='templates')
    channel = models.CharField(max_length=20, choices=CHANNELS)
    subject = models.CharField(max_length=500, blank=True)
    body = models.TextField()
    body_html = models.TextField(blank=True, help_text="HTML content for email notifications")
    variables = models.JSONField(default=list)
    language = models.CharField(max_length=10, default='en')
    status = models.CharField(max_length=20, choices=TEMPLATE_STATUS, default='ACTIVE')
    is_default = models.BooleanField(default=False, help_text="Default template for event+channel+language")
    version = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_templates')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.channel})"

    def extract_variables(self):
        """Extract all {{variable}} placeholders from content"""
        import re
        pattern = r'\{\{(\w+)\}\}'
        return list(set(re.findall(pattern, self.body + (self.subject or ''))))


class NotificationRule(models.Model):
    """Event-based notification configuration - enhanced with trigger rules"""
    DELAY_UNITS = [
        ('MINUTES', 'Minutes'),
        ('HOURS', 'Hours'),
        ('DAYS', 'Days'),
    ]
    
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    event = models.ForeignKey('NotificationEvent', on_delete=models.SET_NULL, null=True, blank=True, related_name='rules')
    event_type = models.CharField(max_length=100)
    module = models.CharField(max_length=50)
    template = models.ForeignKey(NotificationTemplate, on_delete=models.CASCADE, related_name='rules')
    recipient_roles = models.JSONField(default=list)
    recipient_users = models.ManyToManyField(User, blank=True, related_name='notification_rules')
    conditions = models.JSONField(default=dict)
    delay_value = models.IntegerField(default=0, help_text="Delay before sending (0 = immediate)")
    delay_unit = models.CharField(max_length=10, choices=DELAY_UNITS, default='MINUTES')
    delay_minutes = models.IntegerField(default=0)
    retry_count = models.IntegerField(default=3)
    retry_interval = models.IntegerField(default=30, help_text="Retry interval in minutes")
    business_hours_only = models.BooleanField(default=False)
    skip_holidays = models.BooleanField(default=False)
    is_escalation = models.BooleanField(default=False)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True, related_name='notification_rules')
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_notification_rules')
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.event_type}"


class AutomationRule(models.Model):
    """IF-THEN automation rules engine"""
    TRIGGER_TYPES = [
        ('EVENT', 'Event Based'),
        ('SCHEDULE', 'Scheduled'),
        ('CONDITION', 'Condition Based'),
        ('THRESHOLD', 'Threshold Based'),
    ]
    
    ACTION_TYPES = [
        ('NOTIFY', 'Send Notification'),
        ('ASSIGN', 'Auto Assign'),
        ('UPDATE', 'Update Field'),
        ('CREATE', 'Create Record'),
        ('ESCALATE', 'Escalate'),
        ('WEBHOOK', 'Call Webhook'),
        ('WORKFLOW', 'Trigger Workflow'),
    ]
    
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    module = models.CharField(max_length=50)
    trigger_type = models.CharField(max_length=20, choices=TRIGGER_TYPES)
    trigger_event = models.CharField(max_length=100, blank=True)
    trigger_schedule = models.CharField(max_length=100, blank=True)
    conditions = models.JSONField(default=list)
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES)
    action_config = models.JSONField(default=dict)
    priority = models.IntegerField(default=0)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True, related_name='automation_rules')
    is_active = models.BooleanField(default=True)
    last_triggered = models.DateTimeField(null=True, blank=True)
    trigger_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-priority', 'name']

    def __str__(self):
        return f"{self.name} ({self.trigger_type})"


class DelegationRule(models.Model):
    """Temporary role delegation and acting manager configuration"""
    delegator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='delegations_given')
    delegate = models.ForeignKey(User, on_delete=models.CASCADE, related_name='delegations_received')
    roles = models.JSONField(default=list)
    permissions = models.JSONField(default=list)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    reason = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='delegation_approvals')
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return f"{self.delegator.username} -> {self.delegate.username}"


class BranchHolidayCalendar(models.Model):
    """Branch-specific holiday calendar entries"""
    HOLIDAY_TYPES = [
        ('PUBLIC', 'Public Holiday'),
        ('OPTIONAL', 'Optional Holiday'),
        ('RESTRICTED', 'Restricted Holiday'),
        ('COMPANY', 'Company Holiday'),
    ]
    
    name = models.CharField(max_length=100)
    date = models.DateField()
    holiday_type = models.CharField(max_length=20, choices=HOLIDAY_TYPES, default='PUBLIC')
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True, related_name='holiday_calendar_entries')
    is_half_day = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    year = models.IntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        unique_together = ['date', 'branch']
        ordering = ['date']
        verbose_name = "Holiday Calendar Entry"
        verbose_name_plural = "Holiday Calendar Entries"

    def __str__(self):
        return f"{self.name} - {self.date}"


class OperatingHours(models.Model):
    """Branch operating hours configuration"""
    DAYS = [
        ('MON', 'Monday'),
        ('TUE', 'Tuesday'),
        ('WED', 'Wednesday'),
        ('THU', 'Thursday'),
        ('FRI', 'Friday'),
        ('SAT', 'Saturday'),
        ('SUN', 'Sunday'),
    ]
    
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='operating_hours')
    day = models.CharField(max_length=3, choices=DAYS)
    is_open = models.BooleanField(default=True)
    open_time = models.TimeField(null=True, blank=True)
    close_time = models.TimeField(null=True, blank=True)
    break_start = models.TimeField(null=True, blank=True)
    break_end = models.TimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['branch', 'day']
        ordering = ['branch', 'day']

    def __str__(self):
        return f"{self.branch.code} - {self.day}"


class SLAConfig(models.Model):
    """SLA configuration for various service types"""
    PRIORITY_LEVELS = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    module = models.CharField(max_length=50)
    entity_type = models.CharField(max_length=50)
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, default='MEDIUM')
    response_hours = models.IntegerField(default=4)
    resolution_hours = models.IntegerField(default=24)
    escalation_levels = models.JSONField(default=list)
    penalty_config = models.JSONField(default=dict)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, null=True, blank=True, related_name='sla_configs')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.priority})"


class ConfigAuditLog(models.Model):
    """Immutable audit log for all configuration changes"""
    ACTION_TYPES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
        ('ACTIVATE', 'Activated'),
        ('DEACTIVATE', 'Deactivated'),
        ('ROLLBACK', 'Rolled Back'),
    ]
    
    entity_type = models.CharField(max_length=50)
    entity_id = models.IntegerField()
    entity_name = models.CharField(max_length=255)
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    old_values = models.JSONField(default=dict)
    new_values = models.JSONField(default=dict)
    change_summary = models.TextField(blank=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} {self.entity_type} #{self.entity_id}"


class MenuConfig(models.Model):
    """Menu structure configuration for dynamic navigation"""
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    module = models.CharField(max_length=50)
    icon = models.CharField(max_length=50, blank=True)
    path = models.CharField(max_length=255)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    display_order = models.IntegerField(default=0)
    required_roles = models.JSONField(default=list)
    is_visible = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']

    def __str__(self):
        return f"{self.module} - {self.name}"


class FeatureFlag(models.Model):
    """Feature flags for controlled rollout"""
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    is_enabled = models.BooleanField(default=False)
    enabled_roles = models.JSONField(default=list)
    enabled_branches = models.ManyToManyField(Branch, blank=True, related_name='feature_flags')
    rollout_percentage = models.IntegerField(default=100)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        status = "Enabled" if self.is_enabled else "Disabled"
        return f"{self.name} ({status})"


class Currency(models.Model):
    """Supported currencies for the system"""
    code = models.CharField(max_length=3, unique=True)
    name = models.CharField(max_length=100)
    symbol = models.CharField(max_length=10)
    decimal_places = models.IntegerField(default=2)
    exchange_rate = models.DecimalField(max_digits=12, decimal_places=6, default=1.000000)
    is_base_currency = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Currencies"
        ordering = ['display_order', 'code']

    def __str__(self):
        return f"{self.code} - {self.name}"


class Language(models.Model):
    """Supported languages for the system"""
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    native_name = models.CharField(max_length=100)
    direction = models.CharField(max_length=3, choices=[('ltr', 'Left to Right'), ('rtl', 'Right to Left')], default='ltr')
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']

    def __str__(self):
        return f"{self.code} - {self.name}"


class SystemPreference(models.Model):
    """System-wide preferences for currency and language"""
    PREFERENCE_TYPES = [
        ('CURRENCY', 'Currency'),
        ('LANGUAGE', 'Language'),
        ('TIMEZONE', 'Timezone'),
        ('DATE_FORMAT', 'Date Format'),
        ('NUMBER_FORMAT', 'Number Format'),
    ]
    
    key = models.CharField(max_length=50, unique=True)
    preference_type = models.CharField(max_length=20, choices=PREFERENCE_TYPES)
    value = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.key}: {self.value}"


class NotificationModule(models.TextChoices):
    SERVICE = 'SERVICE', 'Service & Workflow'
    CRM = 'CRM', 'Customer Relations'
    INVENTORY = 'INVENTORY', 'Inventory & Supplier'
    ACCOUNTS = 'ACCOUNTS', 'Accounts & Finance'
    CONTRACTS = 'CONTRACTS', 'Contracts'
    HR = 'HR', 'Human Resources'
    SYSTEM = 'SYSTEM', 'System'


class NotificationTriggerType(models.TextChoices):
    TIME_BASED = 'TIME_BASED', 'Time Based'
    STATUS_BASED = 'STATUS_BASED', 'Status Based'
    SLA_BASED = 'SLA_BASED', 'SLA Based'
    RECURRING = 'RECURRING', 'Recurring'
    MANUAL = 'MANUAL', 'Manual'


class NotificationChannel(models.TextChoices):
    SMS = 'SMS', 'SMS'
    WHATSAPP = 'WHATSAPP', 'WhatsApp'
    EMAIL = 'EMAIL', 'Email'
    PUSH = 'PUSH', 'Push Notification'
    IN_APP = 'IN_APP', 'In-App Notification'


class NotificationRecipientType(models.TextChoices):
    CUSTOMER = 'CUSTOMER', 'Customer'
    SUPPLIER = 'SUPPLIER', 'Supplier'
    TECHNICIAN = 'TECHNICIAN', 'Technician'
    SERVICE_ADVISOR = 'SERVICE_ADVISOR', 'Service Advisor'
    MANAGER = 'MANAGER', 'Manager'
    ACCOUNTS_TEAM = 'ACCOUNTS_TEAM', 'Accounts Team'
    HR_TEAM = 'HR_TEAM', 'HR Team'
    BRANCH_BASED = 'BRANCH_BASED', 'Branch Based'
    ROLE_BASED = 'ROLE_BASED', 'Role Based'
    SPECIFIC_USER = 'SPECIFIC_USER', 'Specific User'


class NotificationDeliveryStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    QUEUED = 'QUEUED', 'Queued'
    SENT = 'SENT', 'Sent'
    DELIVERED = 'DELIVERED', 'Delivered'
    FAILED = 'FAILED', 'Failed'
    BOUNCED = 'BOUNCED', 'Bounced'
    CANCELLED = 'CANCELLED', 'Cancelled'


class NotificationEvent(models.Model):
    """Master list of notification events - defines WHEN notifications can be triggered"""
    code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    module = models.CharField(max_length=20, choices=NotificationModule.choices)
    trigger_type = models.CharField(max_length=20, choices=NotificationTriggerType.choices, default=NotificationTriggerType.STATUS_BASED)
    trigger_condition = models.TextField(blank=True, help_text="Description of when this event is triggered")
    available_variables = models.JSONField(default=list, help_text="List of variable names available for this event")
    is_active = models.BooleanField(default=True)
    is_system_event = models.BooleanField(default=False, help_text="System events cannot be deleted")
    display_order = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_notification_events')

    class Meta:
        ordering = ['module', 'display_order', 'name']

    def __str__(self):
        return f"[{self.module}] {self.name}"


class NotificationChannelConfig(models.Model):
    """Per-event channel configuration - which channels are enabled for which events"""
    event = models.ForeignKey(NotificationEvent, on_delete=models.CASCADE, related_name='channel_configs')
    channel = models.CharField(max_length=20, choices=NotificationChannel.choices)
    is_enabled = models.BooleanField(default=True)
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL, null=True, blank=True, related_name='channel_configs')
    priority = models.IntegerField(default=1, help_text="1=highest priority")
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        unique_together = [['event', 'channel']]
        ordering = ['event', 'priority']

    def __str__(self):
        status = "Enabled" if self.is_enabled else "Disabled"
        return f"{self.event.name} via {self.channel} ({status})"


class NotificationRecipientRule(models.Model):
    """Recipient configuration - WHO receives notifications"""
    event = models.ForeignKey(NotificationEvent, on_delete=models.CASCADE, related_name='recipient_rules')
    name = models.CharField(max_length=200)
    recipient_type = models.CharField(max_length=20, choices=NotificationRecipientType.choices)
    is_primary = models.BooleanField(default=True)
    is_cc = models.BooleanField(default=False)
    specific_roles = models.JSONField(default=list, help_text="List of role codes for ROLE_BASED type")
    specific_branches = models.ManyToManyField(Branch, blank=True, related_name='notification_recipient_rules')
    specific_users = models.ManyToManyField(User, blank=True, related_name='notification_recipient_rules')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_recipient_rules')

    class Meta:
        ordering = ['event', '-is_primary', 'name']

    def __str__(self):
        return f"{self.event.name} -> {self.recipient_type}"


class NotificationEscalationRule(models.Model):
    """Escalation rules - what happens when notification fails or SLA breached"""
    event = models.ForeignKey(NotificationEvent, on_delete=models.CASCADE, related_name='escalation_rules')
    name = models.CharField(max_length=200)
    escalation_level = models.IntegerField(default=1)
    escalation_after_minutes = models.IntegerField(default=60)
    escalation_condition = models.CharField(max_length=50, choices=[
        ('DELIVERY_FAILED', 'Delivery Failed'),
        ('NO_RESPONSE', 'No Response'),
        ('SLA_BREACH', 'SLA Breach'),
        ('RETRY_EXHAUSTED', 'Retry Exhausted'),
    ], default='DELIVERY_FAILED')
    escalate_to_roles = models.JSONField(default=list)
    escalate_to_users = models.ManyToManyField(User, blank=True, related_name='escalation_notifications')
    fallback_channel = models.CharField(max_length=20, choices=NotificationChannel.choices, blank=True)
    notify_original_recipient = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['event', 'escalation_level']
        unique_together = [['event', 'escalation_level']]

    def __str__(self):
        return f"{self.event.name} - Level {self.escalation_level}"


class NotificationQueue(models.Model):
    """Queue for pending notifications"""
    event = models.ForeignKey(NotificationEvent, on_delete=models.CASCADE, related_name='queued_notifications')
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL, null=True)
    channel = models.CharField(max_length=20, choices=NotificationChannel.choices)
    recipient_type = models.CharField(max_length=20, choices=NotificationRecipientType.choices)
    recipient_email = models.EmailField(blank=True)
    recipient_phone = models.CharField(max_length=20, blank=True)
    recipient_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='queued_notifications')
    context_data = models.JSONField(default=dict, help_text="Variable values for template rendering")
    reference_type = models.CharField(max_length=50, blank=True, help_text="e.g., JobCard, Invoice")
    reference_id = models.IntegerField(null=True, blank=True)
    scheduled_at = models.DateTimeField(default=timezone.now)
    priority = models.IntegerField(default=5)
    status = models.CharField(max_length=20, choices=NotificationDeliveryStatus.choices, default=NotificationDeliveryStatus.PENDING)
    retry_count = models.IntegerField(default=0)
    max_retries = models.IntegerField(default=3)
    last_attempt_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['priority', 'scheduled_at']

    def __str__(self):
        return f"{self.event.name} to {self.recipient_email or self.recipient_phone} ({self.status})"


class NotificationLog(models.Model):
    """Immutable log of all sent notifications"""
    log_number = models.CharField(max_length=50, unique=True, editable=False)
    event = models.ForeignKey(NotificationEvent, on_delete=models.SET_NULL, null=True, related_name='logs')
    event_code = models.CharField(max_length=50)
    event_name = models.CharField(max_length=200)
    template = models.ForeignKey(NotificationTemplate, on_delete=models.SET_NULL, null=True, related_name='logs')
    template_name = models.CharField(max_length=200, blank=True)
    channel = models.CharField(max_length=20, choices=NotificationChannel.choices)
    recipient_type = models.CharField(max_length=20, choices=NotificationRecipientType.choices)
    recipient_name = models.CharField(max_length=200, blank=True)
    recipient_email = models.EmailField(blank=True)
    recipient_phone = models.CharField(max_length=20, blank=True)
    recipient_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='notification_logs')
    subject = models.CharField(max_length=500, blank=True)
    content_rendered = models.TextField(help_text="Final rendered message content")
    context_data = models.JSONField(default=dict)
    reference_type = models.CharField(max_length=50, blank=True)
    reference_id = models.IntegerField(null=True, blank=True)
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=NotificationDeliveryStatus.choices)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    failed_at = models.DateTimeField(null=True, blank=True)
    failure_reason = models.TextField(blank=True)
    retry_count = models.IntegerField(default=0)
    external_message_id = models.CharField(max_length=200, blank=True, help_text="ID from SMS/Email provider")
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.log_number} - {self.event_name} ({self.status})"

    def save(self, *args, **kwargs):
        if not self.log_number:
            prefix = "NL"
            date_str = timezone.now().strftime('%Y%m%d')
            last_log = NotificationLog.objects.filter(log_number__startswith=f"{prefix}{date_str}").order_by('-log_number').first()
            if last_log:
                last_num = int(last_log.log_number[-4:])
                self.log_number = f"{prefix}{date_str}{(last_num + 1):04d}"
            else:
                self.log_number = f"{prefix}{date_str}0001"
        super().save(*args, **kwargs)


class NotificationAuditLog(models.Model):
    """Audit trail for all notification configuration changes"""
    ACTION_TYPES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('ACTIVATE', 'Activate'),
        ('DEACTIVATE', 'Deactivate'),
        ('TEST_SEND', 'Test Send'),
    ]
    
    entity_type = models.CharField(max_length=50, help_text="NotificationEvent, NotificationTemplate, etc.")
    entity_id = models.IntegerField()
    entity_name = models.CharField(max_length=200)
    action = models.CharField(max_length=20, choices=ACTION_TYPES)
    changes = models.JSONField(default=dict, help_text="Before/after values")
    reason = models.TextField(blank=True)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='notification_audit_actions')
    performed_by_name = models.CharField(max_length=200, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.action} {self.entity_type} #{self.entity_id} by {self.performed_by_name}"

    def save(self, *args, **kwargs):
        if self.performed_by and not self.performed_by_name:
            self.performed_by_name = self.performed_by.get_full_name() or self.performed_by.username
        super().save(*args, **kwargs)


