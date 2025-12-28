from django.db import models
from django.contrib.auth.models import User


class UserRole(models.TextChoices):
    OWNER = 'OWNER', 'Owner'
    MANAGER = 'MANAGER', 'Manager'
    ADVISOR = 'ADVISOR', 'Advisor'
    TECHNICIAN = 'TECHNICIAN', 'Technician'
    ACCOUNTS = 'ACCOUNTS', 'Accounts'
    INVENTORY = 'INVENTORY', 'Inventory'
    CUSTOMER = 'CUSTOMER', 'Customer'


class JobStatus(models.TextChoices):
    APPOINTED = 'APPOINTED', 'Appointed'
    CHECKED_IN = 'CHECKED_IN', 'Checked In'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    ON_HOLD = 'ON_HOLD', 'On Hold'
    QC_PENDING = 'QC_PENDING', 'QC Pending'
    READY_FOR_DELIVERY = 'READY_FOR_DELIVERY', 'Ready for Delivery'
    DELIVERED = 'DELIVERED', 'Delivered'


class TaskStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending'
    IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
    COMPLETED = 'COMPLETED', 'Completed'
    REJECTED = 'REJECTED', 'Rejected'


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.CUSTOMER)
    branch_id = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    utilization = models.IntegerField(default=0)
    avatar = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.role}"


class Customer(models.Model):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
    loyalty_points = models.IntegerField(default=0)
    address = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Vehicle(models.Model):
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='vehicles')
    vin = models.CharField(max_length=100, unique=True)
    plate_number = models.CharField(max_length=20)
    make = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    year = models.IntegerField(blank=True, null=True)
    color = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.year} {self.make} {self.model} - {self.plate_number}"


class Part(models.Model):
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100)
    stock = models.IntegerField(default=0)
    min_stock = models.IntegerField(default=5)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    reserved = models.IntegerField(default=0)
    location = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"

    @property
    def available_stock(self):
        return self.stock - self.reserved

    @property
    def is_low_stock(self):
        return self.available_stock <= self.min_stock


class JobCard(models.Model):
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='job_cards')
    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='job_cards')
    advisor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='advised_jobs')
    technician = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_jobs')
    status = models.CharField(max_length=20, choices=JobStatus.choices, default=JobStatus.APPOINTED)
    estimated_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    actual_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    sla_deadline = models.DateTimeField(null=True, blank=True)
    ai_summary = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"JC-{self.id} - {self.vehicle}"


class Task(models.Model):
    job_card = models.ForeignKey(JobCard, on_delete=models.CASCADE, related_name='tasks')
    description = models.TextField()
    status = models.CharField(max_length=20, choices=TaskStatus.choices, default=TaskStatus.PENDING)
    is_completed = models.BooleanField(default=False)
    labor_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.description[:50]} - {self.status}"


class TaskPart(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='parts_used')
    part = models.ForeignKey(Part, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    is_reserved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.part.name} x {self.quantity}"


class TimelineEventType(models.TextChoices):
    STATUS_CHANGE = 'STATUS_CHANGE', 'Status Change'
    TASK_LOG = 'TASK_LOG', 'Task Log'
    COMMUNICATION = 'COMMUNICATION', 'Communication'
    APPROVAL = 'APPROVAL', 'Approval'
    SYSTEM = 'SYSTEM', 'System'
    AI_INSIGHT = 'AI_INSIGHT', 'AI Insight'


class TimelineEvent(models.Model):
    job_card = models.ForeignKey(JobCard, on_delete=models.CASCADE, related_name='timeline_events')
    event_type = models.CharField(max_length=20, choices=TimelineEventType.choices)
    status = models.CharField(max_length=100, blank=True, null=True)
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=20, choices=UserRole.choices, null=True, blank=True)
    comment = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.event_type} - {self.timestamp}"
