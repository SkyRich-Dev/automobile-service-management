from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.db.models import Q
import os

from .models import (
    Profile, Customer, Vehicle, Part, JobCard, Task, TaskPart, TimelineEvent,
    JobStatus, UserRole
)
from .serializers import (
    UserSerializer, ProfileSerializer, CustomerSerializer, CustomerWithVehiclesSerializer,
    VehicleSerializer, PartSerializer, JobCardSerializer, JobCardDetailSerializer,
    TaskSerializer, TaskPartSerializer, TimelineEventSerializer,
    RegisterSerializer, LoginSerializer
)


# Auth Views
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


# Profile ViewSet
class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
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


# Customer ViewSet
class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CustomerWithVehiclesSerializer
        return CustomerSerializer
    
    def get_queryset(self):
        queryset = Customer.objects.all()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search)
            )
        return queryset.order_by('-created_at')


# Vehicle ViewSet
class VehicleViewSet(viewsets.ModelViewSet):
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    
    def get_queryset(self):
        queryset = Vehicle.objects.all()
        customer_id = self.request.query_params.get('customer_id', None)
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset


# Part ViewSet
class PartViewSet(viewsets.ModelViewSet):
    queryset = Part.objects.all()
    serializer_class = PartSerializer
    
    def get_queryset(self):
        queryset = Part.objects.all()
        category = self.request.query_params.get('category', None)
        low_stock = self.request.query_params.get('low_stock', None)
        
        if category:
            queryset = queryset.filter(category=category)
        if low_stock == 'true':
            queryset = queryset.filter(stock__lte=models.F('min_stock'))
        
        return queryset.order_by('name')


# JobCard ViewSet
class JobCardViewSet(viewsets.ModelViewSet):
    queryset = JobCard.objects.all()
    serializer_class = JobCardSerializer
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return JobCardDetailSerializer
        return JobCardSerializer
    
    def get_queryset(self):
        queryset = JobCard.objects.select_related('vehicle', 'customer', 'advisor', 'technician')
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        job_card = serializer.save()
        # Create timeline event for job card creation
        TimelineEvent.objects.create(
            job_card=job_card,
            event_type='SYSTEM',
            status='Created',
            actor=self.request.user if self.request.user.is_authenticated else None,
            role=UserRole.OWNER,
            comment='Job card created'
        )
    
    def perform_update(self, serializer):
        old_status = self.get_object().status
        job_card = serializer.save()
        
        # Log status change if status was updated
        if 'status' in serializer.validated_data and old_status != job_card.status:
            TimelineEvent.objects.create(
                job_card=job_card,
                event_type='STATUS_CHANGE',
                status=job_card.status,
                actor=self.request.user if self.request.user.is_authenticated else None,
                role=UserRole.OWNER,
                comment=f'Status updated to {job_card.get_status_display()}'
            )
    
    @action(detail=True, methods=['post'])
    def ai_insight(self, request, pk=None):
        job_card = self.get_object()
        
        try:
            # Use Google Gemini for AI insights
            from google import genai
            
            client = genai.Client(
                api_key=os.environ.get('AI_INTEGRATIONS_GEMINI_API_KEY'),
                http_options={'api_version': '', 'base_url': os.environ.get('AI_INTEGRATIONS_GEMINI_BASE_URL')}
            )
            
            prompt = f"""
            Analyze this vehicle service job card and provide insights/recommendations:
            Vehicle: {job_card.vehicle.year or ''} {job_card.vehicle.make} {job_card.vehicle.model}
            Issues/Tasks: {', '.join([t.description for t in job_card.tasks.all()])}
            Current Status: {job_card.get_status_display()}
            
            Provide a concise summary of the job status, potential risks, and recommendations for the technician or advisor.
            """
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            
            insight = response.text
            
            # Save insight to timeline
            TimelineEvent.objects.create(
                job_card=job_card,
                event_type='AI_INSIGHT',
                status='Insight Generated',
                role=UserRole.OWNER,
                comment=insight
            )
            
            return Response({'insight': insight})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# Task ViewSet
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    
    def get_queryset(self):
        queryset = Task.objects.all()
        job_card_id = self.request.query_params.get('job_card_id', None)
        if job_card_id:
            queryset = queryset.filter(job_card_id=job_card_id)
        return queryset


# TaskPart ViewSet
class TaskPartViewSet(viewsets.ModelViewSet):
    queryset = TaskPart.objects.all()
    serializer_class = TaskPartSerializer


# TimelineEvent ViewSet
class TimelineEventViewSet(viewsets.ModelViewSet):
    queryset = TimelineEvent.objects.all()
    serializer_class = TimelineEventSerializer
    
    def get_queryset(self):
        queryset = TimelineEvent.objects.all()
        job_card_id = self.request.query_params.get('job_card_id', None)
        if job_card_id:
            queryset = queryset.filter(job_card_id=job_card_id)
        return queryset.order_by('-timestamp')


# Dashboard Stats
@api_view(['GET'])
def dashboard_stats(request):
    from django.db.models import Count, Sum
    
    total_customers = Customer.objects.count()
    total_vehicles = Vehicle.objects.count()
    total_parts = Part.objects.count()
    
    job_cards_by_status = JobCard.objects.values('status').annotate(count=Count('id'))
    active_job_cards = JobCard.objects.exclude(status=JobStatus.DELIVERED).count()
    
    low_stock_parts = Part.objects.filter(stock__lte=5).count()
    
    recent_job_cards = JobCard.objects.select_related('vehicle', 'customer').order_by('-created_at')[:5]
    
    return Response({
        'total_customers': total_customers,
        'total_vehicles': total_vehicles,
        'total_parts': total_parts,
        'active_job_cards': active_job_cards,
        'low_stock_parts': low_stock_parts,
        'job_cards_by_status': list(job_cards_by_status),
        'recent_job_cards': JobCardSerializer(recent_job_cards, many=True).data
    })
