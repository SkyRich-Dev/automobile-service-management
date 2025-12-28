from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
import uuid


class UserRole(models.TextChoices):
    SUPER_ADMIN = 'SUPER_ADMIN', 'Super Admin'
    CEO_OWNER = 'CEO_OWNER', 'CEO / Owner'
    REGIONAL_MANAGER = 'REGIONAL_MANAGER', 'Regional Manager'
    BRANCH_MANAGER = 'BRANCH_MANAGER', 'Branch Manager'
    SERVICE_ADVISOR = 'SERVICE_ADVISOR', 'Service Advisor'
    SALES_EXECUTIVE = 'SALES_EXECUTIVE', 'Sales Executive'
    INVENTORY_MANAGER = 'INVENTORY_MANAGER', 'Inventory Manager'
    ACCOUNTS_OFFICER = 'ACCOUNTS_OFFICER', 'Accounts Officer'
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


class Permission(models.Model):
    code = models.CharField(max_length=100, unique=True)
    name = models.CharField(max_length=255)
    module = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    def __str__(self):
        return f"{self.module}.{self.code}"


class RolePermission(models.Model):
    role = models.CharField(max_length=30, choices=UserRole.choices)
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE)
    can_create = models.BooleanField(default=False)
    can_read = models.BooleanField(default=True)
    can_update = models.BooleanField(default=False)
    can_delete = models.BooleanField(default=False)

    class Meta:
        unique_together = ['role', 'permission']

    def __str__(self):
        return f"{self.role} - {self.permission.code}"


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


class Customer(models.Model):
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='customer_profile')
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True, related_name='customers')
    customer_id = models.CharField(max_length=50, unique=True, blank=True)
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    alternate_phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    gst_number = models.CharField(max_length=50, blank=True, null=True)
    customer_type = models.CharField(max_length=50, default='Individual')
    loyalty_points = models.IntegerField(default=0)
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.TextField(blank=True, null=True)
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


class Part(models.Model):
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE, related_name='parts', null=True, blank=True)
    part_number = models.CharField(max_length=100, unique=True, blank=True, null=True)
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100)
    subcategory = models.CharField(max_length=100, blank=True)
    brand = models.CharField(max_length=100, blank=True)
    is_oem = models.BooleanField(default=True)
    unit = models.CharField(max_length=50, default='Nos')
    cost_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    selling_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    mrp = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18)
    stock = models.IntegerField(default=0)
    min_stock = models.IntegerField(default=5)
    max_stock = models.IntegerField(default=100)
    reserved = models.IntegerField(default=0)
    reorder_quantity = models.IntegerField(default=10)
    location = models.CharField(max_length=100, blank=True, null=True)
    batch_number = models.CharField(max_length=100, blank=True, null=True)
    expiry_date = models.DateField(null=True, blank=True)
    last_purchase_date = models.DateField(null=True, blank=True)
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


class Contract(models.Model):
    contract_number = models.CharField(max_length=50, unique=True, blank=True)
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='contracts')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='contracts')
    contract_type = models.CharField(max_length=30, choices=ContractType.choices)
    provider = models.CharField(max_length=255, blank=True)
    policy_number = models.CharField(max_length=100, blank=True)
    start_date = models.DateField()
    end_date = models.DateField()
    coverage_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deductible = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    premium = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    services_included = models.JSONField(default=list)
    services_used = models.IntegerField(default=0)
    max_services = models.IntegerField(null=True, blank=True)
    terms_conditions = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-end_date']

    def save(self, *args, **kwargs):
        if not self.contract_number:
            prefix = self.contract_type[:3] if self.contract_type else 'CON'
            self.contract_number = f"{prefix}-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        return self.end_date < timezone.now().date()

    @property
    def days_remaining(self):
        delta = self.end_date - timezone.now().date()
        return max(0, delta.days)

    def __str__(self):
        return f"{self.contract_number} - {self.vehicle}"


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
