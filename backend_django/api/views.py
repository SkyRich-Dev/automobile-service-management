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
    Notification, Contract, Supplier, PurchaseOrder, PurchaseOrderLine,
    TechnicianSchedule, Appointment, AnalyticsSnapshot
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
    NotificationSerializer, ContractSerializer, SupplierSerializer,
    PurchaseOrderSerializer, TechnicianScheduleSerializer,
    AppointmentSerializer, AnalyticsSnapshotSerializer
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
        queryset = Contract.objects.all()
        customer_id = self.request.query_params.get('customer_id', None)
        vehicle_id = self.request.query_params.get('vehicle_id', None)
        contract_type = self.request.query_params.get('type', None)
        active_only = self.request.query_params.get('active', None)
        
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        if contract_type:
            queryset = queryset.filter(contract_type=contract_type)
        if active_only == 'true':
            queryset = queryset.filter(is_active=True, end_date__gte=timezone.now().date())
        
        return queryset.order_by('-end_date')
    
    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        from datetime import timedelta
        days = int(request.query_params.get('days', 30))
        expiry_date = timezone.now().date() + timedelta(days=days)
        contracts = self.get_queryset().filter(
            is_active=True,
            end_date__lte=expiry_date,
            end_date__gte=timezone.now().date()
        )
        return Response(ContractSerializer(contracts, many=True).data)


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
