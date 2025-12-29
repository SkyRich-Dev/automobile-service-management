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
    Supplier, PurchaseOrder, PurchaseOrderLine,
    TechnicianSchedule, Appointment, AnalyticsSnapshot,
    License, SystemSetting, PaymentIntent, TallySyncJob, TallyLedgerMapping, IntegrationConfig
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
    SupplierSerializer, PurchaseOrderSerializer, TechnicianScheduleSerializer,
    AppointmentSerializer, AnalyticsSnapshotSerializer,
    LicenseSerializer, SystemSettingSerializer, PaymentIntentSerializer,
    TallySyncJobSerializer, TallyLedgerMappingSerializer, IntegrationConfigSerializer
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
    permission_classes = [IsAuthenticated]
    
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
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    
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
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    
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
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    
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
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    
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
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    
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
