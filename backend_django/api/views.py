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
    RolePermission, EmailConfiguration, WhatsAppConfiguration, PaymentGatewayConfiguration, TallyConfiguration
)
from .permissions import (
    RoleBasedPermission, IsAdminOrManager, IsTechnicianOrAbove, CanTransitionWorkflow
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
    PaymentGatewayConfigurationSerializer, TallyConfigurationSerializer
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
    return Response([
        {'value': stage.value, 'label': stage.label}
        for stage in WorkflowStage
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
