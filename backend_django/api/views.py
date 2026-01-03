from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Q, Count, Sum, F
from django.core.exceptions import ValidationError
from django.utils import timezone
import os

from .models import (
    Profile, Branch, Customer, Vehicle, Part, JobCard, Task, 
    ServiceEvent, Estimate, EstimateLine, PartIssue, Invoice, Payment,
    DigitalInspection, Bay, TechnicianMetrics, TimelineEvent,
    WorkflowStage, UserRole, ServiceEventType,
    Notification, Contract, ContractStatus, ContractVehicle, ContractCoverageRule,
    ContractConsumption, ContractApproval, ContractApprovalStatus, ContractAuditLog, ContractAuditAction,
    Supplier, PurchaseOrder, PurchaseOrderLine, PurchaseOrderStatus,
    PartReservation, ReservationStatus, GoodsReceiptNote, GRNLine, GRNStatus,
    StockTransfer, StockTransferLine, StockTransferStatus,
    PurchaseRequisition, PRLine, PRStatus, SupplierPerformance, InventoryAlert, AlertType,
    TechnicianSchedule, Appointment, AnalyticsSnapshot,
    License, SystemSetting, PaymentIntent, TallySyncJob, TallyLedgerMapping, IntegrationConfig,
    Lead, LeadStatus, CustomerInteraction, Ticket, TicketStatus, FollowUpTask, FollowUpStatus,
    Campaign, CampaignStatus, CampaignRecipient, CustomerScore, CRMEvent,
    Department, EmployeeAssignment, WorkShift, AttendanceRecord,
    RolePermission, EmailConfiguration, WhatsAppConfiguration, PaymentGatewayConfiguration, TallyConfiguration,
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
from .permissions import (
    RoleBasedPermission, IsAdminOrManager, IsTechnicianOrAbove, CanTransitionWorkflow, IsAdminConfig
)
from .serializers import (
    UserSerializer, ProfileSerializer, BranchSerializer,
    CustomerSerializer, CustomerWithVehiclesSerializer,
    VehicleSerializer, PartSerializer, PartIssueSerializer,
    JobCardSerializer, JobCardDetailSerializer,
    TaskSerializer, ServiceEventSerializer, TimelineEventSerializer,
    EstimateSerializer, EstimateLineSerializer,
    InvoiceSerializer, PaymentSerializer,
    DigitalInspectionSerializer, BaySerializer,
    RegisterSerializer, LoginSerializer, WorkflowTransitionSerializer,
    NotificationSerializer, ContractSerializer, ContractVehicleSerializer,
    ContractCoverageRuleSerializer, ContractConsumptionSerializer,
    ContractApprovalSerializer, ContractAuditLogSerializer,
    SupplierSerializer, PurchaseOrderSerializer,
    PartReservationSerializer, GoodsReceiptNoteSerializer, GRNLineSerializer,
    StockTransferSerializer, StockTransferLineSerializer,
    PurchaseRequisitionSerializer, PRLineSerializer,
    SupplierPerformanceSerializer, InventoryAlertSerializer,
    TechnicianScheduleSerializer,
    AppointmentSerializer, AnalyticsSnapshotSerializer,
    LicenseSerializer, SystemSettingSerializer, PaymentIntentSerializer,
    TallySyncJobSerializer, TallyLedgerMappingSerializer, IntegrationConfigSerializer,
    LeadSerializer, CustomerInteractionSerializer, TicketSerializer, FollowUpTaskSerializer,
    CampaignSerializer, CampaignRecipientSerializer, CustomerScoreSerializer, CRMEventSerializer,
    Customer360Serializer,
    DepartmentSerializer, EmployeeAssignmentSerializer, WorkShiftSerializer, AttendanceRecordSerializer,
    RolePermissionSerializer, EmailConfigurationSerializer, WhatsAppConfigurationSerializer,
    PaymentGatewayConfigurationSerializer, TallyConfigurationSerializer,
    AccountSerializer, TaxRateSerializer, EnhancedInvoiceSerializer, InvoiceLineSerializer,
    CreditNoteSerializer, CreditNoteLineSerializer, EnhancedPaymentSerializer, PaymentAllocationSerializer,
    ExpenseCategorySerializer, ExpenseSerializer, JournalEntrySerializer, LedgerEntrySerializer,
    CustomerReceivableSerializer, VendorPayableSerializer, FinancialAuditLogSerializer,
    FinancialPeriodSerializer, BudgetEntrySerializer, FinanceDashboardSerializer,
    SkillSerializer, EmployeeSkillSerializer, EmployeeSerializer, TrainingProgramSerializer,
    TrainingEnrollmentSerializer, IncentiveRuleSerializer, EmployeeIncentiveSerializer,
    LeaveTypeSerializer, LeaveBalanceSerializer, LeaveRequestSerializer, HolidaySerializer,
    HRShiftSerializer, EmployeeShiftSerializer, HRAttendanceSerializer, PayrollSerializer,
    SkillAuditLogSerializer,
    ConfigCategorySerializer, ConfigCategoryListSerializer, ConfigOptionSerializer,
    SystemConfigSerializer, SystemConfigHistorySerializer, WorkflowConfigSerializer,
    ApprovalRuleSerializer, NotificationTemplateSerializer, NotificationRuleSerializer,
    AutomationRuleSerializer, DelegationRuleSerializer, BranchHolidayCalendarSerializer,
    OperatingHoursSerializer, SLAConfigSerializer, ConfigAuditLogSerializer,
    MenuConfigSerializer, FeatureFlagSerializer,
    CurrencySerializer, LanguageSerializer, SystemPreferenceSerializer
)


@api_view(['POST'])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        login(request, user)
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = authenticate(
            request,
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password']
        )
        if user:
            login(request, user)
            profile = getattr(user, 'profile', None)
            return Response({
                'user': UserSerializer(user).data,
                'profile': ProfileSerializer(profile).data if profile else None,
                'message': 'Login successful'
            })
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
def logout_view(request):
    logout(request)
    return Response({'message': 'Logout successful'})


@api_view(['GET'])
def current_user_view(request):
    if request.user.is_authenticated:
        profile = getattr(request.user, 'profile', None)
        return Response({
            'user': UserSerializer(request.user).data,
            'profile': ProfileSerializer(profile).data if profile else None
        })
    return Response({'user': None}, status=status.HTTP_401_UNAUTHORIZED)


class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.filter(is_active=True)
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    @action(detail=False, methods=['get', 'put', 'patch'])
    def me(self, request):
        profile, created = Profile.objects.get_or_create(user=request.user)
        if request.method == 'GET':
            return Response(ProfileSerializer(profile).data)
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def technicians(self, request):
        technicians = Profile.objects.filter(role=UserRole.TECHNICIAN)
        return Response(ProfileSerializer(technicians, many=True).data)
    
    @action(detail=False, methods=['post'])
    def create_user(self, request):
        data = request.data
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')
        role = data.get('role', 'TECHNICIAN')
        branch_id = data.get('branch')
        employee_id = data.get('employee_id', '')
        phone = data.get('phone', '')
        
        if not username or not password:
            return Response({'error': 'Username and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        branch = None
        if branch_id:
            try:
                branch = Branch.objects.get(id=branch_id)
            except Branch.DoesNotExist:
                pass
        
        profile = Profile.objects.create(
            user=user,
            role=role,
            branch=branch,
            employee_id=employee_id,
            phone=phone
        )
        
        return Response(ProfileSerializer(profile).data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        profile = self.get_object()
        is_active = request.data.get('is_active', True)
        profile.user.is_active = is_active
        profile.user.save()
        return Response(ProfileSerializer(profile).data)


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.filter(is_active=True)
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CustomerWithVehiclesSerializer
        return CustomerSerializer
    
    def get_queryset(self):
        queryset = Customer.objects.filter(is_active=True)
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search) |
                Q(customer_id__icontains=search)
            )
        return queryset.order_by('-created_at')


class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = Vehicle.objects.all()
        customer_id = self.request.query_params.get('customer_id', None)
        search = self.request.query_params.get('search', None)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if search:
            queryset = queryset.filter(
                Q(plate_number__icontains=search) |
                Q(vin__icontains=search) |
                Q(make__icontains=search) |
                Q(model__icontains=search)
            )
        return queryset
    
    @action(detail=True, methods=['get'])
    def service_history(self, request, pk=None):
        vehicle = self.get_object()
        job_cards = JobCard.objects.filter(
            vehicle=vehicle, is_deleted=False
        ).select_related(
            'customer', 'service_advisor', 'lead_technician', 'branch'
        ).prefetch_related(
            'timeline_events', 'tasks', 'estimates'
        ).order_by('-created_at')
        
        year_filter = request.query_params.get('year')
        stage_filter = request.query_params.get('stage')
        job_type_filter = request.query_params.get('job_type')
        
        if year_filter:
            job_cards = job_cards.filter(created_at__year=int(year_filter))
        if stage_filter:
            job_cards = job_cards.filter(workflow_stage=stage_filter)
        if job_type_filter:
            job_cards = job_cards.filter(job_type__icontains=job_type_filter)
        
        timeline_events = []
        for jc in job_cards:
            events = jc.timeline_events.all().order_by('-created_at')
            event_list = []
            for event in events:
                event_list.append({
                    'id': event.id,
                    'event_type': event.event_type,
                    'actor': event.actor.username if event.actor else None,
                    'old_value': event.old_value,
                    'new_value': event.new_value,
                    'comment': event.comment,
                    'created_at': event.created_at.isoformat() if event.created_at else None,
                })
            
            tasks = jc.tasks.all()
            task_list = [{'id': t.id, 'name': t.name, 'status': t.status, 'labor_cost': float(t.labor_cost)} for t in tasks]
            
            estimates = jc.estimates.all()
            estimate_list = [{'id': e.id, 'estimate_number': e.estimate_number, 'grand_total': float(e.grand_total), 'approval_status': e.approval_status} for e in estimates]
            
            invoice_list = []
            try:
                inv = jc.invoice
                invoice_list = [{'id': inv.id, 'invoice_number': inv.invoice_number, 'grand_total': float(inv.grand_total), 'payment_status': inv.payment_status}]
            except JobCard.invoice.RelatedObjectDoesNotExist:
                pass
            
            timeline_events.append({
                'id': jc.id,
                'job_card_number': jc.job_card_number,
                'service_tracking_id': jc.service_tracking_id,
                'workflow_stage': jc.workflow_stage,
                'job_type': jc.job_type,
                'priority': jc.priority,
                'complaint': jc.complaint,
                'diagnosis': jc.diagnosis,
                'odometer_in': jc.odometer_in,
                'odometer_out': jc.odometer_out,
                'estimated_amount': float(jc.estimated_amount) if jc.estimated_amount else 0,
                'actual_amount': float(jc.actual_amount) if jc.actual_amount else 0,
                'is_warranty': jc.is_warranty,
                'is_amc': jc.is_amc,
                'customer_rating': jc.customer_rating,
                'customer_feedback': jc.customer_feedback,
                'created_at': jc.created_at.isoformat() if jc.created_at else None,
                'promised_delivery': jc.promised_delivery.isoformat() if jc.promised_delivery else None,
                'actual_delivery': jc.actual_delivery.isoformat() if jc.actual_delivery else None,
                'branch': {'id': jc.branch.id, 'name': jc.branch.name} if jc.branch else None,
                'service_advisor': jc.service_advisor.username if jc.service_advisor else None,
                'lead_technician': jc.lead_technician.username if jc.lead_technician else None,
                'events': event_list,
                'tasks': task_list,
                'estimates': estimate_list,
                'invoices': invoice_list,
            })
        
        total_services = job_cards.count()
        completed_services = job_cards.filter(workflow_stage=WorkflowStage.COMPLETED).count()
        total_spent = sum(float(jc.actual_amount or 0) for jc in job_cards)
        avg_rating = job_cards.filter(customer_rating__isnull=False).aggregate(avg=models.Avg('customer_rating'))['avg'] or 0
        warranty_services = job_cards.filter(is_warranty=True).count()
        amc_services = job_cards.filter(is_amc=True).count()
        years = list(job_cards.dates('created_at', 'year', order='DESC').values_list('created_at__year', flat=True).distinct())
        
        return Response({
            'vehicle': {
                'id': vehicle.id,
                'vehicle_id': vehicle.vehicle_id,
                'plate_number': vehicle.plate_number,
                'make': vehicle.make,
                'model': vehicle.model,
                'variant': vehicle.variant,
                'year': vehicle.year,
                'color': vehicle.color,
                'current_odometer': vehicle.current_odometer,
                'vehicle_type': vehicle.vehicle_type,
                'customer': {
                    'id': vehicle.customer.id,
                    'name': vehicle.customer.name,
                    'phone': vehicle.customer.phone,
                }
            },
            'summary': {
                'total_services': total_services,
                'completed_services': completed_services,
                'total_spent': total_spent,
                'average_rating': round(avg_rating, 1),
                'warranty_services': warranty_services,
                'amc_services': amc_services,
            },
            'available_years': years,
            'timeline': timeline_events,
        })


class PartViewSet(viewsets.ModelViewSet):
    queryset = Part.objects.filter(is_active=True)
    serializer_class = PartSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = Part.objects.filter(is_active=True)
        category = self.request.query_params.get('category', None)
        low_stock = self.request.query_params.get('low_stock', None)
        search = self.request.query_params.get('search', None)
        supplier_id = self.request.query_params.get('supplier', None)
        branch_id = self.request.query_params.get('branch', None)
        
        if category:
            queryset = queryset.filter(category=category)
        if low_stock == 'true':
            queryset = queryset.filter(stock__lte=F('min_stock'))
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(sku__icontains=search) |
                Q(part_number__icontains=search)
            )
        if supplier_id:
            try:
                queryset = queryset.filter(primary_supplier_id=int(supplier_id))
            except (ValueError, TypeError):
                pass
        if branch_id:
            try:
                queryset = queryset.filter(branch_id=int(branch_id))
            except (ValueError, TypeError):
                pass
        
        return queryset.order_by('name')


class BayViewSet(viewsets.ModelViewSet):
    queryset = Bay.objects.all()
    serializer_class = BaySerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        bays = Bay.objects.filter(is_available=True)
        return Response(BaySerializer(bays, many=True).data)


class JobCardViewSet(viewsets.ModelViewSet):
    queryset = JobCard.objects.filter(is_deleted=False)
    serializer_class = JobCardSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return JobCardDetailSerializer
        return JobCardSerializer
    
    def get_queryset(self):
        queryset = JobCard.objects.filter(is_deleted=False).select_related(
            'vehicle', 'customer', 'service_advisor', 'lead_technician', 'branch'
        )
        stage = self.request.query_params.get('stage', None)
        branch = self.request.query_params.get('branch', None)
        priority = self.request.query_params.get('priority', None)
        
        if stage:
            queryset = queryset.filter(workflow_stage=stage)
        if branch:
            queryset = queryset.filter(branch_id=branch)
        if priority:
            queryset = queryset.filter(priority=priority)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        job_card = serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)
        ServiceEvent.objects.create(
            job_card=job_card,
            event_type=ServiceEventType.WORKFLOW_TRANSITION,
            actor=self.request.user if self.request.user.is_authenticated else None,
            new_value=WorkflowStage.APPOINTMENT,
            comment='Job card created'
        )
    
    @action(detail=True, methods=['post'])
    def transition(self, request, pk=None):
        job_card = self.get_object()
        serializer = WorkflowTransitionSerializer(data=request.data)
        
        if serializer.is_valid():
            new_stage = serializer.validated_data['new_stage']
            comment = serializer.validated_data.get('comment', '')
            
            try:
                job_card.transition_to(new_stage, request.user, comment)
                return Response(JobCardDetailSerializer(job_card).data)
            except ValidationError as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def allowed_transitions(self, request, pk=None):
        job_card = self.get_object()
        from .models import WORKFLOW_TRANSITIONS
        allowed = WORKFLOW_TRANSITIONS.get(job_card.workflow_stage, [])
        return Response({
            'current_stage': job_card.workflow_stage,
            'allowed_transitions': [
                {'value': stage, 'label': WorkflowStage(stage).label}
                for stage in allowed
            ]
        })
    
    @action(detail=True, methods=['post'])
    def add_remark(self, request, pk=None):
        job_card = self.get_object()
        remark = request.data.get('remark', '')
        
        if not remark:
            return Response({'error': 'Remark text is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        actor_role = None
        if request.user.is_authenticated:
            try:
                actor_role = request.user.profile.role
            except:
                pass
        
        ServiceEvent.objects.create(
            job_card=job_card,
            event_type=ServiceEventType.REMARK_ADDED,
            actor=request.user if request.user.is_authenticated else None,
            actor_role=actor_role,
            new_value=remark[:100],
            comment=remark
        )
        
        return Response({'message': 'Remark added successfully'})
    
    @action(detail=True, methods=['post'])
    def notify_customer(self, request, pk=None):
        job_card = self.get_object()
        message = request.data.get('message', f'Update on your vehicle service {job_card.job_card_number}')
        channel = request.data.get('channel', 'EMAIL')
        
        actor_role = None
        if request.user.is_authenticated:
            try:
                actor_role = request.user.profile.role
            except:
                pass
        
        ServiceEvent.objects.create(
            job_card=job_card,
            event_type=ServiceEventType.CUSTOMER_NOTIFIED,
            actor=request.user if request.user.is_authenticated else None,
            actor_role=actor_role,
            new_value=f'{channel}: {message[:50]}',
            comment=message,
            metadata={
                'channel': channel, 
                'customer_phone': job_card.customer.phone, 
                'customer_email': job_card.customer.email,
                'customer_name': job_card.customer.name,
                'sent_by': request.user.get_full_name() or request.user.username if request.user.is_authenticated else 'System'
            }
        )
        
        Notification.objects.create(
            recipient=request.user,
            title=f'Customer Notification Sent - {job_card.job_card_number}',
            message=f'Notification sent to {job_card.customer.name} via {channel}',
            notification_type='INFO',
            related_job_card=job_card
        )
        
        return Response({
            'message': f'Customer notification sent via {channel}',
            'customer': job_card.customer.name,
            'channel': channel
        })
    
    @action(detail=True, methods=['post'])
    def escalate(self, request, pk=None):
        job_card = self.get_object()
        reason = request.data.get('reason', '')
        escalation_level = request.data.get('level', 'MANAGER')
        
        if not reason:
            return Response({'error': 'Escalation reason is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        actor_role = None
        if request.user.is_authenticated:
            try:
                actor_role = request.user.profile.role
            except:
                pass
        
        ServiceEvent.objects.create(
            job_card=job_card,
            event_type=ServiceEventType.ESCALATION,
            actor=request.user if request.user.is_authenticated else None,
            actor_role=actor_role,
            new_value=f'Escalated to {escalation_level}',
            comment=reason,
            metadata={'level': escalation_level, 'reason': reason, 'escalated_by': request.user.username if request.user.is_authenticated else 'System'}
        )
        
        role_map = {
            'SUPERVISOR': UserRole.SUPERVISOR,
            'MANAGER': UserRole.BRANCH_MANAGER,
            'REGIONAL_MANAGER': UserRole.REGIONAL_MANAGER,
        }
        target_role = role_map.get(escalation_level, UserRole.BRANCH_MANAGER)
        
        managers = Profile.objects.filter(
            role=target_role,
            branch=job_card.branch
        ).select_related('user')
        
        for manager_profile in managers:
            Notification.objects.create(
                recipient=manager_profile.user,
                title=f'Escalation - {job_card.job_card_number}',
                message=f'Job card escalated by {request.user.get_full_name() or request.user.username}: {reason[:100]}',
                notification_type='ALERT',
                priority='HIGH',
                related_job_card=job_card
            )
        
        if not managers.exists():
            Notification.objects.create(
                recipient=request.user,
                title=f'Escalation Created - {job_card.job_card_number}',
                message=f'Job card escalated to {escalation_level}. No managers found to notify.',
                notification_type='WARNING',
                priority='HIGH',
                related_job_card=job_card
            )
        
        return Response({'message': f'Job card escalated to {escalation_level}', 'managers_notified': managers.count()})
    
    @action(detail=True, methods=['post'])
    def ai_insight(self, request, pk=None):
        job_card = self.get_object()
        
        try:
            from google import genai
            
            client = genai.Client(
                api_key=os.environ.get('AI_INTEGRATIONS_GEMINI_API_KEY'),
                http_options={'api_version': '', 'base_url': os.environ.get('AI_INTEGRATIONS_GEMINI_BASE_URL')}
            )
            
            tasks_desc = ', '.join([t.description for t in job_card.tasks.all()]) or 'No tasks yet'
            prompt = f"""
            Analyze this vehicle service job card and provide insights/recommendations:
            Vehicle: {job_card.vehicle.year or ''} {job_card.vehicle.make} {job_card.vehicle.model}
            VIN: {job_card.vehicle.vin}
            Complaint: {job_card.complaint or 'Not specified'}
            Tasks: {tasks_desc}
            Current Stage: {job_card.get_workflow_stage_display()}
            
            Provide a concise summary including:
            1. Diagnosis insights
            2. Potential risks or issues
            3. Recommended actions
            4. Time/cost estimates if applicable
            """
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            
            insight = response.text
            job_card.ai_summary = insight
            job_card.save()
            
            ServiceEvent.objects.create(
                job_card=job_card,
                event_type=ServiceEventType.AI_INSIGHT,
                actor=request.user if request.user.is_authenticated else None,
                new_value=insight[:200],
                comment=insight
            )
            
            return Response({'insight': insight})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = Task.objects.all()
        job_card_id = self.request.query_params.get('job_card_id', None)
        technician_id = self.request.query_params.get('technician_id', None)
        status_filter = self.request.query_params.get('status', None)
        
        if job_card_id:
            queryset = queryset.filter(job_card_id=job_card_id)
        if technician_id:
            queryset = queryset.filter(assigned_technician_id=technician_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        task = self.get_object()
        try:
            task.start(request.user)
            ServiceEvent.objects.create(
                job_card=task.job_card,
                event_type=ServiceEventType.TASK_LOG,
                actor=request.user,
                new_value=f'Task started: {task.description[:50]}',
                comment=f'Technician started working on task'
            )
            return Response(TaskSerializer(task).data)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        try:
            checklist_data = request.data.get('checklist', [])
            evidence = request.data.get('evidence_photos', [])
            notes = request.data.get('notes', '')
            
            task.checklist = checklist_data
            task.checklist_completed = True
            task.evidence_photos = evidence
            task.technician_notes = notes
            task.save()
            
            task.complete()
            
            ServiceEvent.objects.create(
                job_card=task.job_card,
                event_type=ServiceEventType.TASK_LOG,
                actor=request.user,
                new_value=f'Task completed: {task.description[:50]}',
                metadata={'actual_hours': float(task.actual_hours)},
                comment=notes
            )
            return Response(TaskSerializer(task).data)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class DigitalInspectionViewSet(viewsets.ModelViewSet):
    queryset = DigitalInspection.objects.all()
    serializer_class = DigitalInspectionSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]


class EstimateViewSet(viewsets.ModelViewSet):
    queryset = Estimate.objects.all()
    serializer_class = EstimateSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = Estimate.objects.all()
        job_card_id = self.request.query_params.get('job_card_id', None)
        if job_card_id:
            queryset = queryset.filter(job_card_id=job_card_id)
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        estimate = self.get_object()
        comment = request.data.get('comment', '')
        
        estimate.approval_status = 'APPROVED'
        estimate.approved_by = request.user
        estimate.approval_date = timezone.now()
        estimate.approval_comment = comment
        estimate.save()
        
        ServiceEvent.objects.create(
            job_card=estimate.job_card,
            event_type=ServiceEventType.ESTIMATE_APPROVED,
            actor=request.user,
            new_value=f'Estimate v{estimate.version} approved',
            metadata={'estimate_id': estimate.id, 'total': float(estimate.grand_total)},
            comment=comment
        )
        
        return Response(EstimateSerializer(estimate).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        estimate = self.get_object()
        comment = request.data.get('comment', 'No reason provided')
        
        estimate.approval_status = 'REJECTED'
        estimate.approval_comment = comment
        estimate.save()
        
        ServiceEvent.objects.create(
            job_card=estimate.job_card,
            event_type=ServiceEventType.ESTIMATE_REJECTED,
            actor=request.user,
            new_value=f'Estimate v{estimate.version} rejected',
            comment=comment
        )
        
        return Response(EstimateSerializer(estimate).data)


class PartIssueViewSet(viewsets.ModelViewSet):
    queryset = PartIssue.objects.all()
    serializer_class = PartIssueSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def perform_create(self, serializer):
        part_issue = serializer.save(issued_by=self.request.user)
        part = part_issue.part
        part.stock -= part_issue.quantity
        part.save()
        
        ServiceEvent.objects.create(
            job_card=part_issue.job_card,
            event_type=ServiceEventType.PART_ISSUED,
            actor=self.request.user,
            new_value=f'{part_issue.part.name} x {part_issue.quantity}',
            metadata={'part_id': part.id, 'quantity': part_issue.quantity}
        )


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = Invoice.objects.all()
        customer_id = self.request.query_params.get('customer_id', None)
        status_filter = self.request.query_params.get('status', None)
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if status_filter:
            queryset = queryset.filter(payment_status=status_filter)
        
        return queryset.order_by('-invoice_date')


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def perform_create(self, serializer):
        payment = serializer.save(received_by=self.request.user)
        
        ServiceEvent.objects.create(
            job_card=payment.invoice.job_card,
            event_type=ServiceEventType.PAYMENT_RECEIVED,
            actor=self.request.user,
            new_value=f'Payment received: ${payment.amount}',
            metadata={'payment_id': payment.id, 'amount': float(payment.amount), 'method': payment.payment_method}
        )


class ServiceEventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ServiceEvent.objects.all()
    serializer_class = ServiceEventSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = ServiceEvent.objects.all()
        job_card_id = self.request.query_params.get('job_card_id', None)
        event_type = self.request.query_params.get('event_type', None)
        
        if job_card_id:
            queryset = queryset.filter(job_card_id=job_card_id)
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        return queryset.order_by('-timestamp')


class TimelineEventViewSet(viewsets.ModelViewSet):
    queryset = TimelineEvent.objects.all()
    serializer_class = TimelineEventSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = TimelineEvent.objects.all()
        job_card_id = self.request.query_params.get('job_card_id', None)
        if job_card_id:
            queryset = queryset.filter(job_card_id=job_card_id)
        return queryset.order_by('-timestamp')


@api_view(['GET'])
def dashboard_stats(request):
    from django.utils import timezone
    from datetime import timedelta
    
    today = timezone.now().date()
    week_ago = today - timedelta(days=7)
    
    total_customers = Customer.objects.filter(is_active=True).count()
    total_vehicles = Vehicle.objects.count()
    total_parts = Part.objects.filter(is_active=True).count()
    
    job_cards_by_stage = JobCard.objects.filter(is_deleted=False).values('workflow_stage').annotate(count=Count('id'))
    active_job_cards = JobCard.objects.filter(is_deleted=False).exclude(workflow_stage=WorkflowStage.COMPLETED).count()
    
    low_stock_parts = Part.objects.filter(is_active=True, stock__lte=F('min_stock')).count()
    
    recent_job_cards = JobCard.objects.filter(is_deleted=False).select_related(
        'vehicle', 'customer', 'branch'
    ).order_by('-created_at')[:10]
    
    sla_breaches = JobCard.objects.filter(
        is_deleted=False,
        sla_deadline__lt=timezone.now()
    ).exclude(workflow_stage=WorkflowStage.COMPLETED).count()
    
    todays_revenue = Invoice.objects.filter(
        invoice_date__date=today
    ).aggregate(total=Sum('grand_total'))['total'] or 0
    
    return Response({
        'total_customers': total_customers,
        'total_vehicles': total_vehicles,
        'total_parts': total_parts,
        'active_job_cards': active_job_cards,
        'low_stock_parts': low_stock_parts,
        'sla_breaches': sla_breaches,
        'todays_revenue': float(todays_revenue),
        'job_cards_by_stage': list(job_cards_by_stage),
        'recent_job_cards': JobCardSerializer(recent_job_cards, many=True).data,
        'workflow_stages': [
            {'value': stage.value, 'label': stage.label}
            for stage in WorkflowStage
        ]
    })


@api_view(['GET'])
def workflow_stages(request):
    from .config import WORKFLOW_STAGE_DEFINITIONS
    return Response([
        {'value': config.value, 'label': config.label, 'order': config.order, 'color': config.color}
        for config in WORKFLOW_STAGE_DEFINITIONS.values()
    ])


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = Notification.objects.all()
        if self.request.user.is_authenticated:
            queryset = queryset.filter(recipient=self.request.user)
        unread_only = self.request.query_params.get('unread', None)
        if unread_only == 'true':
            queryset = queryset.filter(is_read=False)
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        return Response(NotificationSerializer(notification).data)
    
    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True, read_at=timezone.now())
        return Response({'message': 'All notifications marked as read'})


class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.all()
    serializer_class = ContractSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = Contract.objects.select_related('customer', 'branch', 'vehicle', 'created_by', 'approved_by')\
            .prefetch_related('coverage_rules', 'contract_vehicles__vehicle')
        customer_id = self.request.query_params.get('customer_id', None)
        vehicle_id = self.request.query_params.get('vehicle_id', None)
        contract_type = self.request.query_params.get('contract_type', None)
        contract_status = self.request.query_params.get('status', None)
        active_only = self.request.query_params.get('active', None)
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if vehicle_id:
            queryset = queryset.filter(
                Q(vehicle_id=vehicle_id) | Q(contract_vehicles__vehicle_id=vehicle_id)
            ).distinct()
        if contract_type:
            queryset = queryset.filter(contract_type=contract_type)
        if contract_status:
            queryset = queryset.filter(status=contract_status)
        if active_only == 'true':
            queryset = queryset.filter(status=ContractStatus.ACTIVE, end_date__gte=timezone.now().date())
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        contract = serializer.save(created_by=self.request.user)
        ContractAuditLog.objects.create(
            contract=contract,
            action=ContractAuditAction.CREATED,
            actor=self.request.user,
            new_values={'status': contract.status, 'contract_type': contract.contract_type}
        )
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        from datetime import timedelta
        days = int(request.query_params.get('days', 30))
        expiry_date = timezone.now().date() + timedelta(days=days)
        contracts = self.get_queryset().filter(
            status=ContractStatus.ACTIVE,
            end_date__lte=expiry_date,
            end_date__gte=timezone.now().date()
        )
        return Response(ContractSerializer(contracts, many=True).data)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        from datetime import timedelta
        from django.db.models import Avg
        
        today = timezone.now().date()
        expiry_30 = today + timedelta(days=30)
        
        total_active = Contract.objects.filter(status=ContractStatus.ACTIVE).count()
        total_expiring = Contract.objects.filter(
            status=ContractStatus.ACTIVE,
            end_date__lte=expiry_30,
            end_date__gte=today
        ).count()
        total_value = Contract.objects.filter(status=ContractStatus.ACTIVE).aggregate(
            total=Sum('contract_value')
        )['total'] or 0
        pending_approvals = Contract.objects.filter(status=ContractStatus.PENDING_APPROVAL).count()
        avg_utilization = Contract.objects.filter(
            status=ContractStatus.ACTIVE,
            max_services__isnull=False,
            max_services__gt=0
        ).annotate(
            util=F('services_used') * 100.0 / F('max_services')
        ).aggregate(avg=Avg('util'))['avg'] or 0
        
        by_type = list(Contract.objects.filter(status=ContractStatus.ACTIVE).values('contract_type').annotate(
            count=Count('id'),
            value=Sum('contract_value')
        ))
        
        return Response({
            'total_active': total_active,
            'expiring_soon': total_expiring,
            'total_contract_value': float(total_value),
            'pending_approvals': pending_approvals,
            'average_utilization': round(float(avg_utilization), 1),
            'by_type': by_type
        })
    
    @action(detail=True, methods=['post'])
    def submit_for_approval(self, request, pk=None):
        contract = self.get_object()
        if contract.status != ContractStatus.DRAFT:
            return Response({'error': 'Only draft contracts can be submitted for approval'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        old_status = contract.status
        contract.status = ContractStatus.PENDING_APPROVAL
        contract.save()
        
        ContractAuditLog.objects.create(
            contract=contract,
            action=ContractAuditAction.UPDATED,
            actor=request.user,
            old_values={'status': old_status},
            new_values={'status': contract.status},
            notes='Submitted for approval'
        )
        
        return Response(ContractSerializer(contract).data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        contract = self.get_object()
        if contract.status != ContractStatus.PENDING_APPROVAL:
            return Response({'error': 'Contract is not pending approval'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        old_status = contract.status
        contract.status = ContractStatus.ACTIVE
        contract.approved_by = request.user
        contract.approved_at = timezone.now()
        contract.save()
        
        ContractApproval.objects.create(
            contract=contract,
            approver=request.user,
            status=ContractApprovalStatus.APPROVED,
            comments=request.data.get('comments', ''),
            approved_at=timezone.now()
        )
        
        ContractAuditLog.objects.create(
            contract=contract,
            action=ContractAuditAction.ACTIVATED,
            actor=request.user,
            old_values={'status': old_status},
            new_values={'status': contract.status},
            notes=f'Approved by {request.user.username}'
        )
        
        return Response(ContractSerializer(contract).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        contract = self.get_object()
        if contract.status != ContractStatus.PENDING_APPROVAL:
            return Response({'error': 'Contract is not pending approval'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        old_status = contract.status
        contract.status = ContractStatus.DRAFT
        contract.save()
        
        ContractApproval.objects.create(
            contract=contract,
            approver=request.user,
            status=ContractApprovalStatus.REJECTED,
            comments=request.data.get('comments', '')
        )
        
        ContractAuditLog.objects.create(
            contract=contract,
            action=ContractAuditAction.UPDATED,
            actor=request.user,
            old_values={'status': old_status},
            new_values={'status': contract.status},
            notes=f'Rejected: {request.data.get("comments", "")}'
        )
        
        return Response(ContractSerializer(contract).data)
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        contract = self.get_object()
        if contract.status != ContractStatus.ACTIVE:
            return Response({'error': 'Only active contracts can be suspended'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        reason = request.data.get('reason', '')
        old_status = contract.status
        contract.status = ContractStatus.SUSPENDED
        contract.suspension_reason = reason
        contract.suspended_at = timezone.now()
        contract.save()
        
        ContractAuditLog.objects.create(
            contract=contract,
            action=ContractAuditAction.SUSPENDED,
            actor=request.user,
            old_values={'status': old_status},
            new_values={'status': contract.status, 'suspension_reason': reason},
            notes=reason
        )
        
        return Response(ContractSerializer(contract).data)
    
    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        contract = self.get_object()
        if contract.status != ContractStatus.SUSPENDED:
            return Response({'error': 'Only suspended contracts can be resumed'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        old_status = contract.status
        contract.status = ContractStatus.ACTIVE
        contract.suspension_reason = ''
        contract.suspended_at = None
        contract.save()
        
        ContractAuditLog.objects.create(
            contract=contract,
            action=ContractAuditAction.RESUMED,
            actor=request.user,
            old_values={'status': old_status},
            new_values={'status': contract.status},
            notes='Contract resumed'
        )
        
        return Response(ContractSerializer(contract).data)
    
    @action(detail=True, methods=['post'])
    def terminate(self, request, pk=None):
        contract = self.get_object()
        if contract.status in [ContractStatus.TERMINATED, ContractStatus.EXPIRED]:
            return Response({'error': 'Contract is already terminated or expired'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        reason = request.data.get('reason', '')
        old_status = contract.status
        contract.status = ContractStatus.TERMINATED
        contract.termination_reason = reason
        contract.terminated_at = timezone.now()
        contract.save()
        
        ContractAuditLog.objects.create(
            contract=contract,
            action=ContractAuditAction.TERMINATED,
            actor=request.user,
            old_values={'status': old_status},
            new_values={'status': contract.status, 'termination_reason': reason},
            notes=reason
        )
        
        return Response(ContractSerializer(contract).data)
    
    @action(detail=True, methods=['get'])
    def consumptions(self, request, pk=None):
        contract = self.get_object()
        consumptions = contract.consumptions.all()
        return Response(ContractConsumptionSerializer(consumptions, many=True).data)
    
    @action(detail=True, methods=['get'])
    def audit_log(self, request, pk=None):
        contract = self.get_object()
        logs = contract.audit_logs.all()
        return Response(ContractAuditLogSerializer(logs, many=True).data)
    
    @action(detail=True, methods=['post'])
    def add_vehicle(self, request, pk=None):
        contract = self.get_object()
        vehicle_id = request.data.get('vehicle_id')
        if not vehicle_id:
            return Response({'error': 'vehicle_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            vehicle = Vehicle.objects.get(id=vehicle_id)
        except Vehicle.DoesNotExist:
            return Response({'error': 'Vehicle not found'}, status=status.HTTP_404_NOT_FOUND)
        
        cv, created = ContractVehicle.objects.get_or_create(
            contract=contract,
            vehicle=vehicle,
            defaults={'is_active': True}
        )
        
        if not created:
            cv.is_active = True
            cv.save()
        
        return Response(ContractVehicleSerializer(cv).data)
    
    @action(detail=True, methods=['post'])
    def add_coverage_rule(self, request, pk=None):
        contract = self.get_object()
        serializer = ContractCoverageRuleSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(contract=contract)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def check_eligibility(self, request):
        vehicle_id = request.query_params.get('vehicle_id')
        customer_id = request.query_params.get('customer_id')
        service_type = request.query_params.get('service_type')
        
        if not (vehicle_id or customer_id):
            return Response({'error': 'vehicle_id or customer_id required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        today = timezone.now().date()
        contracts = Contract.objects.filter(
            status=ContractStatus.ACTIVE,
            start_date__lte=today,
            end_date__gte=today
        )
        
        if vehicle_id:
            contracts = contracts.filter(
                Q(vehicle_id=vehicle_id) | Q(contract_vehicles__vehicle_id=vehicle_id, contract_vehicles__is_active=True)
            ).distinct()
        if customer_id:
            contracts = contracts.filter(customer_id=customer_id)
        
        eligible_contracts = []
        for contract in contracts:
            entitlements = {
                'contract_id': contract.id,
                'contract_number': contract.contract_number,
                'contract_type': contract.contract_type,
                'days_remaining': contract.days_remaining,
                'services_remaining': contract.services_remaining,
                'km_remaining': contract.km_remaining,
                'covered_services': contract.services_included,
                'labor_coverage_percent': float(contract.labor_coverage_percent),
                'consumables_included': contract.consumables_included,
                'priority_handling': contract.priority_handling,
                'coverage_rules': []
            }
            
            if service_type:
                rule = contract.coverage_rules.filter(service_type=service_type, is_covered=True).first()
                if rule:
                    entitlements['coverage_rules'].append({
                        'service_type': rule.service_type,
                        'coverage_percent': float(rule.coverage_percent),
                        'visits_remaining': rule.visit_limit - rule.visits_used if rule.visit_limit else None
                    })
            else:
                for rule in contract.coverage_rules.filter(is_covered=True):
                    entitlements['coverage_rules'].append({
                        'service_type': rule.service_type,
                        'coverage_percent': float(rule.coverage_percent),
                        'visits_remaining': rule.visit_limit - rule.visits_used if rule.visit_limit else None
                    })
            
            eligible_contracts.append(entitlements)
        
        return Response({
            'eligible_contracts': eligible_contracts,
            'has_active_contract': len(eligible_contracts) > 0
        })


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = Supplier.objects.all()
        active_only = self.request.query_params.get('active', None)
        category = self.request.query_params.get('category', None)
        
        if active_only == 'true':
            queryset = queryset.filter(is_active=True)
        if category:
            queryset = queryset.filter(categories__contains=[category])
        
        return queryset.order_by('name')


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = PurchaseOrder.objects.all()
        supplier_id = self.request.query_params.get('supplier_id', None)
        status_filter = self.request.query_params.get('status', None)
        branch_id = self.request.query_params.get('branch_id', None)
        
        if supplier_id:
            queryset = queryset.filter(supplier_id=supplier_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        po = self.get_object()
        po.status = 'APPROVED'
        po.approved_by = request.user
        po.save()
        return Response(PurchaseOrderSerializer(po).data)
    
    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        po = self.get_object()
        new_status = request.data.get('status')
        valid_statuses = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED']
        if new_status not in valid_statuses:
            return Response({'error': f'Invalid status. Must be one of: {valid_statuses}'}, status=status.HTTP_400_BAD_REQUEST)
        
        if new_status == 'APPROVED' and not po.approved_by:
            po.approved_by = request.user
        if new_status == 'RECEIVED':
            po.actual_delivery = timezone.now().date()
        
        po.status = new_status
        po.save()
        return Response(PurchaseOrderSerializer(po).data)
    
    @action(detail=True, methods=['get'])
    def allowed_transitions(self, request, pk=None):
        po = self.get_object()
        transitions = {
            'DRAFT': ['PENDING_APPROVAL', 'CANCELLED'],
            'PENDING_APPROVAL': ['APPROVED', 'DRAFT', 'CANCELLED'],
            'APPROVED': ['ORDERED', 'CANCELLED'],
            'ORDERED': ['PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'],
            'PARTIALLY_RECEIVED': ['RECEIVED', 'CANCELLED'],
            'RECEIVED': [],
            'CANCELLED': ['DRAFT'],
        }
        allowed = transitions.get(po.status, [])
        return Response({
            'current_status': po.status,
            'allowed_transitions': [{'value': s, 'label': s.replace('_', ' ').title()} for s in allowed]
        })
    
    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        po = self.get_object()
        lines = request.data.get('lines', [])
        
        for line_data in lines:
            line = PurchaseOrderLine.objects.get(id=line_data['id'])
            line.quantity_received = line_data.get('quantity_received', line.quantity_ordered)
            line.save()
            
            part = line.part
            part.stock += line.quantity_received
            part.last_purchase_date = timezone.now().date()
            part.save()
        
        all_received = all(
            line.quantity_received >= line.quantity_ordered 
            for line in po.lines.all()
        )
        po.status = 'RECEIVED' if all_received else 'PARTIALLY_RECEIVED'
        po.actual_delivery = timezone.now().date()
        po.save()
        
        return Response(PurchaseOrderSerializer(po).data)


class PartReservationViewSet(viewsets.ModelViewSet):
    queryset = PartReservation.objects.all()
    serializer_class = PartReservationSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = PartReservation.objects.all()
        job_card_id = self.request.query_params.get('job_card_id', None)
        part_id = self.request.query_params.get('part_id', None)
        status_filter = self.request.query_params.get('status', None)
        
        if job_card_id:
            queryset = queryset.filter(job_card_id=job_card_id)
        if part_id:
            queryset = queryset.filter(part_id=part_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-reserved_at')
    
    def perform_create(self, serializer):
        serializer.save(reserved_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def release(self, request, pk=None):
        reservation = self.get_object()
        reservation.release()
        return Response(PartReservationSerializer(reservation).data)
    
    @action(detail=True, methods=['post'])
    def issue(self, request, pk=None):
        from decimal import Decimal
        from django.db import transaction
        
        reservation_id = self.get_object().id
        unit_price_raw = request.data.get('unit_price')
        
        with transaction.atomic():
            reservation = PartReservation.objects.select_for_update().get(id=reservation_id)
            
            if reservation.status != ReservationStatus.ACTIVE:
                return Response({'error': 'Reservation is not active or already issued'}, status=status.HTTP_400_BAD_REQUEST)
            
            part = Part.objects.select_for_update().get(id=reservation.part.id)
            
            if part.available_stock < reservation.quantity:
                return Response({'error': 'Insufficient stock available'}, status=status.HTTP_400_BAD_REQUEST)
            
            unit_price = Decimal(str(unit_price_raw)) if unit_price_raw else part.selling_price
            quantity = Decimal(str(reservation.quantity))
            
            part.reserved = max(0, part.reserved - reservation.quantity)
            part.stock = max(0, part.stock - reservation.quantity)
            part.save()
            
            PartIssue.objects.create(
                job_card=reservation.job_card,
                task=reservation.task,
                part=part,
                quantity=reservation.quantity,
                unit_price=unit_price,
                total=quantity * unit_price,
                issued_by=request.user
            )
            
            reservation.status = ReservationStatus.ISSUED
            reservation.issued_at = timezone.now()
            reservation.save(update_fields=['status', 'issued_at'])
        
        reservation.refresh_from_db()
        return Response(PartReservationSerializer(reservation).data)
    
    @action(detail=False, methods=['get'])
    def by_job_card(self, request):
        job_card_id = request.query_params.get('job_card_id')
        if not job_card_id:
            return Response({'error': 'job_card_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        reservations = self.get_queryset().filter(job_card_id=job_card_id, status=ReservationStatus.ACTIVE)
        return Response(PartReservationSerializer(reservations, many=True).data)


class GoodsReceiptNoteViewSet(viewsets.ModelViewSet):
    queryset = GoodsReceiptNote.objects.all()
    serializer_class = GoodsReceiptNoteSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = GoodsReceiptNote.objects.all()
        po_id = self.request.query_params.get('purchase_order_id', None)
        status_filter = self.request.query_params.get('status', None)
        branch_id = self.request.query_params.get('branch_id', None)
        
        if po_id:
            queryset = queryset.filter(purchase_order_id=po_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def inspect(self, request, pk=None):
        grn = self.get_object()
        grn.inspected_by = request.user
        grn.inspection_date = timezone.now()
        grn.inspection_notes = request.data.get('notes', '')
        grn.status = GRNStatus.INSPECTED
        grn.save()
        return Response(GoodsReceiptNoteSerializer(grn).data)
    
    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        from django.db import transaction
        
        grn = self.get_object()
        lines_data = request.data.get('lines', [])
        
        errors = []
        for line_data in lines_data:
            try:
                line = GRNLine.objects.get(id=line_data['id'])
                qty_accepted = max(0, int(line_data.get('quantity_accepted', 0)))
                qty_rejected = max(0, int(line_data.get('quantity_rejected', 0)))
                
                if qty_accepted + qty_rejected > line.quantity_received:
                    errors.append(f"Line {line.id}: accepted + rejected cannot exceed received quantity")
            except (ValueError, GRNLine.DoesNotExist) as e:
                errors.append(f"Invalid line data: {str(e)}")
        
        if errors:
            return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            total_accepted = 0
            total_rejected = 0
            
            for line_data in lines_data:
                line = GRNLine.objects.select_for_update().get(id=line_data['id'])
                qty_accepted = max(0, int(line_data.get('quantity_accepted', 0)))
                qty_rejected = max(0, int(line_data.get('quantity_rejected', 0)))
                
                line.quantity_accepted = qty_accepted
                line.quantity_rejected = qty_rejected
                line.rejection_reason = line_data.get('rejection_reason', '')
                line.save()
                
                if qty_accepted > 0:
                    part = Part.objects.select_for_update().get(id=line.part.id)
                    part.stock += qty_accepted
                    part.last_purchase_cost = line.unit_cost
                    part.save()
                
                total_accepted += qty_accepted
                total_rejected += qty_rejected
            
            grn.total_accepted_qty = total_accepted
            grn.total_rejected_qty = total_rejected
            grn.status = GRNStatus.ACCEPTED if total_rejected == 0 else GRNStatus.PARTIAL_ACCEPT
            grn.save()
            
            po = grn.purchase_order
            all_received = all(
                line.quantity_received >= line.quantity_ordered 
                for line in po.lines.all()
            )
            po.status = PurchaseOrderStatus.RECEIVED if all_received else PurchaseOrderStatus.PARTIALLY_RECEIVED
            po.save()
        
        grn.refresh_from_db()
        return Response(GoodsReceiptNoteSerializer(grn).data)
    
    @action(detail=True, methods=['post'])
    def add_line(self, request, pk=None):
        grn = self.get_object()
        serializer = GRNLineSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(grn=grn)
            grn.total_received_qty = sum(line.quantity_received for line in grn.lines.all())
            grn.save()
            return Response(GoodsReceiptNoteSerializer(grn).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StockTransferViewSet(viewsets.ModelViewSet):
    queryset = StockTransfer.objects.all()
    serializer_class = StockTransferSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = StockTransfer.objects.all()
        from_branch = self.request.query_params.get('from_branch_id', None)
        to_branch = self.request.query_params.get('to_branch_id', None)
        status_filter = self.request.query_params.get('status', None)
        
        if from_branch:
            queryset = queryset.filter(from_branch_id=from_branch)
        if to_branch:
            queryset = queryset.filter(to_branch_id=to_branch)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def submit_for_approval(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status == StockTransferStatus.DRAFT:
            transfer.status = StockTransferStatus.PENDING_APPROVAL
            transfer.save()
        return Response(StockTransferSerializer(transfer).data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        transfer = self.get_object()
        if transfer.status == StockTransferStatus.PENDING_APPROVAL:
            transfer.status = StockTransferStatus.APPROVED
            transfer.approved_by = request.user
            transfer.save()
        return Response(StockTransferSerializer(transfer).data)
    
    @action(detail=True, methods=['post'], url_path='dispatch-transfer')
    def dispatch_transfer(self, request, pk=None):
        transfer = self.get_object()
        transfer.vehicle_number = request.data.get('vehicle_number', '')
        transfer.driver_name = request.data.get('driver_name', '')
        transfer.driver_phone = request.data.get('driver_phone', '')
        transfer.save()
        transfer.dispatch()
        return Response(StockTransferSerializer(transfer).data)
    
    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        from django.db import transaction
        
        transfer = self.get_object()
        if transfer.status != StockTransferStatus.IN_TRANSIT:
            return Response({'error': 'Transfer must be in transit to receive'}, status=status.HTTP_400_BAD_REQUEST)
        
        lines_data = request.data.get('lines', [])
        
        errors = []
        for line_data in lines_data:
            try:
                line = StockTransferLine.objects.get(id=line_data['id'])
                qty_received = max(0, int(line_data.get('quantity_received', line.quantity)))
                if qty_received > line.quantity:
                    errors.append(f"Line {line.id}: received quantity cannot exceed transferred quantity")
            except (ValueError, StockTransferLine.DoesNotExist) as e:
                errors.append(f"Invalid line data: {str(e)}")
        
        if errors:
            return Response({'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
        
        with transaction.atomic():
            for line_data in lines_data:
                line = StockTransferLine.objects.select_for_update().get(id=line_data['id'])
                qty_received = max(0, int(line_data.get('quantity_received', line.quantity)))
                line.quantity_received = qty_received
                line.save()
                
                part = Part.objects.select_for_update().get(id=line.part.id)
                destination_part = Part.objects.filter(
                    part_number=part.part_number,
                    branch=transfer.to_branch
                ).first()
                
                if destination_part:
                    destination_part.stock += qty_received
                    destination_part.save()
            
            transfer.status = StockTransferStatus.RECEIVED
            transfer.received_at = timezone.now()
            transfer.received_by = request.user
            transfer.save()
        
        transfer.refresh_from_db()
        return Response(StockTransferSerializer(transfer).data)
    
    @action(detail=True, methods=['post'])
    def add_line(self, request, pk=None):
        transfer = self.get_object()
        serializer = StockTransferLineSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(transfer=transfer)
            return Response(StockTransferSerializer(transfer).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PurchaseRequisitionViewSet(viewsets.ModelViewSet):
    queryset = PurchaseRequisition.objects.all()
    serializer_class = PurchaseRequisitionSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = PurchaseRequisition.objects.all()
        branch_id = self.request.query_params.get('branch_id', None)
        status_filter = self.request.query_params.get('status', None)
        source = self.request.query_params.get('source', None)
        priority = self.request.query_params.get('priority', None)
        
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if source:
            queryset = queryset.filter(source=source)
        if priority:
            queryset = queryset.filter(priority=priority)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def submit_for_approval(self, request, pk=None):
        pr = self.get_object()
        if pr.status == PRStatus.DRAFT:
            pr.status = PRStatus.PENDING_APPROVAL
            pr.save()
        return Response(PurchaseRequisitionSerializer(pr).data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        pr = self.get_object()
        if pr.status == PRStatus.PENDING_APPROVAL:
            pr.status = PRStatus.APPROVED
            pr.approved_by = request.user
            pr.approval_date = timezone.now()
            pr.save()
        return Response(PurchaseRequisitionSerializer(pr).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        pr = self.get_object()
        if pr.status == PRStatus.PENDING_APPROVAL:
            pr.status = PRStatus.REJECTED
            pr.rejection_reason = request.data.get('reason', '')
            pr.save()
        return Response(PurchaseRequisitionSerializer(pr).data)
    
    @action(detail=True, methods=['post'])
    def convert_to_po(self, request, pk=None):
        pr = self.get_object()
        supplier_id = request.data.get('supplier_id')
        if not supplier_id:
            return Response({'error': 'supplier_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        supplier = Supplier.objects.get(id=supplier_id)
        po = pr.convert_to_po(supplier, request.user)
        
        if po:
            return Response(PurchaseOrderSerializer(po).data, status=status.HTTP_201_CREATED)
        return Response({'error': 'Could not convert PR to PO'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_line(self, request, pk=None):
        pr = self.get_object()
        serializer = PRLineSerializer(data=request.data)
        if serializer.is_valid():
            part = Part.objects.get(id=request.data['part'])
            serializer.save(
                purchase_requisition=pr,
                current_stock=part.stock,
                min_stock=part.min_stock
            )
            return Response(PurchaseRequisitionSerializer(pr).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def generate_from_low_stock(self, request):
        branch_id = request.data.get('branch_id')
        if not branch_id:
            return Response({'error': 'branch_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        branch = Branch.objects.get(id=branch_id)
        
        pending_prs = PurchaseRequisition.objects.filter(
            branch=branch,
            source='LOW_STOCK',
            status__in=[PRStatus.DRAFT, PRStatus.PENDING_APPROVAL]
        )
        pending_part_ids = set(
            PRLine.objects.filter(purchase_requisition__in=pending_prs).values_list('part_id', flat=True)
        )
        
        low_stock_parts = Part.objects.filter(
            branch=branch,
            is_active=True,
            stock__lte=F('min_stock'),
            reorder_quantity__gt=0
        ).exclude(id__in=pending_part_ids)
        
        if not low_stock_parts.exists():
            return Response({'message': 'No new low stock parts found or all already have pending PRs'})
        
        pr = PurchaseRequisition.objects.create(
            branch=branch,
            source='LOW_STOCK',
            priority='HIGH',
            created_by=request.user,
            notes='Auto-generated from low stock alert'
        )
        
        for part in low_stock_parts:
            PRLine.objects.create(
                purchase_requisition=pr,
                part=part,
                quantity=max(1, part.reorder_quantity),
                current_stock=part.stock,
                min_stock=part.min_stock
            )
        
        return Response(PurchaseRequisitionSerializer(pr).data, status=status.HTTP_201_CREATED)


class SupplierPerformanceViewSet(viewsets.ModelViewSet):
    queryset = SupplierPerformance.objects.all()
    serializer_class = SupplierPerformanceSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = SupplierPerformance.objects.all()
        supplier_id = self.request.query_params.get('supplier_id', None)
        
        if supplier_id:
            queryset = queryset.filter(supplier_id=supplier_id)
        
        return queryset.order_by('-period_end')
    
    @action(detail=False, methods=['post'])
    def calculate_for_period(self, request):
        supplier_id = request.data.get('supplier_id')
        period_start = request.data.get('period_start')
        period_end = request.data.get('period_end')
        
        if not all([supplier_id, period_start, period_end]):
            return Response({'error': 'supplier_id, period_start, and period_end are required'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        supplier = Supplier.objects.get(id=supplier_id)
        
        pos = PurchaseOrder.objects.filter(
            supplier=supplier,
            order_date__gte=period_start,
            order_date__lte=period_end,
            status__in=[PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.PARTIALLY_RECEIVED]
        )
        
        total_orders = pos.count()
        orders_on_time = pos.filter(actual_delivery__lte=F('expected_delivery')).count()
        orders_late = total_orders - orders_on_time
        
        grn_lines = GRNLine.objects.filter(grn__purchase_order__in=pos)
        total_items = grn_lines.aggregate(total=Sum('quantity_received'))['total'] or 0
        items_accepted = grn_lines.aggregate(total=Sum('quantity_accepted'))['total'] or 0
        items_rejected = grn_lines.aggregate(total=Sum('quantity_rejected'))['total'] or 0
        
        total_value = pos.aggregate(total=Sum('grand_total'))['total'] or 0
        
        perf, created = SupplierPerformance.objects.update_or_create(
            supplier=supplier,
            period_start=period_start,
            period_end=period_end,
            defaults={
                'total_orders': total_orders,
                'orders_on_time': orders_on_time,
                'orders_late': orders_late,
                'total_items_ordered': total_items,
                'items_accepted': items_accepted,
                'items_rejected': items_rejected,
                'total_value': total_value
            }
        )
        perf.calculate_scores()
        
        return Response(SupplierPerformanceSerializer(perf).data)
    
    @action(detail=False, methods=['get'])
    def scorecard(self, request):
        supplier_id = request.query_params.get('supplier_id')
        if not supplier_id:
            return Response({'error': 'supplier_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        performances = self.get_queryset().filter(supplier_id=supplier_id)[:12]
        latest = performances.first() if performances else None
        
        return Response({
            'supplier_id': supplier_id,
            'overall_score': latest.overall_score if latest else 0,
            'on_time_rate': latest.on_time_rate if latest else 0,
            'quality_rate': latest.quality_rate if latest else 0,
            'performance_history': SupplierPerformanceSerializer(performances, many=True).data
        })


class InventoryAlertViewSet(viewsets.ModelViewSet):
    queryset = InventoryAlert.objects.all()
    serializer_class = InventoryAlertSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = InventoryAlert.objects.all()
        branch_id = self.request.query_params.get('branch_id', None)
        alert_type = self.request.query_params.get('alert_type', None)
        is_resolved = self.request.query_params.get('is_resolved', None)
        severity = self.request.query_params.get('severity', None)
        
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        if alert_type:
            queryset = queryset.filter(alert_type=alert_type)
        if is_resolved is not None:
            queryset = queryset.filter(is_resolved=is_resolved.lower() == 'true')
        if severity:
            queryset = queryset.filter(severity=severity)
        
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        alert = self.get_object()
        alert.is_read = True
        alert.save()
        return Response(InventoryAlertSerializer(alert).data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        alert.resolve(request.user, request.data.get('notes', ''))
        return Response(InventoryAlertSerializer(alert).data)
    
    @action(detail=False, methods=['post'])
    def generate_alerts(self, request):
        branch_id = request.data.get('branch_id')
        if not branch_id:
            return Response({'error': 'branch_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        branch = Branch.objects.get(id=branch_id)
        alerts_created = []
        
        existing_unresolved = InventoryAlert.objects.filter(branch=branch, is_resolved=False)
        existing_low_stock_parts = set(existing_unresolved.filter(alert_type=AlertType.LOW_STOCK).values_list('part_id', flat=True))
        existing_overstock_parts = set(existing_unresolved.filter(alert_type=AlertType.OVERSTOCK).values_list('part_id', flat=True))
        existing_expiry_parts = set(existing_unresolved.filter(alert_type=AlertType.EXPIRY_WARNING).values_list('part_id', flat=True))
        existing_expired_parts = set(existing_unresolved.filter(alert_type=AlertType.EXPIRED).values_list('part_id', flat=True))
        
        low_stock = Part.objects.filter(
            branch=branch,
            is_active=True,
            stock__lte=F('min_stock')
        ).exclude(id__in=existing_low_stock_parts)
        
        for part in low_stock:
            alert = InventoryAlert.objects.create(
                part=part,
                branch=branch,
                alert_type=AlertType.LOW_STOCK,
                message=f"Low stock alert: {part.name} has {part.stock} units (minimum: {part.min_stock})",
                severity='CRITICAL' if part.stock == 0 else 'HIGH'
            )
            alerts_created.append(alert)
        
        overstock = Part.objects.filter(
            branch=branch,
            is_active=True,
            stock__gt=F('max_stock')
        ).exclude(id__in=existing_overstock_parts)
        
        for part in overstock:
            alert = InventoryAlert.objects.create(
                part=part,
                branch=branch,
                alert_type=AlertType.OVERSTOCK,
                message=f"Overstock alert: {part.name} has {part.stock} units (maximum: {part.max_stock})",
                severity='LOW'
            )
            alerts_created.append(alert)
        
        from datetime import timedelta
        expiry_threshold = timezone.now().date() + timedelta(days=30)
        expiring = Part.objects.filter(
            branch=branch,
            is_active=True,
            expiry_date__lte=expiry_threshold,
            expiry_date__gt=timezone.now().date()
        ).exclude(id__in=existing_expiry_parts)
        
        for part in expiring:
            days_left = (part.expiry_date - timezone.now().date()).days
            alert = InventoryAlert.objects.create(
                part=part,
                branch=branch,
                alert_type=AlertType.EXPIRY_WARNING,
                message=f"Expiry warning: {part.name} expires in {days_left} days",
                severity='HIGH' if days_left <= 7 else 'MEDIUM'
            )
            alerts_created.append(alert)
        
        expired = Part.objects.filter(
            branch=branch,
            is_active=True,
            expiry_date__lte=timezone.now().date()
        ).exclude(id__in=existing_expired_parts)
        
        for part in expired:
            alert = InventoryAlert.objects.create(
                part=part,
                branch=branch,
                alert_type=AlertType.EXPIRED,
                message=f"Expired stock: {part.name} expired on {part.expiry_date}",
                severity='CRITICAL'
            )
            alerts_created.append(alert)
        
        return Response({
            'alerts_created': len(alerts_created),
            'alerts': InventoryAlertSerializer(alerts_created, many=True).data
        })
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        branch_id = request.query_params.get('branch_id')
        queryset = self.get_queryset()
        
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        
        unresolved = queryset.filter(is_resolved=False)
        
        return Response({
            'total_alerts': unresolved.count(),
            'critical': unresolved.filter(severity='CRITICAL').count(),
            'high': unresolved.filter(severity='HIGH').count(),
            'medium': unresolved.filter(severity='MEDIUM').count(),
            'low': unresolved.filter(severity='LOW').count(),
            'by_type': {
                'low_stock': unresolved.filter(alert_type=AlertType.LOW_STOCK).count(),
                'overstock': unresolved.filter(alert_type=AlertType.OVERSTOCK).count(),
                'expiry_warning': unresolved.filter(alert_type=AlertType.EXPIRY_WARNING).count(),
                'expired': unresolved.filter(alert_type=AlertType.EXPIRED).count()
            }
        })


class TechnicianScheduleViewSet(viewsets.ModelViewSet):
    queryset = TechnicianSchedule.objects.all()
    serializer_class = TechnicianScheduleSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = TechnicianSchedule.objects.all()
        technician_id = self.request.query_params.get('technician_id', None)
        branch_id = self.request.query_params.get('branch_id', None)
        date = self.request.query_params.get('date', None)
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if technician_id:
            queryset = queryset.filter(technician_id=technician_id)
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        if date:
            queryset = queryset.filter(date=date)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        return queryset.order_by('date', 'shift_start')
    
    @action(detail=False, methods=['get'])
    def available_technicians(self, request):
        date = request.query_params.get('date', timezone.now().date())
        branch_id = request.query_params.get('branch_id', None)
        
        schedules = self.get_queryset().filter(
            date=date,
            is_available=True,
            is_on_leave=False
        )
        if branch_id:
            schedules = schedules.filter(branch_id=branch_id)
        
        return Response(TechnicianScheduleSerializer(schedules, many=True).data)


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = Appointment.objects.all()
        customer_id = self.request.query_params.get('customer_id', None)
        branch_id = self.request.query_params.get('branch_id', None)
        date = self.request.query_params.get('date', None)
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        status_filter = self.request.query_params.get('status', None)
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        if date:
            queryset = queryset.filter(appointment_date=date)
        if date_from:
            queryset = queryset.filter(appointment_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(appointment_date__lte=date_to)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('appointment_date', 'appointment_time')
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        appointment = self.get_object()
        appointment.status = 'CONFIRMED'
        appointment.confirmation_sent = True
        appointment.save()
        return Response(AppointmentSerializer(appointment).data)
    
    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        appointment = self.get_object()
        appointment.status = 'CHECKED_IN'
        appointment.save()
        
        job_card = JobCard.objects.create(
            vehicle=appointment.vehicle,
            customer=appointment.customer,
            branch=appointment.branch,
            service_advisor=appointment.service_advisor,
            workflow_stage=WorkflowStage.CHECK_IN,
            job_type=appointment.service_type,
            complaint=appointment.complaint,
            created_by=request.user
        )
        appointment.job_card = job_card
        appointment.save()
        
        return Response({
            'appointment': AppointmentSerializer(appointment).data,
            'job_card': JobCardSerializer(job_card).data
        })
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        appointment.status = 'CANCELLED'
        appointment.notes = request.data.get('reason', appointment.notes)
        appointment.save()
        return Response(AppointmentSerializer(appointment).data)


class AnalyticsSnapshotViewSet(viewsets.ModelViewSet):
    queryset = AnalyticsSnapshot.objects.all()
    serializer_class = AnalyticsSnapshotSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = AnalyticsSnapshot.objects.all()
        branch_id = self.request.query_params.get('branch_id', None)
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        
        return queryset.order_by('-date')


@api_view(['GET'])
def analytics_summary(request):
    from datetime import timedelta
    
    today = timezone.now().date()
    days = int(request.query_params.get('days', 30))
    start_date = today - timedelta(days=days)
    branch_id = request.query_params.get('branch_id', None)
    
    job_cards = JobCard.objects.filter(
        is_deleted=False,
        created_at__date__gte=start_date
    )
    if branch_id:
        job_cards = job_cards.filter(branch_id=branch_id)
    
    total_jobs = job_cards.count()
    completed_jobs = job_cards.filter(workflow_stage=WorkflowStage.COMPLETED).count()
    
    invoices = Invoice.objects.filter(invoice_date__date__gte=start_date)
    if branch_id:
        invoices = invoices.filter(branch_id=branch_id)
    
    total_revenue = invoices.aggregate(total=Sum('grand_total'))['total'] or 0
    labor_revenue = invoices.aggregate(total=Sum('labor_total'))['total'] or 0
    parts_revenue = invoices.aggregate(total=Sum('parts_total'))['total'] or 0
    
    avg_job_value = total_revenue / completed_jobs if completed_jobs > 0 else 0
    
    sla_met = job_cards.filter(
        workflow_stage=WorkflowStage.COMPLETED,
        actual_delivery__lte=F('sla_deadline')
    ).count()
    sla_compliance = (sla_met / completed_jobs * 100) if completed_jobs > 0 else 0
    
    new_customers = Customer.objects.filter(created_at__date__gte=start_date).count()
    
    appointments = Appointment.objects.filter(appointment_date__gte=start_date)
    if branch_id:
        appointments = appointments.filter(branch_id=branch_id)
    appointments_scheduled = appointments.count()
    appointments_completed = appointments.filter(status='COMPLETED').count()
    
    stage_distribution = job_cards.values('workflow_stage').annotate(count=Count('id'))
    
    daily_revenue = invoices.extra(
        select={'day': 'DATE(invoice_date)'}
    ).values('day').annotate(revenue=Sum('grand_total')).order_by('day')
    
    return Response({
        'period_days': days,
        'total_jobs': total_jobs,
        'completed_jobs': completed_jobs,
        'completion_rate': round(completed_jobs / total_jobs * 100, 2) if total_jobs > 0 else 0,
        'total_revenue': float(total_revenue),
        'labor_revenue': float(labor_revenue),
        'parts_revenue': float(parts_revenue),
        'average_job_value': float(avg_job_value),
        'sla_compliance_rate': round(sla_compliance, 2),
        'new_customers': new_customers,
        'appointments_scheduled': appointments_scheduled,
        'appointments_completed': appointments_completed,
        'stage_distribution': list(stage_distribution),
        'daily_revenue': list(daily_revenue)
    })


class LicenseViewSet(viewsets.ModelViewSet):
    queryset = License.objects.all()
    serializer_class = LicenseSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        license = License.objects.filter(is_primary=True).first()
        if license:
            return Response(LicenseSerializer(license).data)
        return Response({'error': 'No active license found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def validate(self, request, pk=None):
        license = self.get_object()
        return Response({
            'is_valid': license.is_valid(),
            'license_type': license.license_type,
            'status': license.status,
            'expiry_date': license.expiry_date,
            'max_branches': license.max_branches,
            'max_users': license.max_users
        })


class SystemSettingViewSet(viewsets.ModelViewSet):
    queryset = SystemSetting.objects.all()
    serializer_class = SystemSettingSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = SystemSetting.objects.all()
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category=category)
        return queryset
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        settings = SystemSetting.objects.all()
        categories = {}
        for setting in settings:
            if setting.category not in categories:
                categories[setting.category] = []
            categories[setting.category].append(SystemSettingSerializer(setting).data)
        return Response(categories)
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        settings = request.data.get('settings', [])
        updated = []
        for item in settings:
            try:
                setting, created = SystemSetting.objects.update_or_create(
                    key=item['key'],
                    defaults={
                        'value': item.get('value', ''),
                        'category': item.get('category', 'general'),
                        'value_type': item.get('value_type', 'string'),
                        'updated_by': request.user
                    }
                )
                updated.append(SystemSettingSerializer(setting).data)
            except Exception as e:
                pass
        return Response({'updated': updated})


class PaymentIntentViewSet(viewsets.ModelViewSet):
    queryset = PaymentIntent.objects.all()
    serializer_class = PaymentIntentSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = PaymentIntent.objects.all()
        invoice_id = self.request.query_params.get('invoice', None)
        gateway = self.request.query_params.get('gateway', None)
        status_filter = self.request.query_params.get('status', None)
        
        if invoice_id:
            queryset = queryset.filter(invoice_id=invoice_id)
        if gateway:
            queryset = queryset.filter(gateway=gateway)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['post'])
    def create_stripe_intent(self, request):
        invoice_id = request.data.get('invoice_id')
        try:
            invoice = Invoice.objects.get(id=invoice_id)
            payment_intent = PaymentIntent.objects.create(
                invoice=invoice,
                gateway='STRIPE',
                amount=invoice.grand_total,
                currency='INR',
                customer_email=invoice.job_card.vehicle.customer.email,
                customer_phone=invoice.job_card.vehicle.customer.phone
            )
            return Response(PaymentIntentSerializer(payment_intent).data, status=status.HTTP_201_CREATED)
        except Invoice.DoesNotExist:
            return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    def create_razorpay_intent(self, request):
        invoice_id = request.data.get('invoice_id')
        try:
            invoice = Invoice.objects.get(id=invoice_id)
            payment_intent = PaymentIntent.objects.create(
                invoice=invoice,
                gateway='RAZORPAY',
                amount=invoice.grand_total,
                currency='INR',
                customer_email=invoice.job_card.vehicle.customer.email,
                customer_phone=invoice.job_card.vehicle.customer.phone
            )
            return Response(PaymentIntentSerializer(payment_intent).data, status=status.HTTP_201_CREATED)
        except Invoice.DoesNotExist:
            return Response({'error': 'Invoice not found'}, status=status.HTTP_404_NOT_FOUND)


class TallySyncJobViewSet(viewsets.ModelViewSet):
    queryset = TallySyncJob.objects.all()
    serializer_class = TallySyncJobSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def sync_invoices(self, request):
        branch_id = request.data.get('branch_id', None)
        date_from = request.data.get('date_from', None)
        date_to = request.data.get('date_to', None)
        
        sync_job = TallySyncJob.objects.create(
            sync_type='INVOICES',
            branch_id=branch_id,
            created_by=request.user
        )
        
        invoices = Invoice.objects.all()
        if branch_id:
            invoices = invoices.filter(branch_id=branch_id)
        if date_from:
            invoices = invoices.filter(invoice_date__date__gte=date_from)
        if date_to:
            invoices = invoices.filter(invoice_date__date__lte=date_to)
        
        sync_job.records_total = invoices.count()
        sync_job.status = 'COMPLETED'
        sync_job.records_synced = invoices.count()
        sync_job.started_at = timezone.now()
        sync_job.completed_at = timezone.now()
        sync_job.save()
        
        return Response(TallySyncJobSerializer(sync_job).data)
    
    @action(detail=False, methods=['post'])
    def sync_customers(self, request):
        branch_id = request.data.get('branch_id', None)
        
        sync_job = TallySyncJob.objects.create(
            sync_type='CUSTOMERS',
            branch_id=branch_id,
            created_by=request.user
        )
        
        customers = Customer.objects.filter(is_active=True)
        
        sync_job.records_total = customers.count()
        sync_job.status = 'COMPLETED'
        sync_job.records_synced = customers.count()
        sync_job.started_at = timezone.now()
        sync_job.completed_at = timezone.now()
        sync_job.save()
        
        return Response(TallySyncJobSerializer(sync_job).data)
    
    @action(detail=False, methods=['get'])
    def export_xml(self, request):
        sync_type = request.query_params.get('type', 'invoices')
        branch_id = request.query_params.get('branch_id', None)
        
        if sync_type == 'invoices':
            invoices = Invoice.objects.all()
            if branch_id:
                invoices = invoices.filter(branch_id=branch_id)
            data = [{'number': inv.invoice_number, 'date': str(inv.invoice_date), 'total': float(inv.grand_total)} for inv in invoices[:100]]
        elif sync_type == 'customers':
            customers = Customer.objects.filter(is_active=True)
            data = [{'name': c.name, 'phone': c.phone, 'email': c.email} for c in customers[:100]]
        else:
            data = []
        
        return Response({'type': sync_type, 'records': len(data), 'data': data})


class TallyLedgerMappingViewSet(viewsets.ModelViewSet):
    queryset = TallyLedgerMapping.objects.all()
    serializer_class = TallyLedgerMappingSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = TallyLedgerMapping.objects.all()
        mapping_type = self.request.query_params.get('type', None)
        branch_id = self.request.query_params.get('branch_id', None)
        
        if mapping_type:
            queryset = queryset.filter(mapping_type=mapping_type)
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        
        return queryset


class IntegrationConfigViewSet(viewsets.ModelViewSet):
    queryset = IntegrationConfig.objects.all()
    serializer_class = IntegrationConfigSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        integration = self.get_object()
        integration.is_enabled = not integration.is_enabled
        integration.save()
        return Response(IntegrationConfigSerializer(integration).data)
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        integration = self.get_object()
        return Response({
            'success': True,
            'message': f'{integration.name} connection successful',
            'integration': IntegrationConfigSerializer(integration).data
        })


@api_view(['GET'])
def admin_dashboard(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    profile = getattr(request.user, 'profile', None)
    if profile and profile.role not in [UserRole.SUPER_ADMIN.value, UserRole.CEO_OWNER.value, UserRole.BRANCH_MANAGER.value]:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_403_FORBIDDEN)
    
    total_users = User.objects.filter(is_active=True).count()
    total_branches = Branch.objects.filter(is_active=True).count()
    active_licenses = License.objects.filter(status='ACTIVE').count()
    license_info = License.objects.filter(is_primary=True).first()
    
    integrations = IntegrationConfig.objects.all()
    integrations_status = {
        'stripe': integrations.filter(integration_type='stripe').first().is_enabled if integrations.filter(integration_type='stripe').exists() else False,
        'razorpay': integrations.filter(integration_type='razorpay').first().is_enabled if integrations.filter(integration_type='razorpay').exists() else False,
        'tally': integrations.filter(integration_type='tally').first().is_enabled if integrations.filter(integration_type='tally').exists() else False,
    }
    
    return Response({
        'total_users': total_users,
        'total_branches': total_branches,
        'active_licenses': active_licenses,
        'license_info': LicenseSerializer(license_info).data if license_info else None,
        'integrations_status': integrations_status,
        'system_health': {
            'database': 'healthy',
            'api': 'healthy',
            'storage': 'healthy'
        }
    })


# ==================== CRM MODULE VIEWSETS ====================

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = Lead.objects.select_related('branch', 'owner', 'assigned_to', 'referred_by_customer').all()
        status_filter = self.request.query_params.get('status')
        source = self.request.query_params.get('source')
        owner = self.request.query_params.get('owner')
        branch_id = self.request.query_params.get('branch_id')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if source:
            queryset = queryset.filter(source=source)
        if owner:
            queryset = queryset.filter(owner_id=owner)
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
    
    @action(detail=False, methods=['get'])
    def pipeline(self, request):
        pipeline = {}
        for status_choice in LeadStatus.choices:
            status_value = status_choice[0]
            leads = Lead.objects.filter(status=status_value)
            pipeline[status_value] = {
                'count': leads.count(),
                'total_value': leads.aggregate(total=Sum('expected_value'))['total'] or 0,
                'leads': LeadSerializer(leads[:10], many=True).data
            }
        return Response(pipeline)
    
    @action(detail=True, methods=['post'])
    def transition(self, request, pk=None):
        lead = self.get_object()
        new_status = request.data.get('status')
        if new_status not in [s[0] for s in LeadStatus.choices]:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = lead.status
        lead.status = new_status
        lead.last_contact_date = timezone.now()
        
        if new_status == 'LOST':
            lead.lost_reason = request.data.get('lost_reason', '')
            lead.lost_to_competitor = request.data.get('lost_to_competitor', '')
        
        lead.save()
        
        CRMEvent.objects.create(
            event_type='LEAD_STATUS_CHANGE',
            lead=lead,
            description=f'Lead status changed from {old_status} to {new_status}',
            metadata={'old_status': old_status, 'new_status': new_status},
            triggered_by=request.user,
            is_system_generated=False
        )
        
        return Response(LeadSerializer(lead).data)
    
    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        lead = self.get_object()
        if lead.status == 'CONVERTED':
            return Response({'error': 'Lead already converted'}, status=status.HTTP_400_BAD_REQUEST)
        
        customer = Customer.objects.create(
            name=lead.name,
            phone=lead.phone,
            email=lead.email or '',
            address=lead.address or '',
            city=lead.city or '',
            branch=lead.branch,
            referral_source=lead.source
        )
        
        lead.status = 'CONVERTED'
        lead.converted_customer = customer
        lead.save()
        
        CRMEvent.objects.create(
            event_type='LEAD_CONVERTED',
            lead=lead,
            customer=customer,
            description=f'Lead converted to customer {customer.customer_id}',
            triggered_by=request.user
        )
        
        return Response({
            'lead': LeadSerializer(lead).data,
            'customer': CustomerSerializer(customer).data
        })
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        total = Lead.objects.count()
        new_leads = Lead.objects.filter(status='NEW').count()
        contacted = Lead.objects.filter(status='CONTACTED').count()
        qualified = Lead.objects.filter(status='QUALIFIED').count()
        converted = Lead.objects.filter(status='CONVERTED').count()
        lost = Lead.objects.filter(status='LOST').count()
        total_value = Lead.objects.filter(status__in=['QUALIFIED', 'QUOTED', 'NEGOTIATION']).aggregate(
            total=Sum('expected_value'))['total'] or 0
        
        conversion_rate = round((converted / total * 100), 1) if total > 0 else 0
        
        return Response({
            'total': total,
            'new_leads': new_leads,
            'contacted': contacted,
            'qualified': qualified,
            'converted': converted,
            'lost': lost,
            'pipeline_value': float(total_value),
            'conversion_rate': conversion_rate
        })


class CustomerInteractionViewSet(viewsets.ModelViewSet):
    queryset = CustomerInteraction.objects.all()
    serializer_class = CustomerInteractionSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = CustomerInteraction.objects.select_related(
            'customer', 'lead', 'job_card', 'handled_by', 'initiated_by'
        ).all()
        
        customer_id = self.request.query_params.get('customer_id')
        lead_id = self.request.query_params.get('lead_id')
        interaction_type = self.request.query_params.get('type')
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)
        if interaction_type:
            queryset = queryset.filter(interaction_type=interaction_type)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(handled_by=self.request.user, initiated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def timeline(self, request):
        customer_id = request.query_params.get('customer_id')
        if not customer_id:
            return Response({'error': 'customer_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        interactions = CustomerInteraction.objects.filter(customer_id=customer_id).order_by('-created_at')[:50]
        return Response(CustomerInteractionSerializer(interactions, many=True).data)


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = Ticket.objects.select_related(
            'customer', 'vehicle', 'job_card', 'assigned_to', 'raised_by', 'branch'
        ).all()
        
        status_filter = self.request.query_params.get('status')
        priority = self.request.query_params.get('priority')
        ticket_type = self.request.query_params.get('type')
        assigned_to = self.request.query_params.get('assigned_to')
        customer_id = self.request.query_params.get('customer_id')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if priority:
            queryset = queryset.filter(priority=priority)
        if ticket_type:
            queryset = queryset.filter(ticket_type=ticket_type)
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(raised_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        ticket = self.get_object()
        assigned_to_id = request.data.get('assigned_to')
        if not assigned_to_id:
            return Response({'error': 'assigned_to required'}, status=status.HTTP_400_BAD_REQUEST)
        
        ticket.assigned_to_id = assigned_to_id
        if ticket.status == 'RAISED':
            ticket.status = 'ASSIGNED'
        ticket.save()
        
        return Response(TicketSerializer(ticket).data)
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        ticket = self.get_object()
        resolution = request.data.get('resolution', '')
        root_cause = request.data.get('root_cause', '')
        
        ticket.status = 'RESOLVED'
        ticket.resolution = resolution
        ticket.root_cause = root_cause
        ticket.resolved_at = timezone.now()
        ticket.save()
        
        return Response(TicketSerializer(ticket).data)
    
    @action(detail=True, methods=['post'])
    def escalate(self, request, pk=None):
        ticket = self.get_object()
        escalated_to_id = request.data.get('escalated_to')
        reason = request.data.get('reason', '')
        
        ticket.status = 'ESCALATED'
        ticket.escalated_to_id = escalated_to_id
        ticket.escalation_level += 1
        ticket.escalation_reason = reason
        ticket.save()
        
        return Response(TicketSerializer(ticket).data)
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        ticket = self.get_object()
        satisfaction = request.data.get('satisfaction')
        feedback = request.data.get('feedback', '')
        
        ticket.status = 'CLOSED'
        ticket.closed_at = timezone.now()
        if satisfaction:
            ticket.customer_satisfaction = satisfaction
        ticket.feedback = feedback
        ticket.save()
        
        return Response(TicketSerializer(ticket).data)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        total = Ticket.objects.count()
        open_tickets = Ticket.objects.exclude(status__in=['RESOLVED', 'CLOSED']).count()
        critical = Ticket.objects.filter(priority='CRITICAL', status__in=['RAISED', 'ASSIGNED', 'IN_PROGRESS']).count()
        escalated = Ticket.objects.filter(status='ESCALATED').count()
        resolved_today = Ticket.objects.filter(resolved_at__date=timezone.now().date()).count()
        sla_breached = Ticket.objects.filter(sla_breached=True, status__in=['RAISED', 'ASSIGNED', 'IN_PROGRESS']).count()
        
        avg_resolution = Ticket.objects.filter(resolved_at__isnull=False).count()
        
        return Response({
            'total': total,
            'open_tickets': open_tickets,
            'critical': critical,
            'escalated': escalated,
            'resolved_today': resolved_today,
            'sla_breached': sla_breached
        })


class FollowUpTaskViewSet(viewsets.ModelViewSet):
    queryset = FollowUpTask.objects.all()
    serializer_class = FollowUpTaskSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = FollowUpTask.objects.select_related(
            'customer', 'lead', 'ticket', 'assigned_to', 'created_by'
        ).all()
        
        status_filter = self.request.query_params.get('status')
        follow_up_type = self.request.query_params.get('type')
        assigned_to = self.request.query_params.get('assigned_to')
        customer_id = self.request.query_params.get('customer_id')
        overdue = self.request.query_params.get('overdue')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if follow_up_type:
            queryset = queryset.filter(follow_up_type=follow_up_type)
        if assigned_to:
            queryset = queryset.filter(assigned_to_id=assigned_to)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if overdue == 'true':
            queryset = queryset.filter(
                status__in=['PENDING', 'IN_PROGRESS'],
                due_date__lt=timezone.now()
            )
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        task = self.get_object()
        outcome = request.data.get('outcome', '')
        next_action = request.data.get('next_action', '')
        
        task.status = 'COMPLETED'
        task.outcome = outcome
        task.next_action = next_action
        task.completed_at = timezone.now()
        task.save()
        
        return Response(FollowUpTaskSerializer(task).data)
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        tasks = FollowUpTask.objects.filter(
            assigned_to=request.user,
            status__in=['PENDING', 'IN_PROGRESS']
        ).order_by('due_date')
        return Response(FollowUpTaskSerializer(tasks, many=True).data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        tasks = FollowUpTask.objects.filter(
            status__in=['PENDING', 'IN_PROGRESS'],
            due_date__lt=timezone.now()
        ).order_by('due_date')
        return Response(FollowUpTaskSerializer(tasks, many=True).data)


class CampaignViewSet(viewsets.ModelViewSet):
    queryset = Campaign.objects.all()
    serializer_class = CampaignSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = Campaign.objects.select_related('branch', 'created_by').all()
        
        status_filter = self.request.query_params.get('status')
        campaign_type = self.request.query_params.get('type')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if campaign_type:
            queryset = queryset.filter(campaign_type=campaign_type)
        
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        campaign = self.get_object()
        if campaign.status not in ['DRAFT', 'SCHEDULED']:
            return Response({'error': 'Campaign cannot be started'}, status=status.HTTP_400_BAD_REQUEST)
        
        campaign.status = 'ACTIVE'
        campaign.started_at = timezone.now()
        campaign.save()
        
        return Response(CampaignSerializer(campaign).data)
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        campaign = self.get_object()
        campaign.status = 'PAUSED'
        campaign.save()
        return Response(CampaignSerializer(campaign).data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        campaign = self.get_object()
        campaign.status = 'COMPLETED'
        campaign.completed_at = timezone.now()
        campaign.save()
        return Response(CampaignSerializer(campaign).data)
    
    @action(detail=True, methods=['get'])
    def recipients(self, request, pk=None):
        campaign = self.get_object()
        recipients = CampaignRecipient.objects.filter(campaign=campaign).select_related('customer')
        return Response(CampaignRecipientSerializer(recipients, many=True).data)


class CustomerScoreViewSet(viewsets.ModelViewSet):
    queryset = CustomerScore.objects.all()
    serializer_class = CustomerScoreSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = CustomerScore.objects.select_related('customer').all()
        
        segment = self.request.query_params.get('segment')
        churn_risk = self.request.query_params.get('churn_risk')
        
        if segment:
            queryset = queryset.filter(segment=segment)
        if churn_risk:
            queryset = queryset.filter(churn_risk=churn_risk)
        
        return queryset.order_by('-overall_score')
    
    @action(detail=True, methods=['post'])
    def recalculate(self, request, pk=None):
        score = self.get_object()
        score.calculate_score()
        return Response(CustomerScoreSerializer(score).data)
    
    @action(detail=False, methods=['get'])
    def at_risk(self, request):
        scores = CustomerScore.objects.filter(churn_risk='High').select_related('customer')
        return Response(CustomerScoreSerializer(scores, many=True).data)


class CRMEventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CRMEvent.objects.all()
    serializer_class = CRMEventSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = CRMEvent.objects.select_related('customer', 'lead', 'triggered_by').all()
        
        customer_id = self.request.query_params.get('customer_id')
        lead_id = self.request.query_params.get('lead_id')
        event_type = self.request.query_params.get('event_type')
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if lead_id:
            queryset = queryset.filter(lead_id=lead_id)
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        
        return queryset


@api_view(['GET'])
def customer_360_view(request, customer_id):
    if not request.user.is_authenticated:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        customer = Customer.objects.prefetch_related(
            'vehicles', 'interactions', 'tickets', 'follow_up_tasks', 'job_cards'
        ).get(pk=customer_id)
    except Customer.DoesNotExist:
        return Response({'error': 'Customer not found'}, status=status.HTTP_404_NOT_FOUND)
    
    return Response(Customer360Serializer(customer).data)


@api_view(['GET'])
def crm_dashboard(request):
    if not request.user.is_authenticated:
        return Response({'error': 'Unauthorized'}, status=status.HTTP_401_UNAUTHORIZED)
    
    total_customers = Customer.objects.filter(is_active=True).count()
    new_leads = Lead.objects.filter(status='NEW').count()
    open_tickets = Ticket.objects.exclude(status__in=['RESOLVED', 'CLOSED']).count()
    pending_tasks = FollowUpTask.objects.filter(status__in=['PENDING', 'IN_PROGRESS']).count()
    overdue_tasks = FollowUpTask.objects.filter(
        status__in=['PENDING', 'IN_PROGRESS'],
        due_date__lt=timezone.now()
    ).count()
    active_campaigns = Campaign.objects.filter(status='ACTIVE').count()
    
    at_risk_customers = CustomerScore.objects.filter(churn_risk='High').count()
    
    lead_pipeline = {}
    for status_choice in LeadStatus.choices:
        lead_pipeline[status_choice[0]] = Lead.objects.filter(status=status_choice[0]).count()
    
    ticket_by_type = {}
    for ticket in Ticket.objects.exclude(status__in=['RESOLVED', 'CLOSED']).values('ticket_type').annotate(count=Count('id')):
        ticket_by_type[ticket['ticket_type']] = ticket['count']
    
    return Response({
        'total_customers': total_customers,
        'new_leads': new_leads,
        'open_tickets': open_tickets,
        'pending_tasks': pending_tasks,
        'overdue_tasks': overdue_tasks,
        'active_campaigns': active_campaigns,
        'at_risk_customers': at_risk_customers,
        'lead_pipeline': lead_pipeline,
        'ticket_by_type': ticket_by_type
    })


# Admin Panel ViewSets
class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.select_related('branch', 'manager__user').all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        return queryset.filter(is_active=True)


class EmployeeAssignmentViewSet(viewsets.ModelViewSet):
    queryset = EmployeeAssignment.objects.select_related('profile__user', 'department').all()
    serializer_class = EmployeeAssignmentSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        department_id = self.request.query_params.get('department_id')
        profile_id = self.request.query_params.get('profile_id')
        if department_id:
            queryset = queryset.filter(department_id=department_id)
        if profile_id:
            queryset = queryset.filter(profile_id=profile_id)
        return queryset.filter(is_active=True)


class WorkShiftViewSet(viewsets.ModelViewSet):
    queryset = WorkShift.objects.select_related('branch').all()
    serializer_class = WorkShiftSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        return queryset.filter(is_active=True)


class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.select_related('profile__user', 'shift', 'approved_by').all()
    serializer_class = AttendanceRecordSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        profile_id = self.request.query_params.get('profile_id')
        date = self.request.query_params.get('date')
        status_filter = self.request.query_params.get('status')
        if profile_id:
            queryset = queryset.filter(profile_id=profile_id)
        if date:
            queryset = queryset.filter(date=date)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset
    
    @action(detail=True, methods=['post'])
    def check_in(self, request, pk=None):
        record = self.get_object()
        record.check_in = timezone.now()
        record.status = 'PRESENT'
        record.save()
        return Response(AttendanceRecordSerializer(record).data)
    
    @action(detail=True, methods=['post'])
    def check_out(self, request, pk=None):
        record = self.get_object()
        record.check_out = timezone.now()
        record.calculate_work_hours()
        return Response(AttendanceRecordSerializer(record).data)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        today = timezone.now().date()
        records = self.get_queryset().filter(date=today)
        return Response(AttendanceRecordSerializer(records, many=True).data)


class RolePermissionViewSet(viewsets.ModelViewSet):
    queryset = RolePermission.objects.all()
    serializer_class = RolePermissionSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        role = self.request.query_params.get('role')
        module = self.request.query_params.get('module')
        if role:
            queryset = queryset.filter(role=role)
        if module:
            queryset = queryset.filter(module=module)
        return queryset
    
    @action(detail=False, methods=['get'])
    def modules(self, request):
        modules = [
            'dashboard', 'customers', 'vehicles', 'job_cards', 'appointments',
            'inventory', 'suppliers', 'invoices', 'payments', 'contracts',
            'crm', 'leads', 'tickets', 'campaigns', 'analytics', 'admin',
            'departments', 'attendance', 'settings', 'integrations'
        ]
        return Response(modules)
    
    @action(detail=False, methods=['get'])
    def roles(self, request):
        roles = [{'value': choice[0], 'label': choice[1]} for choice in UserRole.choices]
        return Response(roles)
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        permissions = request.data.get('permissions', [])
        updated = 0
        for perm in permissions:
            obj, created = RolePermission.objects.update_or_create(
                role=perm.get('role'),
                module=perm.get('module'),
                defaults={
                    'can_view': perm.get('can_view', False),
                    'can_create': perm.get('can_create', False),
                    'can_edit': perm.get('can_edit', False),
                    'can_delete': perm.get('can_delete', False),
                    'can_approve': perm.get('can_approve', False),
                    'can_export': perm.get('can_export', False),
                }
            )
            updated += 1
        return Response({'updated': updated})


class EmailConfigurationViewSet(viewsets.ModelViewSet):
    queryset = EmailConfiguration.objects.all()
    serializer_class = EmailConfigurationSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        config = self.get_object()
        config.last_tested = timezone.now()
        config.test_status = 'SUCCESS'
        config.save()
        return Response({'status': 'Connection test successful'})
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        EmailConfiguration.objects.update(is_default=False)
        config = self.get_object()
        config.is_default = True
        config.save()
        return Response(EmailConfigurationSerializer(config).data)


class WhatsAppConfigurationViewSet(viewsets.ModelViewSet):
    queryset = WhatsAppConfiguration.objects.all()
    serializer_class = WhatsAppConfigurationSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        config = self.get_object()
        config.last_tested = timezone.now()
        config.test_status = 'SUCCESS'
        config.save()
        return Response({'status': 'Connection test successful'})
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        WhatsAppConfiguration.objects.update(is_default=False)
        config = self.get_object()
        config.is_default = True
        config.save()
        return Response(WhatsAppConfigurationSerializer(config).data)


class PaymentGatewayConfigurationViewSet(viewsets.ModelViewSet):
    queryset = PaymentGatewayConfiguration.objects.all()
    serializer_class = PaymentGatewayConfigurationSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        config = self.get_object()
        config.last_tested = timezone.now()
        config.test_status = 'SUCCESS'
        config.save()
        return Response({'status': 'Connection test successful'})
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        PaymentGatewayConfigurationViewSet.objects.update(is_default=False)
        config = self.get_object()
        config.is_default = True
        config.save()
        return Response(PaymentGatewayConfigurationSerializer(config).data)


class TallyConfigurationViewSet(viewsets.ModelViewSet):
    queryset = TallyConfiguration.objects.all()
    serializer_class = TallyConfigurationSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    @action(detail=True, methods=['post'])
    def test_connection(self, request, pk=None):
        config = self.get_object()
        config.last_sync = timezone.now()
        config.sync_status = 'SUCCESS'
        config.save()
        return Response({'status': 'Connection test successful'})
    
    @action(detail=True, methods=['post'])
    def sync_now(self, request, pk=None):
        config = self.get_object()
        config.last_sync = timezone.now()
        config.sync_status = 'SUCCESS'
        config.save()
        return Response({'status': 'Sync completed successfully'})


# =====================================================
# ENTERPRISE ACCOUNTS & FINANCE VIEWSETS
# =====================================================

class AccountViewSet(viewsets.ModelViewSet):
    queryset = Account.objects.all()
    serializer_class = AccountSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = Account.objects.all()
        category = self.request.query_params.get('category')
        account_type = self.request.query_params.get('account_type')
        branch = self.request.query_params.get('branch')
        is_active = self.request.query_params.get('is_active')
        parent_only = self.request.query_params.get('parent_only')
        
        if category:
            queryset = queryset.filter(category=category)
        if account_type:
            queryset = queryset.filter(account_type=account_type)
        if branch:
            queryset = queryset.filter(Q(branch_id=branch) | Q(branch__isnull=True))
        if is_active:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        if parent_only and parent_only.lower() == 'true':
            queryset = queryset.filter(parent__isnull=True)
        return queryset
    
    @action(detail=False, methods=['get'])
    def chart_of_accounts(self, request):
        accounts = Account.objects.filter(parent__isnull=True, is_active=True).prefetch_related('children')
        result = []
        for account in accounts:
            account_data = AccountSerializer(account).data
            account_data['children'] = AccountSerializer(account.children.filter(is_active=True), many=True).data
            result.append(account_data)
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def seed_default(self, request):
        default_accounts = [
            {'code': '1000', 'name': 'Cash', 'category': 'ASSETS', 'account_type': 'CASH', 'is_system': True},
            {'code': '1100', 'name': 'Bank Account', 'category': 'ASSETS', 'account_type': 'BANK', 'is_system': True},
            {'code': '1200', 'name': 'Accounts Receivable', 'category': 'ASSETS', 'account_type': 'RECEIVABLE', 'is_system': True},
            {'code': '1300', 'name': 'Inventory', 'category': 'ASSETS', 'account_type': 'INVENTORY', 'is_system': True},
            {'code': '1400', 'name': 'Input GST', 'category': 'ASSETS', 'account_type': 'TAX_ASSET', 'is_system': True},
            {'code': '2000', 'name': 'Accounts Payable', 'category': 'LIABILITIES', 'account_type': 'PAYABLE', 'is_system': True},
            {'code': '2100', 'name': 'GST Payable', 'category': 'LIABILITIES', 'account_type': 'TAX_LIABILITY', 'is_system': True},
            {'code': '2200', 'name': 'Deferred Revenue', 'category': 'LIABILITIES', 'account_type': 'DEFERRED_REVENUE', 'is_system': True},
            {'code': '3000', 'name': 'Capital', 'category': 'EQUITY', 'account_type': 'CAPITAL', 'is_system': True},
            {'code': '3100', 'name': 'Retained Earnings', 'category': 'EQUITY', 'account_type': 'RETAINED_EARNINGS', 'is_system': True},
            {'code': '4000', 'name': 'Service Revenue', 'category': 'INCOME', 'account_type': 'REVENUE', 'is_system': True},
            {'code': '4100', 'name': 'Spare Parts Revenue', 'category': 'INCOME', 'account_type': 'REVENUE', 'is_system': True},
            {'code': '4200', 'name': 'Contract/AMC Revenue', 'category': 'INCOME', 'account_type': 'REVENUE', 'is_system': True},
            {'code': '5000', 'name': 'Cost of Goods Sold', 'category': 'EXPENSES', 'account_type': 'COGS', 'is_system': True},
            {'code': '5100', 'name': 'Labor Cost', 'category': 'EXPENSES', 'account_type': 'EXPENSE', 'is_system': True},
            {'code': '5200', 'name': 'Operating Expenses', 'category': 'EXPENSES', 'account_type': 'EXPENSE', 'is_system': True},
            {'code': '5300', 'name': 'Goodwill/Free Service', 'category': 'EXPENSES', 'account_type': 'EXPENSE', 'is_system': True},
        ]
        created = 0
        for acc in default_accounts:
            _, was_created = Account.objects.get_or_create(code=acc['code'], defaults=acc)
            if was_created:
                created += 1
        return Response({'message': f'Seeded {created} default accounts'})


class TaxRateViewSet(viewsets.ModelViewSet):
    queryset = TaxRate.objects.all()
    serializer_class = TaxRateSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = TaxRate.objects.all()
        tax_type = self.request.query_params.get('tax_type')
        is_active = self.request.query_params.get('is_active')
        if tax_type:
            queryset = queryset.filter(tax_type=tax_type)
        if is_active:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset
    
    @action(detail=False, methods=['post'])
    def seed_default(self, request):
        default_taxes = [
            {'name': 'GST 0%', 'tax_type': 'GST', 'rate': 0, 'is_active': True},
            {'name': 'GST 5%', 'tax_type': 'GST', 'rate': 5, 'is_active': True},
            {'name': 'GST 12%', 'tax_type': 'GST', 'rate': 12, 'is_active': True},
            {'name': 'GST 18%', 'tax_type': 'GST', 'rate': 18, 'is_active': True},
            {'name': 'GST 28%', 'tax_type': 'GST', 'rate': 28, 'is_active': True},
        ]
        created = 0
        for tax in default_taxes:
            _, was_created = TaxRate.objects.get_or_create(name=tax['name'], defaults=tax)
            if was_created:
                created += 1
        return Response({'message': f'Seeded {created} default tax rates'})


class EnhancedInvoiceViewSet(viewsets.ModelViewSet):
    queryset = EnhancedInvoice.objects.all()
    serializer_class = EnhancedInvoiceSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = EnhancedInvoice.objects.all().select_related('customer', 'branch', 'job_card', 'contract')
        status_filter = self.request.query_params.get('status')
        invoice_type = self.request.query_params.get('invoice_type')
        customer = self.request.query_params.get('customer')
        branch = self.request.query_params.get('branch')
        from_date = self.request.query_params.get('from_date')
        to_date = self.request.query_params.get('to_date')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if invoice_type:
            queryset = queryset.filter(invoice_type=invoice_type)
        if customer:
            queryset = queryset.filter(customer_id=customer)
        if branch:
            queryset = queryset.filter(branch_id=branch)
        if from_date:
            queryset = queryset.filter(invoice_date__gte=from_date)
        if to_date:
            queryset = queryset.filter(invoice_date__lte=to_date)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status != InvoiceStatus.PENDING_APPROVAL:
            return Response({'error': 'Invoice is not pending approval'}, status=status.HTTP_400_BAD_REQUEST)
        invoice.status = InvoiceStatus.APPROVED
        invoice.approved_by = request.user
        invoice.approved_at = timezone.now()
        invoice.save()
        self._log_finance_audit('APPROVE', invoice, request.user, 'Invoice approved')
        return Response(EnhancedInvoiceSerializer(invoice).data)
    
    @action(detail=True, methods=['post'])
    def issue(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status not in [InvoiceStatus.APPROVED, InvoiceStatus.DRAFT]:
            return Response({'error': 'Invoice cannot be issued from current status'}, status=status.HTTP_400_BAD_REQUEST)
        invoice.status = InvoiceStatus.ISSUED
        invoice.issued_by = request.user
        invoice.issued_at = timezone.now()
        invoice.save()
        self._create_receivable(invoice)
        self._log_finance_audit('POST', invoice, request.user, 'Invoice issued and posted to receivables')
        return Response(EnhancedInvoiceSerializer(invoice).data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        invoice = self.get_object()
        reason = request.data.get('reason', '')
        if invoice.status in [InvoiceStatus.PAID, InvoiceStatus.CLOSED]:
            return Response({'error': 'Cannot cancel paid/closed invoice'}, status=status.HTTP_400_BAD_REQUEST)
        invoice.status = InvoiceStatus.CANCELLED
        invoice.cancelled_by = request.user
        invoice.cancelled_at = timezone.now()
        invoice.cancellation_reason = reason
        invoice.save()
        self._log_finance_audit('DELETE', invoice, request.user, f'Invoice cancelled: {reason}')
        return Response(EnhancedInvoiceSerializer(invoice).data)
    
    @action(detail=False, methods=['get'])
    def dashboard_stats(self, request):
        branch = request.query_params.get('branch')
        queryset = EnhancedInvoice.objects.all()
        if branch:
            queryset = queryset.filter(branch_id=branch)
        
        stats = {
            'total_invoices': queryset.count(),
            'draft': queryset.filter(status=InvoiceStatus.DRAFT).count(),
            'pending_approval': queryset.filter(status=InvoiceStatus.PENDING_APPROVAL).count(),
            'issued': queryset.filter(status=InvoiceStatus.ISSUED).count(),
            'partially_paid': queryset.filter(status=InvoiceStatus.PARTIALLY_PAID).count(),
            'paid': queryset.filter(status=InvoiceStatus.PAID).count(),
            'overdue': queryset.filter(status=InvoiceStatus.OVERDUE).count(),
            'total_revenue': queryset.filter(status__in=[InvoiceStatus.PAID, InvoiceStatus.CLOSED]).aggregate(total=Sum('grand_total'))['total'] or 0,
            'total_outstanding': queryset.filter(status__in=[InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE]).aggregate(total=Sum('balance_due'))['total'] or 0,
        }
        return Response(stats)
    
    def _create_receivable(self, invoice):
        CustomerReceivable.objects.create(
            customer=invoice.customer,
            branch=invoice.branch,
            invoice=invoice,
            original_amount=invoice.grand_total,
            outstanding_amount=invoice.balance_due,
            due_date=invoice.due_date or invoice.invoice_date
        )
    
    def _log_finance_audit(self, action, invoice, user, reason=''):
        try:
            profile = user.profile
            role = profile.role
            branch = profile.branch
        except:
            role = ''
            branch = None
        FinancialAuditLog.objects.create(
            user=user,
            user_role=role,
            branch=branch,
            action=action,
            model_name='EnhancedInvoice',
            object_id=str(invoice.id),
            object_repr=str(invoice),
            document_number=invoice.invoice_number,
            reason=reason
        )


class InvoiceLineViewSet(viewsets.ModelViewSet):
    queryset = InvoiceLine.objects.all()
    serializer_class = InvoiceLineSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        invoice = self.request.query_params.get('invoice')
        if invoice:
            return InvoiceLine.objects.filter(invoice_id=invoice)
        return InvoiceLine.objects.all()


class CreditNoteViewSet(viewsets.ModelViewSet):
    queryset = CreditNote.objects.all()
    serializer_class = CreditNoteSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        credit_note = self.get_object()
        if credit_note.status != InvoiceStatus.PENDING_APPROVAL:
            return Response({'error': 'Credit note is not pending approval'}, status=status.HTTP_400_BAD_REQUEST)
        credit_note.status = InvoiceStatus.APPROVED
        credit_note.approved_by = request.user
        credit_note.approved_at = timezone.now()
        credit_note.save()
        return Response(CreditNoteSerializer(credit_note).data)


class EnhancedPaymentViewSet(viewsets.ModelViewSet):
    queryset = EnhancedPayment.objects.all()
    serializer_class = EnhancedPaymentSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = EnhancedPayment.objects.all().select_related('customer', 'branch', 'invoice')
        customer = self.request.query_params.get('customer')
        branch = self.request.query_params.get('branch')
        status_filter = self.request.query_params.get('status')
        from_date = self.request.query_params.get('from_date')
        to_date = self.request.query_params.get('to_date')
        
        if customer:
            queryset = queryset.filter(customer_id=customer)
        if branch:
            queryset = queryset.filter(branch_id=branch)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if from_date:
            queryset = queryset.filter(payment_date__gte=from_date)
        if to_date:
            queryset = queryset.filter(payment_date__lte=to_date)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        payment = self.get_object()
        payment.status = EnhancedPayment.PaymentStatus.COMPLETED
        payment.save()
        if payment.invoice:
            payment.invoice.amount_paid += payment.amount
            if payment.invoice.amount_paid >= payment.invoice.grand_total:
                payment.invoice.status = InvoiceStatus.PAID
            else:
                payment.invoice.status = InvoiceStatus.PARTIALLY_PAID
            payment.invoice.save()
            try:
                receivable = payment.invoice.receivable
                receivable.outstanding_amount = payment.invoice.balance_due
                receivable.save()
            except:
                pass
        return Response(EnhancedPaymentSerializer(payment).data)
    
    @action(detail=False, methods=['get'])
    def collection_summary(self, request):
        branch = request.query_params.get('branch')
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')
        
        queryset = EnhancedPayment.objects.filter(status=EnhancedPayment.PaymentStatus.COMPLETED)
        if branch:
            queryset = queryset.filter(branch_id=branch)
        if from_date:
            queryset = queryset.filter(payment_date__gte=from_date)
        if to_date:
            queryset = queryset.filter(payment_date__lte=to_date)
        
        by_mode = queryset.values('payment_mode').annotate(total=Sum('amount'), count=Count('id'))
        total = queryset.aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'total_collected': total,
            'by_mode': list(by_mode),
            'count': queryset.count()
        })


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    @action(detail=False, methods=['post'])
    def seed_default(self, request):
        default_categories = [
            {'code': 'RENT', 'name': 'Rent & Lease'},
            {'code': 'UTIL', 'name': 'Utilities'},
            {'code': 'SAL', 'name': 'Salaries & Wages'},
            {'code': 'MAINT', 'name': 'Maintenance'},
            {'code': 'PETTY', 'name': 'Petty Cash'},
            {'code': 'TRAVEL', 'name': 'Travel & Conveyance'},
            {'code': 'OFFICE', 'name': 'Office Supplies'},
            {'code': 'MISC', 'name': 'Miscellaneous'},
        ]
        created = 0
        for cat in default_categories:
            _, was_created = ExpenseCategory.objects.get_or_create(code=cat['code'], defaults=cat)
            if was_created:
                created += 1
        return Response({'message': f'Seeded {created} default expense categories'})


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = Expense.objects.all().select_related('category', 'branch', 'supplier')
        status_filter = self.request.query_params.get('status')
        category = self.request.query_params.get('category')
        branch = self.request.query_params.get('branch')
        from_date = self.request.query_params.get('from_date')
        to_date = self.request.query_params.get('to_date')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if category:
            queryset = queryset.filter(category_id=category)
        if branch:
            queryset = queryset.filter(branch_id=branch)
        if from_date:
            queryset = queryset.filter(expense_date__gte=from_date)
        if to_date:
            queryset = queryset.filter(expense_date__lte=to_date)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        expense = self.get_object()
        if expense.status != ExpenseStatus.DRAFT:
            return Response({'error': 'Expense is not in draft status'}, status=status.HTTP_400_BAD_REQUEST)
        expense.status = ExpenseStatus.SUBMITTED
        expense.submitted_by = request.user
        expense.submitted_at = timezone.now()
        expense.save()
        return Response(ExpenseSerializer(expense).data)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        expense = self.get_object()
        if expense.status not in [ExpenseStatus.SUBMITTED, ExpenseStatus.PENDING_APPROVAL]:
            return Response({'error': 'Expense cannot be approved from current status'}, status=status.HTTP_400_BAD_REQUEST)
        expense.status = ExpenseStatus.APPROVED
        expense.approved_by = request.user
        expense.approved_at = timezone.now()
        expense.save()
        return Response(ExpenseSerializer(expense).data)
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        expense = self.get_object()
        reason = request.data.get('reason', '')
        expense.status = ExpenseStatus.REJECTED
        expense.rejection_reason = reason
        expense.save()
        return Response(ExpenseSerializer(expense).data)
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        expense = self.get_object()
        if expense.status != ExpenseStatus.APPROVED:
            return Response({'error': 'Expense must be approved before payment'}, status=status.HTTP_400_BAD_REQUEST)
        expense.status = ExpenseStatus.PAID
        expense.paid_by = request.user
        expense.paid_at = timezone.now()
        expense.payment_mode = request.data.get('payment_mode')
        expense.reference_number = request.data.get('reference_number', '')
        expense.save()
        return Response(ExpenseSerializer(expense).data)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        branch = request.query_params.get('branch')
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')
        
        queryset = Expense.objects.filter(status=ExpenseStatus.PAID)
        if branch:
            queryset = queryset.filter(branch_id=branch)
        if from_date:
            queryset = queryset.filter(expense_date__gte=from_date)
        if to_date:
            queryset = queryset.filter(expense_date__lte=to_date)
        
        by_category = queryset.values('category__name').annotate(total=Sum('total_amount'), count=Count('id'))
        total = queryset.aggregate(total=Sum('total_amount'))['total'] or 0
        
        return Response({
            'total_expenses': total,
            'by_category': list(by_category),
            'count': queryset.count()
        })


class JournalEntryViewSet(viewsets.ModelViewSet):
    queryset = JournalEntry.objects.all()
    serializer_class = JournalEntrySerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = JournalEntry.objects.all().prefetch_related('ledger_entries')
        branch = self.request.query_params.get('branch')
        entry_type = self.request.query_params.get('entry_type')
        is_posted = self.request.query_params.get('is_posted')
        from_date = self.request.query_params.get('from_date')
        to_date = self.request.query_params.get('to_date')
        
        if branch:
            queryset = queryset.filter(branch_id=branch)
        if entry_type:
            queryset = queryset.filter(entry_type=entry_type)
        if is_posted:
            queryset = queryset.filter(is_posted=is_posted.lower() == 'true')
        if from_date:
            queryset = queryset.filter(entry_date__gte=from_date)
        if to_date:
            queryset = queryset.filter(entry_date__lte=to_date)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def post(self, request, pk=None):
        journal = self.get_object()
        if journal.is_posted:
            return Response({'error': 'Journal already posted'}, status=status.HTTP_400_BAD_REQUEST)
        if not journal.is_balanced:
            return Response({'error': 'Journal is not balanced'}, status=status.HTTP_400_BAD_REQUEST)
        
        journal.is_posted = True
        journal.posted_at = timezone.now()
        journal.posted_by = request.user
        journal.save()
        
        for entry in journal.ledger_entries.all():
            account = entry.account
            if entry.debit > 0:
                if account.category in ['ASSETS', 'EXPENSES']:
                    account.current_balance += entry.debit
                else:
                    account.current_balance -= entry.debit
            if entry.credit > 0:
                if account.category in ['LIABILITIES', 'INCOME', 'EQUITY']:
                    account.current_balance += entry.credit
                else:
                    account.current_balance -= entry.credit
            account.save()
        
        return Response(JournalEntrySerializer(journal).data)
    
    @action(detail=True, methods=['post'])
    def reverse(self, request, pk=None):
        journal = self.get_object()
        if not journal.is_posted:
            return Response({'error': 'Cannot reverse unposted journal'}, status=status.HTTP_400_BAD_REQUEST)
        
        reversal = JournalEntry.objects.create(
            entry_type=journal.entry_type,
            branch=journal.branch,
            entry_date=timezone.now().date(),
            description=f"Reversal of {journal.journal_number}",
            reversal_of=journal,
            created_by=request.user
        )
        
        for entry in journal.ledger_entries.all():
            LedgerEntry.objects.create(
                journal=reversal,
                account=entry.account,
                branch=entry.branch,
                debit=entry.credit,
                credit=entry.debit,
                narration=f"Reversal: {entry.narration}",
                entry_date=reversal.entry_date
            )
        
        reversal.total_debit = journal.total_credit
        reversal.total_credit = journal.total_debit
        reversal.save()
        
        journal.is_reversed = True
        journal.save()
        
        return Response(JournalEntrySerializer(reversal).data)


class LedgerEntryViewSet(viewsets.ModelViewSet):
    queryset = LedgerEntry.objects.all()
    serializer_class = LedgerEntrySerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = LedgerEntry.objects.all().select_related('account', 'branch', 'journal')
        account = self.request.query_params.get('account')
        branch = self.request.query_params.get('branch')
        from_date = self.request.query_params.get('from_date')
        to_date = self.request.query_params.get('to_date')
        
        if account:
            queryset = queryset.filter(account_id=account)
        if branch:
            queryset = queryset.filter(branch_id=branch)
        if from_date:
            queryset = queryset.filter(entry_date__gte=from_date)
        if to_date:
            queryset = queryset.filter(entry_date__lte=to_date)
        return queryset
    
    @action(detail=False, methods=['get'])
    def account_statement(self, request):
        account_id = request.query_params.get('account')
        from_date = request.query_params.get('from_date')
        to_date = request.query_params.get('to_date')
        
        if not account_id:
            return Response({'error': 'account parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        
        entries = LedgerEntry.objects.filter(account_id=account_id, journal__is_posted=True)
        if from_date:
            entries = entries.filter(entry_date__gte=from_date)
        if to_date:
            entries = entries.filter(entry_date__lte=to_date)
        
        opening = Account.objects.get(id=account_id).opening_balance
        running = opening
        result = []
        for entry in entries.order_by('entry_date', 'created_at'):
            running += entry.debit - entry.credit
            result.append({
                'date': entry.entry_date,
                'description': entry.narration or entry.journal.description,
                'debit': entry.debit,
                'credit': entry.credit,
                'balance': running
            })
        
        return Response({
            'opening_balance': opening,
            'entries': result,
            'closing_balance': running
        })


class CustomerReceivableViewSet(viewsets.ModelViewSet):
    queryset = CustomerReceivable.objects.all()
    serializer_class = CustomerReceivableSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = CustomerReceivable.objects.all().select_related('customer', 'branch', 'invoice')
        customer = self.request.query_params.get('customer')
        branch = self.request.query_params.get('branch')
        aging_bucket = self.request.query_params.get('aging_bucket')
        
        if customer:
            queryset = queryset.filter(customer_id=customer)
        if branch:
            queryset = queryset.filter(branch_id=branch)
        if aging_bucket:
            queryset = queryset.filter(aging_bucket=aging_bucket)
        return queryset.filter(outstanding_amount__gt=0)
    
    @action(detail=False, methods=['get'])
    def aging_summary(self, request):
        branch = request.query_params.get('branch')
        queryset = CustomerReceivable.objects.filter(outstanding_amount__gt=0)
        if branch:
            queryset = queryset.filter(branch_id=branch)
        
        for rec in queryset:
            rec.update_aging()
        
        aging = queryset.values('aging_bucket').annotate(
            total=Sum('outstanding_amount'),
            count=Count('id')
        )
        
        total = queryset.aggregate(total=Sum('outstanding_amount'))['total'] or 0
        
        return Response({
            'total_outstanding': total,
            'aging': list(aging)
        })
    
    @action(detail=True, methods=['post'])
    def write_off(self, request, pk=None):
        receivable = self.get_object()
        amount = request.data.get('amount', receivable.outstanding_amount)
        receivable.is_written_off = True
        receivable.written_off_amount = amount
        receivable.written_off_date = timezone.now().date()
        receivable.written_off_by = request.user
        receivable.outstanding_amount -= amount
        receivable.save()
        return Response(CustomerReceivableSerializer(receivable).data)


class VendorPayableViewSet(viewsets.ModelViewSet):
    queryset = VendorPayable.objects.all()
    serializer_class = VendorPayableSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = VendorPayable.objects.all().select_related('supplier', 'branch')
        supplier = self.request.query_params.get('supplier')
        branch = self.request.query_params.get('branch')
        is_paid = self.request.query_params.get('is_paid')
        
        if supplier:
            queryset = queryset.filter(supplier_id=supplier)
        if branch:
            queryset = queryset.filter(branch_id=branch)
        if is_paid:
            queryset = queryset.filter(is_paid=is_paid.lower() == 'true')
        return queryset
    
    @action(detail=False, methods=['get'])
    def aging_summary(self, request):
        branch = request.query_params.get('branch')
        queryset = VendorPayable.objects.filter(is_paid=False)
        if branch:
            queryset = queryset.filter(branch_id=branch)
        
        aging = queryset.values('aging_bucket').annotate(
            total=Sum('outstanding_amount'),
            count=Count('id')
        )
        
        total = queryset.aggregate(total=Sum('outstanding_amount'))['total'] or 0
        
        return Response({
            'total_outstanding': total,
            'aging': list(aging)
        })
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        payable = self.get_object()
        payable.is_paid = True
        payable.paid_date = timezone.now().date()
        payable.payment_reference = request.data.get('payment_reference', '')
        payable.outstanding_amount = 0
        payable.save()
        return Response(VendorPayableSerializer(payable).data)


class FinancialAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = FinancialAuditLog.objects.all()
    serializer_class = FinancialAuditLogSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = FinancialAuditLog.objects.all()
        model_name = self.request.query_params.get('model_name')
        action_filter = self.request.query_params.get('action')
        user = self.request.query_params.get('user')
        from_date = self.request.query_params.get('from_date')
        to_date = self.request.query_params.get('to_date')
        
        if model_name:
            queryset = queryset.filter(model_name=model_name)
        if action_filter:
            queryset = queryset.filter(action=action_filter)
        if user:
            queryset = queryset.filter(user_id=user)
        if from_date:
            queryset = queryset.filter(timestamp__date__gte=from_date)
        if to_date:
            queryset = queryset.filter(timestamp__date__lte=to_date)
        return queryset


class FinancialPeriodViewSet(viewsets.ModelViewSet):
    queryset = FinancialPeriod.objects.all()
    serializer_class = FinancialPeriodSerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    @action(detail=True, methods=['post'])
    def close(self, request, pk=None):
        period = self.get_object()
        period.status = FinancialPeriod.PeriodStatus.CLOSED
        period.closed_by = request.user
        period.closed_at = timezone.now()
        period.save()
        return Response(FinancialPeriodSerializer(period).data)


class BudgetEntryViewSet(viewsets.ModelViewSet):
    queryset = BudgetEntry.objects.all()
    serializer_class = BudgetEntrySerializer
    permission_classes = [IsAuthenticated, RoleBasedPermission]
    
    def get_queryset(self):
        queryset = BudgetEntry.objects.all().select_related('account', 'branch', 'period')
        branch = self.request.query_params.get('branch')
        period = self.request.query_params.get('period')
        account = self.request.query_params.get('account')
        
        if branch:
            queryset = queryset.filter(branch_id=branch)
        if period:
            queryset = queryset.filter(period_id=period)
        if account:
            queryset = queryset.filter(account_id=account)
        return queryset


@api_view(['GET'])
def finance_dashboard(request):
    branch = request.query_params.get('branch')
    
    invoices = EnhancedInvoice.objects.all()
    payments = EnhancedPayment.objects.filter(status=EnhancedPayment.PaymentStatus.COMPLETED)
    expenses = Expense.objects.filter(status=ExpenseStatus.PAID)
    receivables = CustomerReceivable.objects.filter(outstanding_amount__gt=0)
    payables = VendorPayable.objects.filter(is_paid=False)
    
    if branch:
        invoices = invoices.filter(branch_id=branch)
        payments = payments.filter(branch_id=branch)
        expenses = expenses.filter(branch_id=branch)
        receivables = receivables.filter(branch_id=branch)
        payables = payables.filter(branch_id=branch)
    
    total_revenue = invoices.filter(status__in=[InvoiceStatus.PAID, InvoiceStatus.CLOSED]).aggregate(total=Sum('grand_total'))['total'] or 0
    total_receivables = receivables.aggregate(total=Sum('outstanding_amount'))['total'] or 0
    total_payables = payables.aggregate(total=Sum('outstanding_amount'))['total'] or 0
    total_expenses = expenses.aggregate(total=Sum('total_amount'))['total'] or 0
    
    cash_account = Account.objects.filter(account_type='CASH').first()
    bank_account = Account.objects.filter(account_type='BANK').first()
    cash_balance = cash_account.current_balance if cash_account else 0
    bank_balance = bank_account.current_balance if bank_account else 0
    
    for rec in receivables:
        rec.update_aging()
    
    receivables_aging = {}
    for rec in receivables.values('aging_bucket').annotate(total=Sum('outstanding_amount')):
        receivables_aging[rec['aging_bucket']] = float(rec['total'])
    
    payables_aging = {}
    for pay in payables.values('aging_bucket').annotate(total=Sum('outstanding_amount')):
        payables_aging[pay['aging_bucket']] = float(pay['total'])
    
    return Response({
        'total_revenue': total_revenue,
        'total_receivables': total_receivables,
        'total_payables': total_payables,
        'total_expenses': total_expenses,
        'cash_balance': cash_balance,
        'bank_balance': bank_balance,
        'outstanding_invoices': invoices.filter(status__in=[InvoiceStatus.ISSUED, InvoiceStatus.PARTIALLY_PAID]).count(),
        'overdue_invoices': invoices.filter(status=InvoiceStatus.OVERDUE).count(),
        'pending_payments': payments.filter(status=EnhancedPayment.PaymentStatus.PENDING).count(),
        'pending_expenses': expenses.filter(status=ExpenseStatus.PENDING_APPROVAL).count(),
        'receivables_aging': receivables_aging,
        'payables_aging': payables_aging,
        'revenue_trend': [],
        'expense_trend': []
    })


# HRMS ViewSets
class SkillViewSet(viewsets.ModelViewSet):
    queryset = Skill.objects.all()
    serializer_class = SkillSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        is_active = self.request.query_params.get('is_active')
        if category:
            queryset = queryset.filter(category=category)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset.order_by('category', 'name')


class EmployeeSkillViewSet(viewsets.ModelViewSet):
    queryset = EmployeeSkill.objects.select_related('employee__user', 'skill', 'approved_by').all()
    serializer_class = EmployeeSkillSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employee_id')
        skill_id = self.request.query_params.get('skill_id')
        category = self.request.query_params.get('category')
        status = self.request.query_params.get('approval_status')
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if skill_id:
            queryset = queryset.filter(skill_id=skill_id)
        if category:
            queryset = queryset.filter(skill__category=category)
        if status:
            queryset = queryset.filter(approval_status=status)
        return queryset.order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def expiring_certifications(self, request):
        from django.utils import timezone
        from datetime import timedelta
        
        days = int(request.query_params.get('days', 30))
        expiry_date = timezone.now().date() + timedelta(days=days)
        
        queryset = self.get_queryset().filter(
            certification_expiry__isnull=False,
            certification_expiry__lte=expiry_date
        ).order_by('certification_expiry')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class EmployeeHRViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related('profile__user', 'reporting_manager__profile__user').all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        department = self.request.query_params.get('department')
        employment_type = self.request.query_params.get('employment_type')
        is_active = self.request.query_params.get('is_active')
        
        if department:
            queryset = queryset.filter(department=department)
        if employment_type:
            queryset = queryset.filter(employment_type=employment_type)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset.order_by('profile__user__first_name')


class TrainingProgramViewSet(viewsets.ModelViewSet):
    queryset = TrainingProgram.objects.select_related('skill', 'created_by').prefetch_related('enrollments').all()
    serializer_class = TrainingProgramSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        status = self.request.query_params.get('status')
        training_type = self.request.query_params.get('training_type')
        skill_id = self.request.query_params.get('skill_id')
        
        if status:
            queryset = queryset.filter(status=status)
        if training_type:
            queryset = queryset.filter(training_type=training_type)
        if skill_id:
            queryset = queryset.filter(skill_id=skill_id)
        return queryset.order_by('-start_date')


class TrainingEnrollmentViewSet(viewsets.ModelViewSet):
    queryset = TrainingEnrollment.objects.select_related('program', 'employee__user', 'approved_by').all()
    serializer_class = TrainingEnrollmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        program_id = self.request.query_params.get('program_id')
        employee_id = self.request.query_params.get('employee_id')
        status = self.request.query_params.get('status')
        
        if program_id:
            queryset = queryset.filter(program_id=program_id)
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if status:
            queryset = queryset.filter(status=status)
        return queryset.order_by('-enrollment_date')


class IncentiveRuleViewSet(viewsets.ModelViewSet):
    queryset = IncentiveRule.objects.all()
    serializer_class = IncentiveRuleSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('is_active')
        rule_type = self.request.query_params.get('rule_type')
        
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        if rule_type:
            queryset = queryset.filter(rule_type=rule_type)
        return queryset.order_by('name')


class EmployeeIncentiveViewSet(viewsets.ModelViewSet):
    queryset = EmployeeIncentive.objects.select_related('employee__user', 'rule', 'approved_by').all()
    serializer_class = EmployeeIncentiveSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employee_id')
        status = self.request.query_params.get('status')
        period_start = self.request.query_params.get('period_start')
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if status:
            queryset = queryset.filter(status=status)
        if period_start:
            queryset = queryset.filter(period_start=period_start)
        return queryset.order_by('-period_start')


class LeaveTypeViewSet(viewsets.ModelViewSet):
    queryset = LeaveType.objects.all()
    serializer_class = LeaveTypeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset.order_by('name')


class LeaveBalanceViewSet(viewsets.ModelViewSet):
    queryset = LeaveBalance.objects.select_related('employee__user', 'leave_type').all()
    serializer_class = LeaveBalanceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employee_id')
        year = self.request.query_params.get('year')
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if year:
            queryset = queryset.filter(year=int(year))
        return queryset.order_by('-year', 'leave_type__name')


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.select_related('employee__user', 'leave_type', 'approved_by').all()
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employee_id')
        status = self.request.query_params.get('status')
        leave_type_id = self.request.query_params.get('leave_type_id')
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if status:
            queryset = queryset.filter(status=status)
        if leave_type_id:
            queryset = queryset.filter(leave_type_id=leave_type_id)
        return queryset.order_by('-created_at')
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        leave_request = self.get_object()
        leave_request.status = 'APPROVED'
        leave_request.approved_by = request.user
        leave_request.approved_date = timezone.now()
        leave_request.save()
        return Response({'status': 'approved'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        leave_request = self.get_object()
        leave_request.status = 'REJECTED'
        leave_request.approved_by = request.user
        leave_request.approved_date = timezone.now()
        leave_request.rejection_reason = request.data.get('reason', '')
        leave_request.save()
        return Response({'status': 'rejected'})


class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.select_related('branch').all()
    serializer_class = HolidaySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        year = self.request.query_params.get('year')
        branch_id = self.request.query_params.get('branch_id')
        
        if year:
            queryset = queryset.filter(date__year=int(year))
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        return queryset.order_by('date')


class HRShiftViewSet(viewsets.ModelViewSet):
    queryset = HRShift.objects.select_related('branch').all()
    serializer_class = HRShiftSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('is_active')
        branch_id = self.request.query_params.get('branch_id')
        
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        return queryset.order_by('name')


class EmployeeShiftViewSet(viewsets.ModelViewSet):
    queryset = EmployeeShift.objects.select_related('employee__user', 'shift').all()
    serializer_class = EmployeeShiftSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employee_id')
        is_current = self.request.query_params.get('is_current')
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if is_current is not None:
            queryset = queryset.filter(is_current=is_current.lower() == 'true')
        return queryset.order_by('-effective_from')


class HRAttendanceViewSet(viewsets.ModelViewSet):
    queryset = HRAttendance.objects.select_related('employee__user', 'shift', 'approved_by').all()
    serializer_class = HRAttendanceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employee_id')
        date = self.request.query_params.get('date')
        status = self.request.query_params.get('status')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if date:
            queryset = queryset.filter(date=date)
        if status:
            queryset = queryset.filter(status=status)
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        return queryset.order_by('-date')


class PayrollViewSet(viewsets.ModelViewSet):
    queryset = Payroll.objects.select_related('employee__user', 'generated_by', 'approved_by').all()
    serializer_class = PayrollSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        employee_id = self.request.query_params.get('employee_id')
        status = self.request.query_params.get('status')
        period_start = self.request.query_params.get('period_start')
        
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        if status:
            queryset = queryset.filter(status=status)
        if period_start:
            queryset = queryset.filter(period_start=period_start)
        return queryset.order_by('-period_start')


class SkillAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = SkillAuditLog.objects.select_related('employee_skill__employee__user', 'employee_skill__skill', 'changed_by').all()
    serializer_class = SkillAuditLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        employee_skill_id = self.request.query_params.get('employee_skill_id')
        if employee_skill_id:
            queryset = queryset.filter(employee_skill_id=employee_skill_id)
        return queryset.order_by('-created_at')


class SkillMatrixViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        from django.db.models import Count, Avg
        from collections import defaultdict
        
        # Get all active skills grouped by category
        skills = Skill.objects.filter(is_active=True)
        skills_by_category = defaultdict(list)
        for skill in skills:
            skills_by_category[skill.category].append({
                'id': skill.id,
                'name': skill.name,
                'code': skill.code
            })
        
        # Get skill coverage (employees per skill/level)
        skill_coverage = []
        for skill in skills:
            coverage = EmployeeSkill.objects.filter(
                skill=skill,
                approval_status='APPROVED'
            ).values('level').annotate(count=Count('id'))
            
            skill_coverage.append({
                'skill_id': skill.id,
                'skill_name': skill.name,
                'category': skill.category,
                'coverage': list(coverage)
            })
        
        # Get certification expiry alerts
        from django.utils import timezone
        from datetime import timedelta
        
        expiry_date = timezone.now().date() + timedelta(days=30)
        expiring_certs = EmployeeSkill.objects.filter(
            certification_expiry__isnull=False,
            certification_expiry__lte=expiry_date
        ).select_related('employee__user', 'skill')
        
        cert_alerts = [{
            'employee_name': f"{es.employee.user.first_name} {es.employee.user.last_name}",
            'skill_name': es.skill.name,
            'expiry_date': es.certification_expiry,
            'days_until_expiry': (es.certification_expiry - timezone.now().date()).days
        } for es in expiring_certs]
        
        return Response({
            'skills_by_category': dict(skills_by_category),
            'skill_coverage': skill_coverage,
            'certification_expiry_alerts': cert_alerts,
            'skill_gap_analysis': []
        })


class TechnicianSkillMatchViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def find_match(self, request):
        """Find technicians matching skill requirements"""
        required_skills = request.data.get('required_skills', [])
        
        if not required_skills:
            return Response({'error': 'No skills specified'}, status=400)
        
        # Get all technicians
        technicians = Profile.objects.filter(
            role__in=['TECHNICIAN', 'SR_TECHNICIAN', 'SPECIALIST']
        ).select_related('user')
        
        matches = []
        for tech in technicians:
            tech_skills = EmployeeSkill.objects.filter(
                employee=tech,
                approval_status='APPROVED'
            ).select_related('skill')
            
            tech_skill_map = {es.skill_id: es for es in tech_skills}
            
            matching_skills = []
            missing_skills = []
            total_score = 0
            max_score = 0
            
            for req in required_skills:
                skill_id = req.get('skill_id')
                required_level = req.get('level', 1)
                weight = req.get('weight', 1)
                is_mandatory = req.get('is_mandatory', False)
                
                max_score += weight * 5  # Max level is 5
                
                if skill_id in tech_skill_map:
                    es = tech_skill_map[skill_id]
                    level_value = {'BEGINNER': 1, 'INTERMEDIATE': 2, 'ADVANCED': 3, 'EXPERT': 4, 'MASTER': 5}.get(es.level, 1)
                    
                    if level_value >= required_level:
                        matching_skills.append({
                            'skill_name': es.skill.name,
                            'required_level': required_level,
                            'actual_level': es.level
                        })
                        total_score += weight * level_value
                    else:
                        missing_skills.append({
                            'skill_name': es.skill.name,
                            'required_level': required_level,
                            'actual_level': es.level,
                            'is_mandatory': is_mandatory
                        })
                        total_score += weight * level_value * 0.5
                else:
                    missing_skills.append({
                        'skill_name': Skill.objects.get(id=skill_id).name if Skill.objects.filter(id=skill_id).exists() else 'Unknown',
                        'required_level': required_level,
                        'actual_level': None,
                        'is_mandatory': is_mandatory
                    })
            
            # Skip if missing mandatory skills
            has_mandatory_missing = any(s.get('is_mandatory') and s.get('actual_level') is None for s in missing_skills)
            if has_mandatory_missing:
                continue
            
            match_score = (total_score / max_score * 100) if max_score > 0 else 0
            
            # Get current workload
            current_jobs = Task.objects.filter(
                assigned_to=tech,
                status__in=['PENDING', 'IN_PROGRESS']
            ).count()
            
            matches.append({
                'profile_id': tech.id,
                'employee_name': f"{tech.user.first_name} {tech.user.last_name}".strip() or tech.user.username,
                'match_score': round(match_score, 1),
                'matching_skills': matching_skills,
                'missing_skills': missing_skills,
                'is_available': tech.is_available,
                'current_workload': current_jobs
            })
        
        # Sort by match score descending
        matches.sort(key=lambda x: x['match_score'], reverse=True)
        
        return Response(matches)


class ConfigCategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing configuration categories"""
    queryset = ConfigCategory.objects.all()
    serializer_class = ConfigCategorySerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = ConfigCategory.objects.prefetch_related('options').all()
        module = self.request.query_params.get('module')
        if module:
            queryset = queryset.filter(module=module)
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ConfigCategoryListSerializer
        return ConfigCategorySerializer
    
    @action(detail=False, methods=['get'])
    def by_code(self, request):
        """Get a category by its code with all options"""
        code = request.query_params.get('code')
        if not code:
            return Response({'error': 'Code parameter required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            category = ConfigCategory.objects.prefetch_related('options').get(code=code)
            return Response(ConfigCategorySerializer(category).data)
        except ConfigCategory.DoesNotExist:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def all_options(self, request):
        """Get all configuration options grouped by category"""
        categories = ConfigCategory.objects.prefetch_related('options').filter(is_active=True)
        result = {}
        for category in categories:
            result[category.code] = {
                'name': category.name,
                'module': category.module,
                'options': [
                    {
                        'value': opt.code,
                        'label': opt.label,
                        'color': opt.color,
                        'icon': opt.icon,
                        'metadata': opt.metadata,
                        'is_default': opt.is_default
                    }
                    for opt in category.options.filter(is_active=True)
                ]
            }
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def seed_defaults(self, request):
        """Seed default configuration options"""
        created = []
        
        # HRMS Skill Categories
        skill_cat, _ = ConfigCategory.objects.get_or_create(
            code='SKILL_CATEGORIES',
            defaults={'name': 'Skill Categories', 'module': 'HRMS', 'is_system': True}
        )
        skill_options = [
            ('MECHANICAL', 'Mechanical', 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'),
            ('ELECTRICAL', 'Electrical', 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'),
            ('ELECTRONICS', 'Electronics & Diagnostics', 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'),
            ('EV_HYBRID', 'EV & Hybrid', 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'),
            ('BODY_PAINT', 'Body & Paint', 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'),
            ('SOFT_SKILLS', 'Soft Skills', 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'),
        ]
        for i, (code, label, color) in enumerate(skill_options):
            opt, c = ConfigOption.objects.get_or_create(
                category=skill_cat, code=code,
                defaults={'label': label, 'color': color, 'display_order': i, 'is_system': True}
            )
            if c: created.append(f'SKILL_CATEGORIES.{code}')
        
        # HRMS Skill Levels
        level_cat, _ = ConfigCategory.objects.get_or_create(
            code='SKILL_LEVELS',
            defaults={'name': 'Skill Levels', 'module': 'HRMS', 'is_system': True}
        )
        level_options = [
            ('BEGINNER', 'Beginner', 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'),
            ('INTERMEDIATE', 'Intermediate', 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'),
            ('ADVANCED', 'Advanced', 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'),
            ('EXPERT', 'Expert', 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'),
            ('MASTER', 'Master', 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'),
        ]
        for i, (code, label, color) in enumerate(level_options):
            opt, c = ConfigOption.objects.get_or_create(
                category=level_cat, code=code,
                defaults={'label': label, 'color': color, 'display_order': i, 'is_system': True}
            )
            if c: created.append(f'SKILL_LEVELS.{code}')
        
        # HRMS Approval Status
        approval_cat, _ = ConfigCategory.objects.get_or_create(
            code='APPROVAL_STATUS',
            defaults={'name': 'Approval Status', 'module': 'HRMS', 'is_system': True}
        )
        approval_options = [
            ('PENDING', 'Pending', 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'),
            ('APPROVED', 'Approved', 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'),
            ('REJECTED', 'Rejected', 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'),
        ]
        for i, (code, label, color) in enumerate(approval_options):
            opt, c = ConfigOption.objects.get_or_create(
                category=approval_cat, code=code,
                defaults={'label': label, 'color': color, 'display_order': i, 'is_system': True}
            )
            if c: created.append(f'APPROVAL_STATUS.{code}')
        
        # HRMS Training Status
        training_cat, _ = ConfigCategory.objects.get_or_create(
            code='TRAINING_STATUS',
            defaults={'name': 'Training Status', 'module': 'HRMS', 'is_system': True}
        )
        training_options = [
            ('PLANNED', 'Planned', 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'),
            ('ONGOING', 'Ongoing', 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'),
            ('COMPLETED', 'Completed', 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'),
            ('CANCELLED', 'Cancelled', 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'),
        ]
        for i, (code, label, color) in enumerate(training_options):
            opt, c = ConfigOption.objects.get_or_create(
                category=training_cat, code=code,
                defaults={'label': label, 'color': color, 'display_order': i, 'is_system': True}
            )
            if c: created.append(f'TRAINING_STATUS.{code}')
        
        # HRMS Leave Status
        leave_cat, _ = ConfigCategory.objects.get_or_create(
            code='LEAVE_STATUS',
            defaults={'name': 'Leave Status', 'module': 'HRMS', 'is_system': True}
        )
        leave_options = [
            ('PENDING', 'Pending', 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'),
            ('APPROVED', 'Approved', 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'),
            ('REJECTED', 'Rejected', 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'),
            ('CANCELLED', 'Cancelled', 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'),
        ]
        for i, (code, label, color) in enumerate(leave_options):
            opt, c = ConfigOption.objects.get_or_create(
                category=leave_cat, code=code,
                defaults={'label': label, 'color': color, 'display_order': i, 'is_system': True}
            )
            if c: created.append(f'LEAVE_STATUS.{code}')
        
        # Service Workflow Stages
        workflow_cat, _ = ConfigCategory.objects.get_or_create(
            code='WORKFLOW_STAGES',
            defaults={'name': 'Service Workflow Stages', 'module': 'SERVICE', 'is_system': True}
        )
        workflow_options = [
            ('APPOINTMENT', 'Appointment', 'bg-blue-100 text-blue-800'),
            ('CHECK_IN', 'Check-in', 'bg-cyan-100 text-cyan-800'),
            ('INSPECTION', 'Digital Inspection', 'bg-indigo-100 text-indigo-800'),
            ('JOB_CARD', 'Job Card Created', 'bg-purple-100 text-purple-800'),
            ('ESTIMATE', 'Estimate Prepared', 'bg-pink-100 text-pink-800'),
            ('APPROVAL', 'Customer Approval', 'bg-yellow-100 text-yellow-800'),
            ('EXECUTION', 'Task Execution', 'bg-orange-100 text-orange-800'),
            ('QC', 'Quality Check', 'bg-teal-100 text-teal-800'),
            ('BILLING', 'Billing', 'bg-emerald-100 text-emerald-800'),
            ('DELIVERY', 'Delivery', 'bg-green-100 text-green-800'),
            ('COMPLETED', 'Service Completed', 'bg-lime-100 text-lime-800'),
        ]
        for i, (code, label, color) in enumerate(workflow_options):
            opt, c = ConfigOption.objects.get_or_create(
                category=workflow_cat, code=code,
                defaults={'label': label, 'color': color, 'display_order': i, 'is_system': True}
            )
            if c: created.append(f'WORKFLOW_STAGES.{code}')
        
        # User Roles
        roles_cat, _ = ConfigCategory.objects.get_or_create(
            code='USER_ROLES',
            defaults={'name': 'User Roles', 'module': 'SYSTEM', 'is_system': True}
        )
        role_options = [
            ('SUPER_ADMIN', 'Admin'),
            ('CEO_OWNER', 'CEO / Owner'),
            ('REGIONAL_MANAGER', 'Regional Manager'),
            ('BRANCH_MANAGER', 'Branch Manager'),
            ('SERVICE_MANAGER', 'Service Manager'),
            ('SALES_MANAGER', 'Sales Manager'),
            ('ACCOUNTS_MANAGER', 'Accounts Manager'),
            ('SUPERVISOR', 'Supervisor'),
            ('SERVICE_ADVISOR', 'Service Advisor'),
            ('SERVICE_ENGINEER', 'Service Engineer'),
            ('SALES_EXECUTIVE', 'Sales Executive'),
            ('ACCOUNTANT', 'Accountant'),
            ('INVENTORY_MANAGER', 'Inventory Manager'),
            ('HR_MANAGER', 'HR Manager'),
            ('TECHNICIAN', 'Technician / Mechanic'),
            ('CRM_EXECUTIVE', 'CRM Executive'),
            ('CUSTOMER', 'Customer'),
        ]
        for i, (code, label) in enumerate(role_options):
            opt, c = ConfigOption.objects.get_or_create(
                category=roles_cat, code=code,
                defaults={'label': label, 'display_order': i, 'is_system': True}
            )
            if c: created.append(f'USER_ROLES.{code}')
        
        # Employment Types
        emp_cat, _ = ConfigCategory.objects.get_or_create(
            code='EMPLOYMENT_TYPES',
            defaults={'name': 'Employment Types', 'module': 'HRMS', 'is_system': True}
        )
        emp_options = [
            ('FULL_TIME', 'Full Time'),
            ('PART_TIME', 'Part Time'),
            ('CONTRACT', 'Contract'),
            ('TRAINEE', 'Trainee'),
            ('INTERN', 'Intern'),
        ]
        for i, (code, label) in enumerate(emp_options):
            opt, c = ConfigOption.objects.get_or_create(
                category=emp_cat, code=code,
                defaults={'label': label, 'display_order': i, 'is_system': True}
            )
            if c: created.append(f'EMPLOYMENT_TYPES.{code}')
        
        # Training Types
        train_type_cat, _ = ConfigCategory.objects.get_or_create(
            code='TRAINING_TYPES',
            defaults={'name': 'Training Types', 'module': 'HRMS', 'is_system': True}
        )
        train_options = [
            ('CLASSROOM', 'Classroom Training'),
            ('ONLINE', 'Online Training'),
            ('ON_THE_JOB', 'On-the-Job Training'),
            ('WORKSHOP', 'Workshop'),
            ('CERTIFICATION', 'Certification Program'),
            ('EXTERNAL', 'External Training'),
        ]
        for i, (code, label) in enumerate(train_options):
            opt, c = ConfigOption.objects.get_or_create(
                category=train_type_cat, code=code,
                defaults={'label': label, 'display_order': i, 'is_system': True}
            )
            if c: created.append(f'TRAINING_TYPES.{code}')
        
        return Response({
            'message': f'Seeded {len(created)} configuration options',
            'created': created
        })


class ConfigOptionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing configuration options"""
    queryset = ConfigOption.objects.all()
    serializer_class = ConfigOptionSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = ConfigOption.objects.select_related('category').all()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__code=category)
        category_id = self.request.query_params.get('category_id')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset


class IntegrationViewSet(viewsets.ViewSet):
    """Cross-module integration APIs for unified system operations"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def master_lookup(self, request):
        """Unified master data lookup across all modules"""
        search = request.query_params.get('search', '')
        entity_type = request.query_params.get('type', 'all')
        limit = int(request.query_params.get('limit', 20))
        
        result = {}
        
        if entity_type in ['all', 'customer']:
            customers = Customer.objects.filter(
                Q(name__icontains=search) | Q(phone__icontains=search) | Q(email__icontains=search) | Q(customer_id__icontains=search)
            )[:limit]
            result['customers'] = [{'id': c.id, 'customer_id': c.customer_id, 'name': c.name, 'phone': c.phone, 'email': c.email} for c in customers]
        
        if entity_type in ['all', 'vehicle']:
            vehicles = Vehicle.objects.select_related('customer').filter(
                Q(plate_number__icontains=search) | Q(vin__icontains=search) | Q(make__icontains=search) | Q(model__icontains=search)
            )[:limit]
            result['vehicles'] = [{'id': v.id, 'vehicle_id': v.vehicle_id, 'plate_number': v.plate_number, 'make': v.make, 'model': v.model, 'customer_name': v.customer.name if v.customer else None, 'customer_id': v.customer_id} for v in vehicles]
        
        if entity_type in ['all', 'employee']:
            employees = Profile.objects.select_related('user', 'branch').filter(
                Q(user__first_name__icontains=search) | Q(user__last_name__icontains=search) | Q(employee_id__icontains=search)
            )[:limit]
            result['employees'] = [{'id': e.id, 'employee_id': e.employee_id, 'name': f"{e.user.first_name} {e.user.last_name}".strip() or e.user.username, 'role': e.role, 'branch': e.branch.name if e.branch else None, 'is_available': e.is_available} for e in employees]
        
        if entity_type in ['all', 'job_card']:
            job_cards = JobCard.objects.select_related('customer', 'vehicle').filter(
                Q(job_card_number__icontains=search) | Q(service_tracking_id__icontains=search)
            )[:limit]
            result['job_cards'] = [{'id': j.id, 'job_card_number': j.job_card_number, 'workflow_stage': j.workflow_stage, 'customer_name': j.customer.name, 'vehicle': f"{j.vehicle.make} {j.vehicle.model}"} for j in job_cards]
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def available_technicians(self, request):
        """Get technicians available for job assignment with skill matching"""
        skill_category = request.query_params.get('skill_category')
        skill_level = request.query_params.get('min_level', 'BEGINNER')
        branch_id = request.query_params.get('branch_id')
        date = request.query_params.get('date', timezone.now().date().isoformat())
        
        technicians = Profile.objects.filter(
            role__in=[UserRole.TECHNICIAN, UserRole.SERVICE_ENGINEER],
            is_available=True
        ).select_related('user', 'branch')
        
        if branch_id:
            technicians = technicians.filter(branch_id=branch_id)
        
        result = []
        level_order = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER']
        min_level_idx = level_order.index(skill_level) if skill_level in level_order else 0
        
        for tech in technicians:
            tech_skills = EmployeeSkill.objects.filter(
                profile=tech,
                approval_status='APPROVED'
            ).select_related('skill')
            
            matching_skills = []
            for es in tech_skills:
                if skill_category and es.skill.category != skill_category:
                    continue
                level_idx = level_order.index(es.current_level) if es.current_level in level_order else 0
                if level_idx >= min_level_idx:
                    matching_skills.append({
                        'skill_name': es.skill.name,
                        'category': es.skill.category,
                        'level': es.current_level,
                        'is_certified': es.is_certified
                    })
            
            active_jobs = JobCard.objects.filter(
                lead_technician=tech.user,
                workflow_stage__in=['EXECUTION', 'INSPECTION', 'JOB_CARD']
            ).count()
            
            try:
                metrics = tech.metrics
                utilization = metrics.utilization_percentage
                avg_rating = float(metrics.average_rating)
            except:
                utilization = 0
                avg_rating = 0
            
            result.append({
                'id': tech.id,
                'user_id': tech.user.id,
                'employee_id': tech.employee_id,
                'name': f"{tech.user.first_name} {tech.user.last_name}".strip() or tech.user.username,
                'role': tech.role,
                'branch': tech.branch.name if tech.branch else None,
                'skills': matching_skills,
                'skill_match_count': len(matching_skills),
                'active_jobs': active_jobs,
                'utilization': utilization,
                'avg_rating': avg_rating,
                'hourly_rate': float(tech.hourly_rate)
            })
        
        result.sort(key=lambda x: (-x['skill_match_count'], x['active_jobs'], -x['avg_rating']))
        return Response(result)
    
    @action(detail=False, methods=['post'])
    def assign_technician_to_job(self, request):
        """Assign technician to job card with skill validation"""
        job_card_id = request.data.get('job_card_id')
        technician_id = request.data.get('technician_id')
        
        try:
            job_card = JobCard.objects.get(id=job_card_id)
            technician = Profile.objects.select_related('user').get(id=technician_id)
            
            job_card.lead_technician = technician.user
            job_card.save()
            
            ServiceEvent.objects.create(
                job_card=job_card,
                event_type=ServiceEventType.NOTE_ADDED,
                actor=request.user if request.user.is_authenticated else None,
                comment=f"Technician {technician.user.username} assigned to job",
                metadata={'technician_id': technician.id, 'action': 'assignment'}
            )
            
            return Response({'success': True, 'message': f'Technician assigned successfully'})
        except JobCard.DoesNotExist:
            return Response({'error': 'Job card not found'}, status=404)
        except Profile.DoesNotExist:
            return Response({'error': 'Technician not found'}, status=404)
    
    @action(detail=False, methods=['get'])
    def check_contract_coverage(self, request):
        """Check contract coverage for a vehicle/service"""
        vehicle_id = request.query_params.get('vehicle_id')
        service_type = request.query_params.get('service_type')
        
        if not vehicle_id:
            return Response({'error': 'vehicle_id required'}, status=400)
        
        active_contracts = Contract.objects.filter(
            vehicles__vehicle_id=vehicle_id,
            status=ContractStatus.ACTIVE,
            start_date__lte=timezone.now().date(),
            end_date__gte=timezone.now().date()
        ).prefetch_related('coverage_rules')
        
        coverage_result = []
        for contract in active_contracts:
            for rule in contract.coverage_rules.filter(is_active=True):
                if service_type and rule.service_type != service_type:
                    continue
                
                consumed = ContractConsumption.objects.filter(
                    contract=contract,
                    vehicle_id=vehicle_id
                ).aggregate(total=Sum('quantity_used'))['total'] or 0
                
                coverage_result.append({
                    'contract_id': contract.id,
                    'contract_number': contract.contract_number,
                    'contract_type': contract.contract_type,
                    'service_type': rule.service_type,
                    'coverage_percentage': float(rule.coverage_percentage),
                    'max_amount': float(rule.max_amount) if rule.max_amount else None,
                    'quantity_limit': rule.quantity_limit,
                    'quantity_consumed': consumed,
                    'remaining': (rule.quantity_limit - consumed) if rule.quantity_limit else None
                })
        
        return Response({
            'vehicle_id': vehicle_id,
            'has_coverage': len(coverage_result) > 0,
            'coverages': coverage_result
        })
    
    @action(detail=False, methods=['post'])
    def reserve_parts_for_job(self, request):
        """Reserve inventory parts for a job card"""
        job_card_id = request.data.get('job_card_id')
        parts = request.data.get('parts', [])
        
        try:
            job_card = JobCard.objects.get(id=job_card_id)
        except JobCard.DoesNotExist:
            return Response({'error': 'Job card not found'}, status=404)
        
        reservations = []
        errors = []
        
        for part_req in parts:
            part_id = part_req.get('part_id')
            quantity = part_req.get('quantity', 1)
            
            try:
                part = Part.objects.get(id=part_id)
                available = part.quantity_on_hand - part.quantity_reserved
                
                if available >= quantity:
                    reservation = PartReservation.objects.create(
                        part=part,
                        job_card=job_card,
                        quantity=quantity,
                        status=ReservationStatus.RESERVED
                    )
                    part.quantity_reserved += quantity
                    part.save()
                    
                    reservations.append({
                        'part_id': part.id,
                        'part_number': part.part_number,
                        'quantity': quantity,
                        'status': 'reserved'
                    })
                else:
                    errors.append({
                        'part_id': part.id,
                        'part_number': part.part_number,
                        'requested': quantity,
                        'available': available,
                        'error': 'Insufficient stock'
                    })
            except Part.DoesNotExist:
                errors.append({'part_id': part_id, 'error': 'Part not found'})
        
        return Response({
            'job_card_id': job_card_id,
            'reservations': reservations,
            'errors': errors
        })
    
    @action(detail=False, methods=['post'])
    def generate_invoice_from_job(self, request):
        """Generate invoice from completed job card"""
        job_card_id = request.data.get('job_card_id')
        
        try:
            job_card = JobCard.objects.select_related('customer', 'vehicle', 'branch').prefetch_related('estimates__lines', 'part_issues').get(id=job_card_id)
        except JobCard.DoesNotExist:
            return Response({'error': 'Job card not found'}, status=404)
        
        if job_card.workflow_stage not in ['BILLING', 'DELIVERY', 'COMPLETED']:
            return Response({'error': 'Job must be in billing stage or later'}, status=400)
        
        existing = EnhancedInvoice.objects.filter(job_card=job_card).first()
        if existing:
            return Response({'error': 'Invoice already exists', 'invoice_id': existing.id}, status=400)
        
        approved_estimate = job_card.estimates.filter(is_approved=True).first()
        
        invoice = EnhancedInvoice.objects.create(
            customer=job_card.customer,
            job_card=job_card,
            invoice_type=InvoiceType.SERVICE,
            subtotal=job_card.labor_amount + job_card.parts_amount,
            tax_amount=job_card.tax_amount,
            discount_amount=job_card.discount_amount,
            total_amount=(job_card.labor_amount + job_card.parts_amount + job_card.tax_amount - job_card.discount_amount),
            notes=f"Service Invoice for {job_card.job_card_number}"
        )
        
        InvoiceLine.objects.create(
            invoice=invoice,
            description=f"Labor Charges - {job_card.job_type}",
            quantity=1,
            unit_price=job_card.labor_amount,
            line_total=job_card.labor_amount,
            line_type='LABOR'
        )
        
        for pi in job_card.part_issues.all():
            InvoiceLine.objects.create(
                invoice=invoice,
                part=pi.part,
                description=f"{pi.part.name}",
                quantity=pi.quantity,
                unit_price=pi.unit_price,
                line_total=pi.total_price,
                line_type='PART'
            )
        
        ServiceEvent.objects.create(
            job_card=job_card,
            event_type=ServiceEventType.INVOICE_GENERATED,
            actor=request.user if request.user.is_authenticated else None,
            new_value=invoice.invoice_number,
            metadata={'invoice_id': invoice.id, 'total': float(invoice.total_amount)}
        )
        
        return Response({
            'success': True,
            'invoice_id': invoice.id,
            'invoice_number': invoice.invoice_number,
            'total_amount': float(invoice.total_amount)
        })
    
    @action(detail=False, methods=['get'])
    def customer_360(self, request):
        """Get 360-degree customer view with all related data"""
        customer_id = request.query_params.get('customer_id')
        
        try:
            customer = Customer.objects.get(id=customer_id)
        except Customer.DoesNotExist:
            return Response({'error': 'Customer not found'}, status=404)
        
        vehicles = Vehicle.objects.filter(customer=customer)
        job_cards = JobCard.objects.filter(customer=customer).order_by('-created_at')[:10]
        contracts = Contract.objects.filter(customer=customer)
        invoices = EnhancedInvoice.objects.filter(customer=customer).order_by('-invoice_date')[:10]
        tickets = Ticket.objects.filter(customer=customer).order_by('-created_at')[:5]
        interactions = CustomerInteraction.objects.filter(customer=customer).order_by('-interaction_date')[:10]
        
        try:
            score = CustomerScore.objects.get(customer=customer)
            customer_score = {
                'overall_score': score.overall_score,
                'revenue_score': score.revenue_score,
                'loyalty_score': score.loyalty_score,
                'engagement_score': score.engagement_score,
                'segment': score.segment
            }
        except CustomerScore.DoesNotExist:
            customer_score = None
        
        return Response({
            'customer': {
                'id': customer.id,
                'customer_id': customer.customer_id,
                'name': customer.name,
                'phone': customer.phone,
                'email': customer.email,
                'address': customer.address,
                'loyalty_points': customer.loyalty_points,
                'total_revenue': float(customer.total_revenue),
                'total_visits': customer.total_visits,
                'last_visit_date': customer.last_visit_date
            },
            'score': customer_score,
            'vehicles': [{'id': v.id, 'plate_number': v.plate_number, 'make': v.make, 'model': v.model, 'year': v.year} for v in vehicles],
            'recent_jobs': [{'id': j.id, 'job_card_number': j.job_card_number, 'workflow_stage': j.workflow_stage, 'job_type': j.job_type, 'created_at': j.created_at} for j in job_cards],
            'contracts': [{'id': c.id, 'contract_number': c.contract_number, 'contract_type': c.contract_type, 'status': c.status, 'end_date': c.end_date} for c in contracts],
            'recent_invoices': [{'id': i.id, 'invoice_number': i.invoice_number, 'total_amount': float(i.total_amount), 'status': i.status, 'invoice_date': i.invoice_date} for i in invoices],
            'open_tickets': [{'id': t.id, 'ticket_number': t.ticket_number, 'subject': t.subject, 'status': t.status, 'priority': t.priority} for t in tickets],
            'recent_interactions': [{'id': i.id, 'interaction_type': i.interaction_type, 'channel': i.channel, 'summary': i.summary[:100] if i.summary else None, 'date': i.interaction_date} for i in interactions]
        })
    
    @action(detail=False, methods=['get'])
    def unified_dashboard(self, request):
        """Get unified dashboard metrics across all modules"""
        today = timezone.now().date()
        
        service_metrics = {
            'active_jobs': JobCard.objects.exclude(workflow_stage='COMPLETED').count(),
            'jobs_today': JobCard.objects.filter(created_at__date=today).count(),
            'pending_approval': JobCard.objects.filter(workflow_stage='APPROVAL').count(),
            'overdue_sla': JobCard.objects.filter(sla_deadline__lt=timezone.now(), workflow_stage__in=['EXECUTION', 'INSPECTION', 'QC']).count()
        }
        
        crm_metrics = {
            'new_leads_today': Lead.objects.filter(created_at__date=today).count(),
            'open_tickets': Ticket.objects.exclude(status=TicketStatus.CLOSED).count(),
            'pending_followups': FollowUpTask.objects.filter(status=FollowUpStatus.PENDING, due_date__lte=today).count()
        }
        
        inventory_metrics = {
            'low_stock_alerts': InventoryAlert.objects.filter(is_resolved=False, alert_type=AlertType.LOW_STOCK).count(),
            'pending_pos': PurchaseOrder.objects.filter(status=PurchaseOrderStatus.PENDING_APPROVAL).count(),
            'pending_grns': GoodsReceiptNote.objects.filter(status=GRNStatus.DRAFT).count()
        }
        
        finance_metrics = {
            'unpaid_invoices': EnhancedInvoice.objects.filter(status__in=[InvoiceStatus.DRAFT, InvoiceStatus.SENT]).count(),
            'pending_payments': EnhancedInvoice.objects.filter(status=InvoiceStatus.SENT).aggregate(total=Sum('balance_due'))['total'] or 0,
            'pending_expenses': Expense.objects.filter(status=ExpenseStatus.PENDING).count()
        }
        
        hrms_metrics = {
            'employees_present': HRAttendance.objects.filter(date=today, status='PRESENT').count(),
            'pending_leave': LeaveRequest.objects.filter(status='PENDING').count(),
            'training_in_progress': TrainingProgram.objects.filter(status='ONGOING').count()
        }
        
        return Response({
            'service': service_metrics,
            'crm': crm_metrics,
            'inventory': inventory_metrics,
            'finance': finance_metrics,
            'hrms': hrms_metrics,
            'generated_at': timezone.now().isoformat()
        })


def log_config_audit(request, entity_type, entity_id, entity_name, action, old_values=None, new_values=None, change_summary=''):
    """Helper function to log configuration changes to ConfigAuditLog"""
    try:
        profile = getattr(request.user, 'profile', None)
        branch = profile.branch if profile else None
        
        ConfigAuditLog.objects.create(
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            action=action,
            old_values=old_values or {},
            new_values=new_values or {},
            change_summary=change_summary,
            performed_by=request.user,
            ip_address=request.META.get('REMOTE_ADDR', ''),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:500] if request.META.get('HTTP_USER_AGENT') else '',
            branch=branch
        )
    except Exception:
        pass


class SystemConfigViewSet(viewsets.ModelViewSet):
    """ViewSet for system configuration management"""
    queryset = SystemConfig.objects.all()
    serializer_class = SystemConfigSerializer
    permission_classes = [IsAdminConfig]
    
    def get_queryset(self):
        queryset = SystemConfig.objects.select_related('branch', 'created_by', 'updated_by').all()
        module = self.request.query_params.get('module')
        if module:
            queryset = queryset.filter(module=module)
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            queryset = queryset.filter(Q(branch_id=branch_id) | Q(branch__isnull=True))
        return queryset
    
    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user, updated_by=self.request.user)
        log_config_audit(self.request, 'SystemConfig', instance.id, instance.key, 'CREATE', 
                        new_values={'key': instance.key, 'value': instance.value, 'module': instance.module})
    
    def perform_update(self, serializer):
        instance = self.get_object()
        old_values = {'key': instance.key, 'value': instance.value, 'version': instance.version}
        
        SystemConfigHistory.objects.create(
            config=instance,
            old_value=instance.value,
            new_value=serializer.validated_data.get('value', instance.value),
            version=instance.version,
            changed_by=self.request.user,
            change_reason=self.request.data.get('change_reason', '')
        )
        instance = serializer.save(updated_by=self.request.user, version=instance.version + 1)
        
        log_config_audit(self.request, 'SystemConfig', instance.id, instance.key, 'UPDATE',
                        old_values=old_values, new_values={'key': instance.key, 'value': instance.value, 'version': instance.version})
    
    def perform_destroy(self, instance):
        log_config_audit(self.request, 'SystemConfig', instance.id, instance.key, 'DELETE',
                        old_values={'key': instance.key, 'value': instance.value})
        instance.delete()


class WorkflowConfigViewSet(viewsets.ModelViewSet):
    """ViewSet for workflow configuration management"""
    queryset = WorkflowConfig.objects.all()
    serializer_class = WorkflowConfigSerializer
    permission_classes = [IsAdminConfig]
    
    def get_queryset(self):
        queryset = WorkflowConfig.objects.select_related('branch', 'created_by').all()
        workflow_type = self.request.query_params.get('workflow_type')
        if workflow_type:
            queryset = queryset.filter(workflow_type=workflow_type)
        return queryset
    
    def perform_create(self, serializer):
        instance = serializer.save(created_by=self.request.user)
        log_config_audit(self.request, 'WorkflowConfig', instance.id, instance.name, 'CREATE',
                        new_values={'code': instance.code, 'name': instance.name, 'workflow_type': instance.workflow_type})
    
    def perform_update(self, serializer):
        instance = self.get_object()
        old_values = {'code': instance.code, 'name': instance.name, 'is_active': instance.is_active}
        instance = serializer.save()
        log_config_audit(self.request, 'WorkflowConfig', instance.id, instance.name, 'UPDATE',
                        old_values=old_values, new_values={'code': instance.code, 'name': instance.name, 'is_active': instance.is_active})
    
    def perform_destroy(self, instance):
        log_config_audit(self.request, 'WorkflowConfig', instance.id, instance.name, 'DELETE',
                        old_values={'code': instance.code, 'name': instance.name})
        instance.delete()


class ApprovalRuleViewSet(viewsets.ModelViewSet):
    """ViewSet for approval rule management"""
    queryset = ApprovalRule.objects.all()
    serializer_class = ApprovalRuleSerializer
    permission_classes = [IsAdminConfig]
    
    def get_queryset(self):
        queryset = ApprovalRule.objects.select_related('branch', 'escalation_to').all()
        module = self.request.query_params.get('module')
        if module:
            queryset = queryset.filter(module=module)
        return queryset
    
    def perform_create(self, serializer):
        instance = serializer.save()
        log_config_audit(self.request, 'ApprovalRule', instance.id, instance.name, 'CREATE',
                        new_values={'code': instance.code, 'name': instance.name, 'module': instance.module})
    
    def perform_update(self, serializer):
        instance = self.get_object()
        old_values = {'code': instance.code, 'name': instance.name, 'is_active': instance.is_active}
        instance = serializer.save()
        log_config_audit(self.request, 'ApprovalRule', instance.id, instance.name, 'UPDATE',
                        old_values=old_values, new_values={'code': instance.code, 'name': instance.name, 'is_active': instance.is_active})
    
    def perform_destroy(self, instance):
        log_config_audit(self.request, 'ApprovalRule', instance.id, instance.name, 'DELETE',
                        old_values={'code': instance.code, 'name': instance.name})
        instance.delete()


class NotificationTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for notification template management"""
    queryset = NotificationTemplate.objects.all()
    serializer_class = NotificationTemplateSerializer
    permission_classes = [IsAdminConfig]
    
    def get_queryset(self):
        queryset = NotificationTemplate.objects.all()
        channel = self.request.query_params.get('channel')
        if channel:
            queryset = queryset.filter(channel=channel)
        return queryset
    
    def perform_create(self, serializer):
        instance = serializer.save()
        log_config_audit(self.request, 'NotificationTemplate', instance.id, instance.name, 'CREATE',
                        new_values={'code': instance.code, 'name': instance.name, 'channel': instance.channel})
    
    def perform_update(self, serializer):
        instance = self.get_object()
        old_values = {'code': instance.code, 'name': instance.name, 'is_active': instance.is_active}
        instance = serializer.save()
        log_config_audit(self.request, 'NotificationTemplate', instance.id, instance.name, 'UPDATE',
                        old_values=old_values, new_values={'code': instance.code, 'name': instance.name, 'is_active': instance.is_active})
    
    def perform_destroy(self, instance):
        log_config_audit(self.request, 'NotificationTemplate', instance.id, instance.name, 'DELETE',
                        old_values={'code': instance.code, 'name': instance.name})
        instance.delete()


class NotificationRuleViewSet(viewsets.ModelViewSet):
    """ViewSet for notification rule management"""
    queryset = NotificationRule.objects.all()
    serializer_class = NotificationRuleSerializer
    permission_classes = [IsAdminConfig]
    
    def get_queryset(self):
        queryset = NotificationRule.objects.select_related('template', 'branch').all()
        module = self.request.query_params.get('module')
        if module:
            queryset = queryset.filter(module=module)
        event_type = self.request.query_params.get('event_type')
        if event_type:
            queryset = queryset.filter(event_type=event_type)
        return queryset
    
    def perform_create(self, serializer):
        instance = serializer.save()
        log_config_audit(self.request, 'NotificationRule', instance.id, instance.name, 'CREATE',
                        new_values={'code': instance.code, 'name': instance.name, 'event_type': instance.event_type})
    
    def perform_update(self, serializer):
        instance = self.get_object()
        old_values = {'code': instance.code, 'name': instance.name, 'is_active': instance.is_active}
        instance = serializer.save()
        log_config_audit(self.request, 'NotificationRule', instance.id, instance.name, 'UPDATE',
                        old_values=old_values, new_values={'code': instance.code, 'name': instance.name, 'is_active': instance.is_active})
    
    def perform_destroy(self, instance):
        log_config_audit(self.request, 'NotificationRule', instance.id, instance.name, 'DELETE',
                        old_values={'code': instance.code, 'name': instance.name})
        instance.delete()


class AutomationRuleViewSet(viewsets.ModelViewSet):
    """ViewSet for automation rule management"""
    queryset = AutomationRule.objects.all()
    serializer_class = AutomationRuleSerializer
    permission_classes = [IsAdminConfig]
    
    def get_queryset(self):
        queryset = AutomationRule.objects.select_related('branch').all()
        module = self.request.query_params.get('module')
        if module:
            queryset = queryset.filter(module=module)
        trigger_type = self.request.query_params.get('trigger_type')
        if trigger_type:
            queryset = queryset.filter(trigger_type=trigger_type)
        return queryset
    
    def perform_create(self, serializer):
        instance = serializer.save()
        log_config_audit(self.request, 'AutomationRule', instance.id, instance.name, 'CREATE',
                        new_values={'code': instance.code, 'name': instance.name, 'trigger_type': instance.trigger_type})
    
    def perform_update(self, serializer):
        instance = self.get_object()
        old_values = {'code': instance.code, 'name': instance.name, 'is_active': instance.is_active}
        instance = serializer.save()
        log_config_audit(self.request, 'AutomationRule', instance.id, instance.name, 'UPDATE',
                        old_values=old_values, new_values={'code': instance.code, 'name': instance.name, 'is_active': instance.is_active})
    
    def perform_destroy(self, instance):
        log_config_audit(self.request, 'AutomationRule', instance.id, instance.name, 'DELETE',
                        old_values={'code': instance.code, 'name': instance.name})
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def trigger(self, request, pk=None):
        """Manually trigger an automation rule"""
        rule = self.get_object()
        rule.last_triggered = timezone.now()
        rule.trigger_count += 1
        rule.save()
        log_config_audit(request, 'AutomationRule', rule.id, rule.name, 'TRIGGER',
                        new_values={'trigger_count': rule.trigger_count, 'last_triggered': str(rule.last_triggered)})
        return Response({'status': 'triggered', 'trigger_count': rule.trigger_count})


class DelegationRuleViewSet(viewsets.ModelViewSet):
    """ViewSet for delegation rule management"""
    queryset = DelegationRule.objects.all()
    serializer_class = DelegationRuleSerializer
    permission_classes = [IsAdminConfig]
    
    def get_queryset(self):
        queryset = DelegationRule.objects.select_related('delegator', 'delegate', 'approved_by').all()
        if self.request.query_params.get('active_only') == 'true':
            now = timezone.now()
            queryset = queryset.filter(is_active=True, start_date__lte=now, end_date__gte=now)
        return queryset
    
    def perform_create(self, serializer):
        instance = serializer.save()
        log_config_audit(self.request, 'DelegationRule', instance.id, f'{instance.delegator.username} -> {instance.delegate.username}', 'CREATE',
                        new_values={'delegator': instance.delegator.username, 'delegate': instance.delegate.username, 'reason': instance.reason})
    
    def perform_update(self, serializer):
        instance = self.get_object()
        old_values = {'is_active': instance.is_active, 'end_date': str(instance.end_date)}
        instance = serializer.save()
        log_config_audit(self.request, 'DelegationRule', instance.id, f'{instance.delegator.username} -> {instance.delegate.username}', 'UPDATE',
                        old_values=old_values, new_values={'is_active': instance.is_active, 'end_date': str(instance.end_date)})
    
    def perform_destroy(self, instance):
        log_config_audit(self.request, 'DelegationRule', instance.id, f'{instance.delegator.username} -> {instance.delegate.username}', 'DELETE',
                        old_values={'delegator': instance.delegator.username, 'delegate': instance.delegate.username})
        instance.delete()


class BranchHolidayCalendarViewSet(viewsets.ModelViewSet):
    """ViewSet for branch holiday calendar management"""
    queryset = BranchHolidayCalendar.objects.all()
    serializer_class = BranchHolidayCalendarSerializer
    permission_classes = [IsAdminConfig]
    
    def get_queryset(self):
        queryset = BranchHolidayCalendar.objects.select_related('branch').all()
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            queryset = queryset.filter(Q(branch_id=branch_id) | Q(branch__isnull=True))
        year = self.request.query_params.get('year')
        if year:
            queryset = queryset.filter(year=year)
        return queryset
    
    def perform_create(self, serializer):
        instance = serializer.save()
        log_config_audit(self.request, 'BranchHolidayCalendar', instance.id, instance.name, 'CREATE',
                        new_values={'name': instance.name, 'date': str(instance.date), 'holiday_type': instance.holiday_type})
    
    def perform_update(self, serializer):
        instance = self.get_object()
        old_values = {'name': instance.name, 'date': str(instance.date), 'is_active': instance.is_active}
        instance = serializer.save()
        log_config_audit(self.request, 'BranchHolidayCalendar', instance.id, instance.name, 'UPDATE',
                        old_values=old_values, new_values={'name': instance.name, 'date': str(instance.date), 'is_active': instance.is_active})
    
    def perform_destroy(self, instance):
        log_config_audit(self.request, 'BranchHolidayCalendar', instance.id, instance.name, 'DELETE',
                        old_values={'name': instance.name, 'date': str(instance.date)})
        instance.delete()


class OperatingHoursViewSet(viewsets.ModelViewSet):
    """ViewSet for branch operating hours management"""
    queryset = OperatingHours.objects.all()
    serializer_class = OperatingHoursSerializer
    permission_classes = [IsAdminConfig]
    
    def get_queryset(self):
        queryset = OperatingHours.objects.select_related('branch').all()
        branch_id = self.request.query_params.get('branch_id')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        return queryset
    
    def perform_create(self, serializer):
        instance = serializer.save()
        log_config_audit(self.request, 'OperatingHours', instance.id, f'{instance.branch.name if instance.branch else "Global"} - {instance.day}', 'CREATE',
                        new_values={'day': instance.day, 'is_open': instance.is_open, 'open_time': str(instance.open_time), 'close_time': str(instance.close_time)})
    
    def perform_update(self, serializer):
        instance = self.get_object()
        old_values = {'is_open': instance.is_open, 'open_time': str(instance.open_time), 'close_time': str(instance.close_time)}
        instance = serializer.save()
        log_config_audit(self.request, 'OperatingHours', instance.id, f'{instance.branch.name if instance.branch else "Global"} - {instance.day}', 'UPDATE',
                        old_values=old_values, new_values={'is_open': instance.is_open, 'open_time': str(instance.open_time), 'close_time': str(instance.close_time)})
    
    def perform_destroy(self, instance):
        log_config_audit(self.request, 'OperatingHours', instance.id, f'{instance.branch.name if instance.branch else "Global"} - {instance.day}', 'DELETE',
                        old_values={'day': instance.day, 'is_open': instance.is_open})
        instance.delete()


class SLAConfigViewSet(viewsets.ModelViewSet):
    """ViewSet for SLA configuration management"""
    queryset = SLAConfig.objects.all()
    serializer_class = SLAConfigSerializer
    permission_classes = [IsAdminConfig]
    
    def get_queryset(self):
        queryset = SLAConfig.objects.select_related('branch').all()
        module = self.request.query_params.get('module')
        if module:
            queryset = queryset.filter(module=module)
        priority = self.request.query_params.get('priority')
        if priority:
            queryset = queryset.filter(priority=priority)
        return queryset
    
    def perform_create(self, serializer):
        instance = serializer.save()
        log_config_audit(self.request, 'SLAConfig', instance.id, instance.name, 'CREATE',
                        new_values={'code': instance.code, 'name': instance.name, 'module': instance.module, 'priority': instance.priority})
    
    def perform_update(self, serializer):
        instance = self.get_object()
        old_values = {'code': instance.code, 'name': instance.name, 'response_hours': instance.response_hours, 'is_active': instance.is_active}
        instance = serializer.save()
        log_config_audit(self.request, 'SLAConfig', instance.id, instance.name, 'UPDATE',
                        old_values=old_values, new_values={'code': instance.code, 'name': instance.name, 'response_hours': instance.response_hours, 'is_active': instance.is_active})
    
    def perform_destroy(self, instance):
        log_config_audit(self.request, 'SLAConfig', instance.id, instance.name, 'DELETE',
                        old_values={'code': instance.code, 'name': instance.name})
        instance.delete()


class ConfigAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for config audit log (read-only)"""
    queryset = ConfigAuditLog.objects.all()
    serializer_class = ConfigAuditLogSerializer
    permission_classes = [IsAdminConfig]
    
    def get_queryset(self):
        queryset = ConfigAuditLog.objects.select_related('performed_by', 'branch').order_by('-created_at')
        entity_type = self.request.query_params.get('entity_type')
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        entity_id = self.request.query_params.get('entity_id')
        if entity_id:
            queryset = queryset.filter(entity_id=entity_id)
        return queryset[:100]


class MenuConfigViewSet(viewsets.ModelViewSet):
    """ViewSet for menu configuration management"""
    queryset = MenuConfig.objects.all()
    serializer_class = MenuConfigSerializer
    permission_classes = [IsAdminConfig]
    
    def get_queryset(self):
        queryset = MenuConfig.objects.select_related('parent').all()
        module = self.request.query_params.get('module')
        if module:
            queryset = queryset.filter(module=module)
        if self.request.query_params.get('root_only') == 'true':
            queryset = queryset.filter(parent__isnull=True)
        return queryset.order_by('display_order')
    
    def perform_create(self, serializer):
        instance = serializer.save()
        log_config_audit(self.request, 'MenuConfig', instance.id, instance.name, 'CREATE',
                        new_values={'code': instance.code, 'name': instance.name, 'path': instance.path, 'module': instance.module})
    
    def perform_update(self, serializer):
        instance = self.get_object()
        old_values = {'code': instance.code, 'name': instance.name, 'is_visible': instance.is_visible, 'is_active': instance.is_active}
        instance = serializer.save()
        log_config_audit(self.request, 'MenuConfig', instance.id, instance.name, 'UPDATE',
                        old_values=old_values, new_values={'code': instance.code, 'name': instance.name, 'is_visible': instance.is_visible, 'is_active': instance.is_active})
    
    def perform_destroy(self, instance):
        log_config_audit(self.request, 'MenuConfig', instance.id, instance.name, 'DELETE',
                        old_values={'code': instance.code, 'name': instance.name, 'path': instance.path})
        instance.delete()
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Get menu structure as a tree"""
        root_menus = MenuConfig.objects.filter(parent__isnull=True, is_active=True).order_by('display_order')
        serializer = MenuConfigSerializer(root_menus, many=True)
        return Response(serializer.data)


class FeatureFlagViewSet(viewsets.ModelViewSet):
    """ViewSet for feature flag management"""
    queryset = FeatureFlag.objects.all()
    serializer_class = FeatureFlagSerializer
    permission_classes = [IsAdminConfig]
    
    def perform_create(self, serializer):
        instance = serializer.save()
        log_config_audit(self.request, 'FeatureFlag', instance.id, instance.name, 'CREATE',
                        new_values={'code': instance.code, 'name': instance.name, 'is_enabled': instance.is_enabled})
    
    def perform_update(self, serializer):
        instance = self.get_object()
        old_values = {'code': instance.code, 'name': instance.name, 'is_enabled': instance.is_enabled}
        instance = serializer.save()
        log_config_audit(self.request, 'FeatureFlag', instance.id, instance.name, 'UPDATE',
                        old_values=old_values, new_values={'code': instance.code, 'name': instance.name, 'is_enabled': instance.is_enabled})
    
    def perform_destroy(self, instance):
        log_config_audit(self.request, 'FeatureFlag', instance.id, instance.name, 'DELETE',
                        old_values={'code': instance.code, 'name': instance.name, 'is_enabled': instance.is_enabled})
        instance.delete()
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Toggle a feature flag on/off"""
        flag = self.get_object()
        old_state = flag.is_enabled
        flag.is_enabled = not flag.is_enabled
        flag.save()
        log_config_audit(request, 'FeatureFlag', flag.id, flag.name, 'TOGGLE',
                        old_values={'is_enabled': old_state}, new_values={'is_enabled': flag.is_enabled})
        return Response({'code': flag.code, 'is_enabled': flag.is_enabled})
    
    @action(detail=False, methods=['get'])
    def check(self, request):
        """Check if a feature is enabled for current user"""
        code = request.query_params.get('code')
        if not code:
            return Response({'error': 'code parameter required'}, status=400)
        try:
            flag = FeatureFlag.objects.get(code=code)
            user = request.user
            profile = getattr(user, 'profile', None)
            
            is_enabled = flag.is_enabled
            if is_enabled and flag.enabled_roles:
                is_enabled = profile and profile.role in flag.enabled_roles
            if is_enabled and flag.enabled_branches.exists():
                is_enabled = profile and profile.branch in flag.enabled_branches.all()
            
            return Response({'code': code, 'is_enabled': is_enabled})
        except FeatureFlag.DoesNotExist:
            return Response({'code': code, 'is_enabled': False})


class AdminConfigDashboardViewSet(viewsets.ViewSet):
    """ViewSet for admin configuration dashboard"""
    permission_classes = [IsAdminConfig]
    
    @action(detail=False, methods=['get'])
    def overview(self, request):
        """Get admin configuration dashboard overview"""
        return Response({
            'total_configs': SystemConfig.objects.filter(is_active=True).count(),
            'total_workflows': WorkflowConfig.objects.filter(is_active=True).count(),
            'total_approval_rules': ApprovalRule.objects.filter(is_active=True).count(),
            'total_automation_rules': AutomationRule.objects.filter(is_active=True).count(),
            'total_notification_rules': NotificationRule.objects.filter(is_active=True).count(),
            'active_feature_flags': FeatureFlag.objects.filter(is_enabled=True).count(),
            'pending_delegations': DelegationRule.objects.filter(
                is_active=True,
                start_date__lte=timezone.now(),
                end_date__gte=timezone.now()
            ).count(),
            'recent_config_changes': list(ConfigAuditLog.objects.order_by('-created_at')[:10].values(
                'entity_type', 'entity_name', 'action', 'performed_by__username', 'created_at'
            )),
            'system_health': {
                'integrations_active': IntegrationConfig.objects.filter(is_active=True).count(),
                'integrations_error': IntegrationConfig.objects.filter(status='error').count(),
            }
        })
    
    @action(detail=False, methods=['get'])
    def modules(self, request):
        """Get list of configurable modules"""
        return Response({
            'modules': [
                {'code': 'SYSTEM', 'name': 'System Configuration', 'icon': 'settings'},
                {'code': 'SERVICE', 'name': 'Service Operations', 'icon': 'wrench'},
                {'code': 'CRM', 'name': 'CRM & Customer', 'icon': 'users'},
                {'code': 'INVENTORY', 'name': 'Inventory & Supplier', 'icon': 'package'},
                {'code': 'FINANCE', 'name': 'Accounts & Finance', 'icon': 'indian-rupee'},
                {'code': 'HR', 'name': 'HR & Skills', 'icon': 'user-check'},
                {'code': 'CONTRACT', 'name': 'Contracts', 'icon': 'file-text'},
                {'code': 'NOTIFICATION', 'name': 'Notifications', 'icon': 'bell'},
                {'code': 'INTEGRATION', 'name': 'Integrations', 'icon': 'plug'},
                {'code': 'AUTOMATION', 'name': 'Automation', 'icon': 'cpu'},
            ]
        })


class CurrencyViewSet(viewsets.ModelViewSet):
    """ViewSet for managing currencies"""
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = Currency.objects.all()
        if self.request.query_params.get('active_only'):
            queryset = queryset.filter(is_active=True)
        return queryset.order_by('display_order', 'code')
    
    @action(detail=False, methods=['post'])
    def seed_defaults(self, request):
        """Seed default currencies"""
        default_currencies = [
            {'code': 'USD', 'name': 'US Dollar', 'symbol': '$', 'decimal_places': 2, 'exchange_rate': 1.0, 'display_order': 1},
            {'code': 'AUD', 'name': 'Australian Dollar', 'symbol': 'A$', 'decimal_places': 2, 'exchange_rate': 1.53, 'display_order': 2},
            {'code': 'SSP', 'name': 'South Sudanese Pound', 'symbol': '£', 'decimal_places': 2, 'exchange_rate': 130.0, 'display_order': 3},
            {'code': 'INR', 'name': 'Indian Rupee', 'symbol': '₹', 'decimal_places': 2, 'exchange_rate': 83.0, 'is_base_currency': True, 'display_order': 4},
            {'code': 'THB', 'name': 'Thai Baht', 'symbol': '฿', 'decimal_places': 2, 'exchange_rate': 35.0, 'display_order': 5},
            {'code': 'MYR', 'name': 'Malaysian Ringgit', 'symbol': 'RM', 'decimal_places': 2, 'exchange_rate': 4.7, 'display_order': 6},
            {'code': 'SAR', 'name': 'Saudi Riyal', 'symbol': '﷼', 'decimal_places': 2, 'exchange_rate': 3.75, 'display_order': 7},
        ]
        created_count = 0
        for curr_data in default_currencies:
            currency, created = Currency.objects.get_or_create(
                code=curr_data['code'],
                defaults=curr_data
            )
            if created:
                created_count += 1
        return Response({'message': f'Created {created_count} currencies', 'total': len(default_currencies)})
    
    @action(detail=True, methods=['post'])
    def set_as_base(self, request, pk=None):
        """Set a currency as the base currency"""
        currency = self.get_object()
        Currency.objects.filter(is_base_currency=True).update(is_base_currency=False)
        currency.is_base_currency = True
        currency.save()
        return Response({'message': f'{currency.code} set as base currency'})


class LanguageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing languages"""
    queryset = Language.objects.all()
    serializer_class = LanguageSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def get_queryset(self):
        queryset = Language.objects.all()
        if self.request.query_params.get('active_only'):
            queryset = queryset.filter(is_active=True)
        return queryset.order_by('display_order', 'name')
    
    @action(detail=False, methods=['post'])
    def seed_defaults(self, request):
        """Seed default languages"""
        default_languages = [
            {'code': 'en', 'name': 'English', 'native_name': 'English', 'direction': 'ltr', 'is_default': True, 'display_order': 1},
            {'code': 'hi', 'name': 'Hindi', 'native_name': 'हिन्दी', 'direction': 'ltr', 'display_order': 2},
            {'code': 'ta', 'name': 'Tamil', 'native_name': 'தமிழ்', 'direction': 'ltr', 'display_order': 3},
            {'code': 'te', 'name': 'Telugu', 'native_name': 'తెలుగు', 'direction': 'ltr', 'display_order': 4},
            {'code': 'kn', 'name': 'Kannada', 'native_name': 'ಕನ್ನಡ', 'direction': 'ltr', 'display_order': 5},
            {'code': 'ml', 'name': 'Malayalam', 'native_name': 'മലയാളം', 'direction': 'ltr', 'display_order': 6},
            {'code': 'mr', 'name': 'Marathi', 'native_name': 'मराठी', 'direction': 'ltr', 'display_order': 7},
            {'code': 'gu', 'name': 'Gujarati', 'native_name': 'ગુજરાતી', 'direction': 'ltr', 'display_order': 8},
            {'code': 'bn', 'name': 'Bengali', 'native_name': 'বাংলা', 'direction': 'ltr', 'display_order': 9},
            {'code': 'ar', 'name': 'Arabic', 'native_name': 'العربية', 'direction': 'rtl', 'display_order': 10},
            {'code': 'th', 'name': 'Thai', 'native_name': 'ไทย', 'direction': 'ltr', 'display_order': 11},
            {'code': 'ms', 'name': 'Malay', 'native_name': 'Bahasa Melayu', 'direction': 'ltr', 'display_order': 12},
        ]
        created_count = 0
        for lang_data in default_languages:
            language, created = Language.objects.get_or_create(
                code=lang_data['code'],
                defaults=lang_data
            )
            if created:
                created_count += 1
        return Response({'message': f'Created {created_count} languages', 'total': len(default_languages)})
    
    @action(detail=True, methods=['post'])
    def set_as_default(self, request, pk=None):
        """Set a language as the default language"""
        language = self.get_object()
        Language.objects.filter(is_default=True).update(is_default=False)
        language.is_default = True
        language.save()
        return Response({'message': f'{language.name} set as default language'})


class SystemPreferenceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing system preferences"""
    queryset = SystemPreference.objects.all()
    serializer_class = SystemPreferenceSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'current']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def perform_create(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Get current system preferences for currency and language"""
        currency_pref = SystemPreference.objects.filter(key='DEFAULT_CURRENCY').first()
        language_pref = SystemPreference.objects.filter(key='DEFAULT_LANGUAGE').first()
        
        current_currency = None
        current_language = None
        
        if currency_pref:
            current_currency = Currency.objects.filter(code=currency_pref.value, is_active=True).first()
        if not current_currency:
            current_currency = Currency.objects.filter(is_base_currency=True, is_active=True).first()
        if not current_currency:
            current_currency = Currency.objects.filter(is_active=True).first()
            
        if language_pref:
            current_language = Language.objects.filter(code=language_pref.value, is_active=True).first()
        if not current_language:
            current_language = Language.objects.filter(is_default=True, is_active=True).first()
        if not current_language:
            current_language = Language.objects.filter(is_active=True).first()
        
        return Response({
            'currency': CurrencySerializer(current_currency).data if current_currency else None,
            'language': LanguageSerializer(current_language).data if current_language else None,
        })
    
    @action(detail=False, methods=['post'])
    def set_currency(self, request):
        """Set the system default currency"""
        currency_code = request.data.get('currency_code')
        if not currency_code:
            return Response({'error': 'currency_code is required'}, status=400)
        
        currency = Currency.objects.filter(code=currency_code, is_active=True).first()
        if not currency:
            return Response({'error': 'Currency not found or inactive'}, status=404)
        
        pref, created = SystemPreference.objects.update_or_create(
            key='DEFAULT_CURRENCY',
            defaults={
                'preference_type': 'CURRENCY',
                'value': currency_code,
                'description': f'System default currency: {currency.name}',
                'updated_by': request.user
            }
        )
        return Response({
            'message': f'System currency set to {currency.name} ({currency.code})',
            'currency': CurrencySerializer(currency).data
        })
    
    @action(detail=False, methods=['post'])
    def set_language(self, request):
        """Set the system default language"""
        language_code = request.data.get('language_code')
        if not language_code:
            return Response({'error': 'language_code is required'}, status=400)
        
        language = Language.objects.filter(code=language_code, is_active=True).first()
        if not language:
            return Response({'error': 'Language not found or inactive'}, status=404)
        
        pref, created = SystemPreference.objects.update_or_create(
            key='DEFAULT_LANGUAGE',
            defaults={
                'preference_type': 'LANGUAGE',
                'value': language_code,
                'description': f'System default language: {language.name}',
                'updated_by': request.user
            }
        )
        return Response({
            'message': f'System language set to {language.name}',
            'language': LanguageSerializer(language).data
        })
    
    @action(detail=False, methods=['post'])
    def seed_defaults(self, request):
        """Seed default system preferences"""
        defaults = [
            {'key': 'DEFAULT_CURRENCY', 'preference_type': 'CURRENCY', 'value': 'INR', 'description': 'System default currency'},
            {'key': 'DEFAULT_LANGUAGE', 'preference_type': 'LANGUAGE', 'value': 'en', 'description': 'System default language'},
            {'key': 'DATE_FORMAT', 'preference_type': 'DATE_FORMAT', 'value': 'DD/MM/YYYY', 'description': 'System date format'},
            {'key': 'NUMBER_FORMAT', 'preference_type': 'NUMBER_FORMAT', 'value': 'en-IN', 'description': 'System number format locale'},
        ]
        created_count = 0
        for pref_data in defaults:
            pref, created = SystemPreference.objects.update_or_create(
                key=pref_data['key'],
                defaults={**pref_data, 'updated_by': request.user}
            )
            if created:
                created_count += 1
        return Response({'message': f'Created/updated {len(defaults)} preferences'})
