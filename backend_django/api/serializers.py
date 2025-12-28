from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Profile, Customer, Vehicle, Part, JobCard, Task, TaskPart, TimelineEvent
)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']
        read_only_fields = ['id']


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Profile
        fields = ['id', 'user', 'role', 'branch_id', 'phone', 'utilization', 'avatar']


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'email', 'loyalty_points', 'address', 'notes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class VehicleSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    
    class Meta:
        model = Vehicle
        fields = ['id', 'customer', 'customer_name', 'vin', 'plate_number', 'make', 'model', 'year', 'color']
        read_only_fields = ['id']


class CustomerWithVehiclesSerializer(serializers.ModelSerializer):
    vehicles = VehicleSerializer(many=True, read_only=True)
    
    class Meta:
        model = Customer
        fields = ['id', 'name', 'phone', 'email', 'loyalty_points', 'address', 'notes', 'vehicles', 'created_at', 'updated_at']


class PartSerializer(serializers.ModelSerializer):
    available_stock = serializers.IntegerField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Part
        fields = ['id', 'name', 'sku', 'category', 'stock', 'min_stock', 'price', 'reserved', 'location', 'available_stock', 'is_low_stock']
        read_only_fields = ['id']


class TaskPartSerializer(serializers.ModelSerializer):
    part_name = serializers.CharField(source='part.name', read_only=True)
    part_sku = serializers.CharField(source='part.sku', read_only=True)
    
    class Meta:
        model = TaskPart
        fields = ['id', 'task', 'part', 'part_name', 'part_sku', 'quantity', 'price', 'is_reserved']


class TaskSerializer(serializers.ModelSerializer):
    parts_used = TaskPartSerializer(many=True, read_only=True)
    
    class Meta:
        model = Task
        fields = ['id', 'job_card', 'description', 'status', 'is_completed', 'labor_cost', 'start_time', 'end_time', 'parts_used']
        read_only_fields = ['id']


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


class JobCardSerializer(serializers.ModelSerializer):
    vehicle_info = serializers.SerializerMethodField()
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    advisor_name = serializers.SerializerMethodField()
    technician_name = serializers.SerializerMethodField()
    
    class Meta:
        model = JobCard
        fields = [
            'id', 'vehicle', 'vehicle_info', 'customer', 'customer_name',
            'advisor', 'advisor_name', 'technician', 'technician_name',
            'status', 'estimated_amount', 'actual_amount', 'sla_deadline',
            'ai_summary', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_vehicle_info(self, obj):
        return f"{obj.vehicle.year or ''} {obj.vehicle.make} {obj.vehicle.model} - {obj.vehicle.plate_number}"
    
    def get_advisor_name(self, obj):
        if obj.advisor:
            return f"{obj.advisor.first_name} {obj.advisor.last_name}".strip() or obj.advisor.username
        return None
    
    def get_technician_name(self, obj):
        if obj.technician:
            return f"{obj.technician.first_name} {obj.technician.last_name}".strip() or obj.technician.username
        return None


class JobCardDetailSerializer(JobCardSerializer):
    tasks = TaskSerializer(many=True, read_only=True)
    timeline_events = TimelineEventSerializer(many=True, read_only=True)
    vehicle_detail = VehicleSerializer(source='vehicle', read_only=True)
    customer_detail = CustomerSerializer(source='customer', read_only=True)
    
    class Meta(JobCardSerializer.Meta):
        fields = JobCardSerializer.Meta.fields + ['tasks', 'timeline_events', 'vehicle_detail', 'customer_detail']


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
        Profile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
