from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import transaction
from datetime import timedelta, time, date
from decimal import Decimal
import random

from api.models import (
    Branch, Profile, TechnicianMetrics, Customer, Vehicle, Bay, JobCard,
    Task, Estimate, EstimateLine, ServiceEvent, Invoice, Payment,
    Part, PartIssue, Notification, Contract, Supplier, PurchaseOrder,
    PurchaseOrderLine, TechnicianSchedule, Appointment, AnalyticsSnapshot,
    DigitalInspection, License, UserRole, WorkflowStage, TaskStatus,
    ApprovalStatus, ServiceEventType, NotificationType, NotificationChannel,
    ContractType, PurchaseOrderStatus, LicenseType, LicenseStatus
)


class Command(BaseCommand):
    help = 'Seed the database with comprehensive sample data for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write('Clearing existing data...')
            self.clear_data()

        self.stdout.write('Seeding sample data...')
        
        with transaction.atomic():
            branches = self.create_branches()
            users = self.create_users(branches)
            customers = self.create_customers(branches)
            vehicles = self.create_vehicles(customers)
            bays = self.create_bays(branches)
            parts = self.create_parts(branches[0])
            suppliers = self.create_suppliers()
            purchase_orders = self.create_purchase_orders(branches[0], suppliers, parts, users)
            contracts = self.create_contracts(customers, vehicles)
            appointments = self.create_appointments(customers, vehicles, branches, users)
            job_cards = self.create_job_cards_all_stages(customers, vehicles, branches, users, bays)
            self.create_technician_schedules(users, branches)
            self.create_analytics_snapshots(branches)
            self.create_notifications(users, job_cards)
            self.create_license()

        self.stdout.write(self.style.SUCCESS('Successfully seeded all sample data!'))

    def clear_data(self):
        models_to_clear = [
            AnalyticsSnapshot, TechnicianSchedule, PurchaseOrderLine, PurchaseOrder,
            Supplier, Contract, Notification, Payment, Invoice, PartIssue, Part,
            ServiceEvent, EstimateLine, Estimate, DigitalInspection, Task, JobCard,
            Appointment, Bay, Vehicle, Customer, TechnicianMetrics, Profile, License
        ]
        for model in models_to_clear:
            model.objects.all().delete()

    def create_branches(self):
        self.stdout.write('  Creating branches...')
        branches_data = [
            {
                'code': 'HQ',
                'name': 'Headquarters',
                'address': '123 Auto Plaza, MG Road',
                'phone': '+91 22 1234 5678',
                'email': 'hq@autoserv.com',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'is_headquarters': True,
            },
            {
                'code': 'NM',
                'name': 'Navi Mumbai Branch',
                'address': '45 Seawoods Complex',
                'phone': '+91 22 8765 4321',
                'email': 'navimumbai@autoserv.com',
                'city': 'Navi Mumbai',
                'state': 'Maharashtra',
            },
            {
                'code': 'PUN',
                'name': 'Pune Branch',
                'address': '78 Koregaon Park',
                'phone': '+91 20 9876 5432',
                'email': 'pune@autoserv.com',
                'city': 'Pune',
                'state': 'Maharashtra',
            },
        ]

        branches = []
        hq = Branch.objects.filter(code='HQ').first()
        if hq:
            branches.append(hq)
        else:
            for data in branches_data:
                branch, _ = Branch.objects.get_or_create(code=data['code'], defaults=data)
                branches.append(branch)

        if len(branches) < 3:
            for data in branches_data[1:]:
                branch, _ = Branch.objects.get_or_create(code=data['code'], defaults=data)
                if branch not in branches:
                    branches.append(branch)

        return branches

    def create_users(self, branches):
        self.stdout.write('  Creating users and profiles...')
        hq = branches[0]
        
        users_data = [
            ('sysadmin', 'Asha', 'Nair', UserRole.SUPER_ADMIN, 'sysadmin@autoserv.com'),
            ('manager', 'Rohan', 'Mehta', UserRole.BRANCH_MANAGER, 'rohan@autoserv.com'),
            ('advisor1', 'Priya', 'Kapoor', UserRole.SERVICE_ADVISOR, 'priya@autoserv.com'),
            ('advisor2', 'Amit', 'Singh', UserRole.SERVICE_ADVISOR, 'amit@autoserv.com'),
            ('lead_tech', 'Sanjay', 'Iyer', UserRole.TECHNICIAN, 'sanjay@autoserv.com'),
            ('tech1', 'Vikram', 'Reddy', UserRole.TECHNICIAN, 'vikram@autoserv.com'),
            ('tech2', 'Raju', 'Sharma', UserRole.TECHNICIAN, 'raju@autoserv.com'),
            ('tech3', 'Deepak', 'Kumar', UserRole.TECHNICIAN, 'deepak@autoserv.com'),
            ('inventory', 'Neha', 'Gupta', UserRole.INVENTORY_MANAGER, 'neha@autoserv.com'),
            ('accounts', 'Suresh', 'Patel', UserRole.ACCOUNTS_OFFICER, 'suresh@autoserv.com'),
            ('crm', 'Kavita', 'Rao', UserRole.CRM_EXECUTIVE, 'kavita@autoserv.com'),
        ]

        users = {}
        for username, first_name, last_name, role, email in users_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'email': email,
                }
            )
            if created:
                user.set_password('password123')
                user.save()

            profile, _ = Profile.objects.get_or_create(
                user=user,
                defaults={
                    'role': role,
                    'branch': hq,
                    'employee_id': f'EMP-{username.upper()}',
                    'phone': f'+91 98765 {random.randint(10000, 99999)}',
                    'skills': ['General Service', 'Diagnostics'] if role == UserRole.TECHNICIAN else [],
                    'hourly_rate': Decimal('500') if role == UserRole.TECHNICIAN else Decimal('0'),
                    'is_available': True,
                }
            )
            
            if role == UserRole.TECHNICIAN:
                TechnicianMetrics.objects.get_or_create(
                    profile=profile,
                    defaults={
                        'total_jobs_completed': random.randint(50, 200),
                        'total_productive_hours': Decimal(str(random.randint(500, 1500))),
                        'total_idle_hours': Decimal(str(random.randint(50, 200))),
                        'rework_count': random.randint(0, 10),
                        'average_rating': Decimal(str(round(random.uniform(3.5, 5.0), 2))),
                    }
                )
            
            users[username] = user

        return users

    def create_customers(self, branches):
        self.stdout.write('  Creating customers...')
        hq = branches[0]
        
        customers_data = [
            {
                'name': 'Rajiv Sharma',
                'phone': '+91 98765 12345',
                'email': 'rajiv.sharma@gmail.com',
                'address': '101, Seaview Apartments, Bandra West',
                'city': 'Mumbai',
                'customer_type': 'Individual',
                'loyalty_points': 1500,
            },
            {
                'name': 'Ananya Patel',
                'phone': '+91 98765 23456',
                'email': 'ananya.patel@gmail.com',
                'address': '202, Green Valley, Powai',
                'city': 'Mumbai',
                'customer_type': 'Individual',
                'loyalty_points': 2500,
            },
            {
                'name': 'Metro Logistics Pvt Ltd',
                'phone': '+91 22 4567 8901',
                'email': 'fleet@metrologistics.in',
                'address': 'Industrial Area, Thane',
                'city': 'Thane',
                'customer_type': 'Corporate',
                'gst_number': '27AABCM1234A1Z5',
                'credit_limit': Decimal('500000'),
                'loyalty_points': 10000,
            },
            {
                'name': 'Vikash Agarwal',
                'phone': '+91 98765 34567',
                'email': 'vikash.agarwal@gmail.com',
                'address': '303, Palm Heights, Juhu',
                'city': 'Mumbai',
                'customer_type': 'Individual',
                'loyalty_points': 800,
            },
            {
                'name': 'Sunita Joshi',
                'phone': '+91 98765 45678',
                'email': 'sunita.joshi@gmail.com',
                'address': '404, Lake View, Andheri',
                'city': 'Mumbai',
                'customer_type': 'Individual',
                'loyalty_points': 1200,
            },
        ]

        customers = []
        for data in customers_data:
            customer, _ = Customer.objects.get_or_create(
                email=data['email'],
                defaults={**data, 'branch': hq}
            )
            customers.append(customer)

        return customers

    def create_vehicles(self, customers):
        self.stdout.write('  Creating vehicles...')
        
        vehicles_data = [
            (customers[0], 'CAR', 'Ford', 'Endeavour', '2022', 'MH12AB1234', 'White', 'Diesel', 'Automatic', 45000),
            (customers[0], 'BIKE', 'KTM', 'Duke 390', '2023', 'MH12CD5678', 'Orange', 'Petrol', 'Manual', 8000),
            (customers[1], 'CAR', 'Tesla', 'Model 3', '2024', 'MH01EF9012', 'Black', 'Electric', 'Automatic', 12000),
            (customers[1], 'BIKE', 'Honda', 'Activa 6G', '2023', 'MH01GH3456', 'White', 'Petrol', 'Automatic', 5000),
            (customers[2], 'TRUCK', 'Tata', 'Ace', '2021', 'MH43IJ7890', 'White', 'Diesel', 'Manual', 85000),
            (customers[2], 'TRUCK', 'Mahindra', 'Bolero Pickup', '2022', 'MH43KL1234', 'White', 'Diesel', 'Manual', 65000),
            (customers[2], 'CAR', 'Maruti', 'Swift Dzire', '2023', 'MH43MN5678', 'Silver', 'Petrol', 'Manual', 25000),
            (customers[3], 'CAR', 'Hyundai', 'Creta', '2023', 'MH02OP9012', 'Blue', 'Diesel', 'Automatic', 18000),
            (customers[4], 'CAR', 'Toyota', 'Innova Crysta', '2022', 'MH04QR3456', 'Grey', 'Diesel', 'Automatic', 55000),
            (customers[4], 'BIKE', 'Royal Enfield', 'Classic 350', '2023', 'MH04ST7890', 'Black', 'Petrol', 'Manual', 3000),
        ]

        vehicles = []
        for customer, v_type, make, model, year, plate, color, fuel, trans, odo in vehicles_data:
            vin = f'VIN{plate.replace(" ", "")}{random.randint(100000, 999999)}'
            vehicle, _ = Vehicle.objects.get_or_create(
                plate_number=plate,
                defaults={
                    'customer': customer,
                    'vin': vin,
                    'make': make,
                    'model': model,
                    'year': int(year),
                    'color': color,
                    'fuel_type': fuel,
                    'transmission': trans,
                    'vehicle_type': v_type,
                    'current_odometer': odo,
                    'insurance_expiry': date.today() + timedelta(days=random.randint(30, 365)),
                    'puc_expiry': date.today() + timedelta(days=random.randint(30, 180)),
                    'warranty_expiry': date.today() + timedelta(days=random.randint(-30, 365)),
                    'amc_expiry': date.today() + timedelta(days=random.randint(-30, 365)) if random.random() > 0.5 else None,
                }
            )
            vehicles.append(vehicle)

        return vehicles

    def create_bays(self, branches):
        self.stdout.write('  Creating service bays...')
        hq = branches[0]
        
        bays_data = [
            ('BAY-01', 'General Service'),
            ('BAY-02', 'General Service'),
            ('BAY-03', 'Engine Repair'),
            ('BAY-04', 'Body Shop'),
            ('BAY-05', 'Quick Service'),
            ('BAY-06', 'EV Service'),
        ]

        bays = []
        for bay_num, bay_type in bays_data:
            bay, _ = Bay.objects.get_or_create(
                branch=hq,
                bay_number=bay_num,
                defaults={'bay_type': bay_type, 'is_available': True}
            )
            bays.append(bay)

        return bays

    def create_parts(self, branch):
        self.stdout.write('  Creating parts inventory...')
        
        parts_data = [
            ('Engine Oil 5W30', 'OIL-5W30', 'Lubricants', 'Castrol', 850, 1200, 50),
            ('Oil Filter', 'FLT-OIL-001', 'Filters', 'Bosch', 250, 450, 100),
            ('Air Filter', 'FLT-AIR-001', 'Filters', 'Mann', 350, 650, 80),
            ('Brake Pads Front', 'BRK-PAD-F01', 'Brakes', 'Brembo', 1500, 2800, 40),
            ('Brake Pads Rear', 'BRK-PAD-R01', 'Brakes', 'Brembo', 1200, 2200, 40),
            ('Spark Plug', 'SPK-PLG-001', 'Ignition', 'NGK', 180, 350, 200),
            ('Battery 12V 65AH', 'BAT-12V-65', 'Electrical', 'Exide', 4500, 7500, 20),
            ('Coolant 1L', 'COL-1L-001', 'Fluids', 'Prestone', 300, 550, 100),
            ('Wiper Blade Set', 'WIP-BLD-001', 'Accessories', 'Bosch', 400, 750, 60),
            ('AC Filter', 'FLT-AC-001', 'Filters', 'Denso', 450, 800, 50),
            ('Timing Belt', 'TIM-BLT-001', 'Engine', 'Gates', 2500, 4500, 15),
            ('Clutch Plate', 'CLT-PLT-001', 'Transmission', 'Valeo', 3500, 6500, 10),
        ]

        parts = []
        for name, sku, category, brand, cost, sell, stock in parts_data:
            part, _ = Part.objects.get_or_create(
                sku=sku,
                defaults={
                    'branch': branch,
                    'name': name,
                    'category': category,
                    'brand': brand,
                    'cost_price': Decimal(str(cost)),
                    'selling_price': Decimal(str(sell)),
                    'mrp': Decimal(str(int(sell * 1.1))),
                    'stock': stock,
                    'min_stock': 10,
                    'max_stock': 200,
                }
            )
            parts.append(part)

        return parts

    def create_suppliers(self):
        self.stdout.write('  Creating suppliers...')
        
        suppliers_data = [
            {
                'name': 'AutoParts India Ltd',
                'contact_person': 'Ramesh Kumar',
                'phone': '+91 22 5555 1234',
                'email': 'orders@autopartsindia.com',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'gst_number': '27AABCA1234B1Z5',
                'categories': ['Filters', 'Lubricants', 'Fluids'],
                'payment_terms': 'Net 30',
                'credit_limit': Decimal('200000'),
                'rating': Decimal('4.5'),
            },
            {
                'name': 'Brake Systems Pvt Ltd',
                'contact_person': 'Sunil Verma',
                'phone': '+91 22 5555 5678',
                'email': 'sales@brakesystems.in',
                'city': 'Pune',
                'state': 'Maharashtra',
                'gst_number': '27AABCB5678C1Z5',
                'categories': ['Brakes', 'Suspension'],
                'payment_terms': 'Net 45',
                'credit_limit': Decimal('300000'),
                'rating': Decimal('4.8'),
            },
            {
                'name': 'Electric Auto Components',
                'contact_person': 'Priya Menon',
                'phone': '+91 22 5555 9012',
                'email': 'info@electricauto.com',
                'city': 'Chennai',
                'state': 'Tamil Nadu',
                'gst_number': '33AABCE9012D1Z5',
                'categories': ['Electrical', 'Ignition', 'Lighting'],
                'payment_terms': 'Net 30',
                'credit_limit': Decimal('150000'),
                'rating': Decimal('4.2'),
            },
        ]

        suppliers = []
        for data in suppliers_data:
            supplier, _ = Supplier.objects.get_or_create(
                email=data['email'],
                defaults=data
            )
            suppliers.append(supplier)

        return suppliers

    def create_purchase_orders(self, branch, suppliers, parts, users):
        self.stdout.write('  Creating purchase orders...')
        
        manager = users.get('manager')
        inventory = users.get('inventory')
        
        po_data = [
            (suppliers[0], PurchaseOrderStatus.RECEIVED, [parts[0], parts[1], parts[2]]),
            (suppliers[1], PurchaseOrderStatus.ORDERED, [parts[3], parts[4]]),
            (suppliers[2], PurchaseOrderStatus.DRAFT, [parts[5], parts[6]]),
        ]

        purchase_orders = []
        for supplier, status, po_parts in po_data:
            po, created = PurchaseOrder.objects.get_or_create(
                supplier=supplier,
                status=status,
                defaults={
                    'branch': branch,
                    'order_date': date.today() - timedelta(days=random.randint(1, 30)),
                    'expected_delivery': date.today() + timedelta(days=random.randint(1, 14)),
                    'created_by': inventory,
                    'approved_by': manager if status != PurchaseOrderStatus.DRAFT else None,
                }
            )
            
            if created:
                subtotal = Decimal('0')
                for part in po_parts:
                    qty = random.randint(10, 50)
                    line_total = part.cost_price * qty
                    PurchaseOrderLine.objects.create(
                        purchase_order=po,
                        part=part,
                        quantity_ordered=qty,
                        quantity_received=qty if status == PurchaseOrderStatus.RECEIVED else 0,
                        unit_price=part.cost_price,
                        total=line_total,
                    )
                    subtotal += line_total
                
                po.subtotal = subtotal
                po.tax = subtotal * Decimal('0.18')
                po.grand_total = subtotal + po.tax
                po.save()
            
            purchase_orders.append(po)

        return purchase_orders

    def create_contracts(self, customers, vehicles):
        self.stdout.write('  Creating contracts...')
        
        contracts_data = [
            (vehicles[0], ContractType.WARRANTY, 'Ford India', 365),
            (vehicles[0], ContractType.EXTENDED_WARRANTY, 'Ford Extended', 730),
            (vehicles[2], ContractType.INSURANCE, 'ICICI Lombard', 365),
            (vehicles[4], ContractType.AMC, 'Metro Fleet AMC', 365),
            (vehicles[5], ContractType.AMC, 'Metro Fleet AMC', 365),
            (vehicles[8], ContractType.SERVICE_PACKAGE, 'Toyota Express Service', 365),
        ]

        contracts = []
        for vehicle, contract_type, provider, days in contracts_data:
            contract, _ = Contract.objects.get_or_create(
                vehicle=vehicle,
                contract_type=contract_type,
                defaults={
                    'customer': vehicle.customer,
                    'provider': provider,
                    'policy_number': f'POL-{random.randint(100000, 999999)}',
                    'start_date': date.today() - timedelta(days=random.randint(30, 180)),
                    'end_date': date.today() + timedelta(days=days),
                    'coverage_amount': Decimal(str(random.randint(50000, 500000))),
                    'premium': Decimal(str(random.randint(5000, 50000))),
                    'services_included': ['Oil Change', 'Filter Replacement', 'General Checkup'],
                    'max_services': 4 if contract_type in [ContractType.AMC, ContractType.SERVICE_PACKAGE] else None,
                }
            )
            contracts.append(contract)

        return contracts

    def create_appointments(self, customers, vehicles, branches, users):
        self.stdout.write('  Creating appointments...')
        hq = branches[0]
        advisor = users.get('advisor1')
        
        appointments_data = [
            (customers[0], vehicles[0], 'SCHEDULED', 1, 'General Service'),
            (customers[0], vehicles[1], 'CONFIRMED', 2, 'Bike Service'),
            (customers[1], vehicles[2], 'SCHEDULED', 3, 'EV Checkup'),
            (customers[3], vehicles[7], 'CANCELLED', -1, 'Oil Change'),
            (customers[4], vehicles[8], 'COMPLETED', -5, 'Major Service'),
        ]

        appointments = []
        for customer, vehicle, status, days_offset, service_type in appointments_data:
            appt, _ = Appointment.objects.get_or_create(
                customer=customer,
                vehicle=vehicle,
                appointment_date=date.today() + timedelta(days=days_offset),
                defaults={
                    'branch': hq,
                    'service_advisor': advisor,
                    'appointment_time': time(hour=random.randint(9, 16), minute=0),
                    'estimated_duration': Decimal('2.0'),
                    'service_type': service_type,
                    'complaint': f'Customer requests {service_type}',
                    'status': status,
                }
            )
            appointments.append(appt)

        return appointments

    def create_job_cards_all_stages(self, customers, vehicles, branches, users, bays):
        self.stdout.write('  Creating job cards for all workflow stages...')
        hq = branches[0]
        advisor = users.get('advisor1')
        lead_tech = users.get('lead_tech')
        tech1 = users.get('tech1')
        manager = users.get('manager')

        STAGE_ORDER = {
            WorkflowStage.APPOINTMENT: 0,
            WorkflowStage.CHECK_IN: 1,
            WorkflowStage.INSPECTION: 2,
            WorkflowStage.JOB_CARD: 3,
            WorkflowStage.ESTIMATE: 4,
            WorkflowStage.APPROVAL: 5,
            WorkflowStage.EXECUTION: 6,
            WorkflowStage.QC: 7,
            WorkflowStage.BILLING: 8,
            WorkflowStage.DELIVERY: 9,
            WorkflowStage.COMPLETED: 10,
        }

        stages = [
            (WorkflowStage.APPOINTMENT, 'Scheduled Service', customers[0], vehicles[0]),
            (WorkflowStage.CHECK_IN, 'Vehicle Check-in', customers[1], vehicles[2]),
            (WorkflowStage.INSPECTION, 'Digital Inspection', customers[0], vehicles[1]),
            (WorkflowStage.JOB_CARD, 'Job Card Created', customers[2], vehicles[4]),
            (WorkflowStage.ESTIMATE, 'Awaiting Approval', customers[3], vehicles[7]),
            (WorkflowStage.APPROVAL, 'Customer Approved', customers[2], vehicles[5]),
            (WorkflowStage.EXECUTION, 'Work In Progress', customers[4], vehicles[8]),
            (WorkflowStage.QC, 'Quality Check', customers[2], vehicles[6]),
            (WorkflowStage.BILLING, 'Invoice Generated', customers[4], vehicles[9]),
            (WorkflowStage.DELIVERY, 'Ready for Delivery', customers[1], vehicles[3]),
            (WorkflowStage.COMPLETED, 'Service Completed', customers[0], vehicles[0]),
        ]

        job_cards = []
        for idx, (stage, job_type, customer, vehicle) in enumerate(stages):
            stage_idx = STAGE_ORDER[stage]
            
            jc, created = JobCard.objects.get_or_create(
                vehicle=vehicle,
                workflow_stage=stage,
                defaults={
                    'branch': hq,
                    'customer': customer,
                    'service_advisor': advisor,
                    'lead_technician': lead_tech if stage_idx >= STAGE_ORDER[WorkflowStage.JOB_CARD] else None,
                    'bay': bays[idx % len(bays)] if stage_idx >= STAGE_ORDER[WorkflowStage.CHECK_IN] else None,
                    'job_type': job_type,
                    'priority': random.choice(['Normal', 'High', 'Urgent']),
                    'complaint': f'Customer complaint for {job_type}',
                    'odometer_in': vehicle.current_odometer + random.randint(100, 500),
                    'fuel_level_in': random.choice(['Full', '3/4', '1/2', '1/4']),
                    'estimated_hours': Decimal(str(random.randint(2, 8))),
                    'estimated_amount': Decimal(str(random.randint(5000, 25000))),
                    'created_by': advisor,
                }
            )
            
            if created:
                ServiceEvent.objects.create(
                    job_card=jc,
                    event_type=ServiceEventType.WORKFLOW_TRANSITION,
                    actor=advisor,
                    old_value='',
                    new_value=stage.value,
                    comment=f'Job card created at stage {stage.label}',
                )
                
                if stage_idx >= STAGE_ORDER[WorkflowStage.INSPECTION]:
                    DigitalInspection.objects.create(
                        job_card=jc,
                        inspector=tech1,
                        checklist_data={
                            'exterior': {'condition': 'Good', 'scratches': False},
                            'interior': {'condition': 'Good', 'cleanliness': 'Clean'},
                            'engine': {'oil_level': 'OK', 'leaks': False},
                            'tires': {'front_left': '80%', 'front_right': '75%', 'rear_left': '85%', 'rear_right': '80%'},
                            'brakes': {'front': 'Good', 'rear': 'Good'},
                        },
                        findings='Vehicle in generally good condition. Minor wear on tires.',
                        recommendations='Recommend tire rotation. Next service in 5000km.',
                        is_completed=True,
                    )
                
                if stage_idx >= STAGE_ORDER[WorkflowStage.JOB_CARD]:
                    tasks_data = [
                        ('Oil and Filter Change', 'Maintenance', TaskStatus.COMPLETED if stage_idx >= STAGE_ORDER[WorkflowStage.QC] else TaskStatus.IN_PROGRESS),
                        ('Brake Inspection', 'Inspection', TaskStatus.COMPLETED if stage_idx >= STAGE_ORDER[WorkflowStage.QC] else TaskStatus.PENDING),
                        ('Air Filter Replacement', 'Maintenance', TaskStatus.PENDING),
                    ]
                    for task_desc, category, status in tasks_data:
                        Task.objects.create(
                            job_card=jc,
                            description=task_desc,
                            category=category,
                            assigned_technician=tech1,
                            status=status,
                            estimated_hours=Decimal('1.5'),
                            actual_hours=Decimal('1.2') if status == TaskStatus.COMPLETED else Decimal('0'),
                            labor_rate=Decimal('500'),
                            labor_cost=Decimal('600') if status == TaskStatus.COMPLETED else Decimal('0'),
                            checklist=[{'item': 'Step 1', 'done': True}, {'item': 'Step 2', 'done': status == TaskStatus.COMPLETED}],
                            checklist_completed=status == TaskStatus.COMPLETED,
                            evidence_photos=['photo1.jpg'] if status == TaskStatus.COMPLETED else [],
                        )
                
                if stage_idx >= STAGE_ORDER[WorkflowStage.ESTIMATE]:
                    estimate = Estimate.objects.create(
                        job_card=jc,
                        version=1,
                        labor_total=Decimal('3000'),
                        parts_total=Decimal('5000'),
                        discount=Decimal('500'),
                        tax=Decimal('1350'),
                        grand_total=Decimal('8850'),
                        approval_status=ApprovalStatus.APPROVED if stage_idx >= STAGE_ORDER[WorkflowStage.APPROVAL] else ApprovalStatus.PENDING,
                        approved_by=manager if stage_idx >= STAGE_ORDER[WorkflowStage.APPROVAL] else None,
                        approval_date=timezone.now() if stage_idx >= STAGE_ORDER[WorkflowStage.APPROVAL] else None,
                        created_by=advisor,
                    )
                    
                    EstimateLine.objects.create(
                        estimate=estimate,
                        line_type='LABOR',
                        description='General Service Labor',
                        quantity=Decimal('3'),
                        unit_price=Decimal('1000'),
                        total=Decimal('3000'),
                        is_approved=stage_idx >= STAGE_ORDER[WorkflowStage.APPROVAL],
                    )
                    EstimateLine.objects.create(
                        estimate=estimate,
                        line_type='PART',
                        description='Engine Oil 5W30',
                        quantity=Decimal('4'),
                        unit_price=Decimal('1250'),
                        total=Decimal('5000'),
                        is_approved=stage_idx >= STAGE_ORDER[WorkflowStage.APPROVAL],
                    )
                
                if stage_idx >= STAGE_ORDER[WorkflowStage.BILLING]:
                    invoice = Invoice.objects.create(
                        job_card=jc,
                        customer=customer,
                        branch=hq,
                        labor_total=Decimal('3000'),
                        parts_total=Decimal('5000'),
                        subtotal=Decimal('8000'),
                        discount=Decimal('500'),
                        tax=Decimal('1350'),
                        grand_total=Decimal('8850'),
                        amount_paid=Decimal('0'),
                        payment_status='Pending',
                        created_by=manager,
                    )
                    
                    if stage == WorkflowStage.COMPLETED:
                        Payment.objects.create(
                            invoice=invoice,
                            amount=Decimal('8850'),
                            payment_method='CARD',
                            reference_number=f'TXN{random.randint(100000, 999999)}',
                            received_by=manager,
                        )
                        invoice.refresh_from_db()
                        invoice.payment_status = 'Paid'
                        invoice.save()
                
                if stage == WorkflowStage.COMPLETED:
                    jc.customer_rating = 5
                    jc.customer_feedback = 'Excellent service! Very professional team.'
                    jc.actual_delivery = timezone.now()
                    jc.save()
            
            job_cards.append(jc)

        return job_cards

    def create_technician_schedules(self, users, branches):
        self.stdout.write('  Creating technician schedules...')
        hq = branches[0]
        technicians = [users.get('tech1'), users.get('tech2'), users.get('tech3'), users.get('lead_tech')]
        
        for tech in technicians:
            if not tech:
                continue
            for day_offset in range(7):
                schedule_date = date.today() + timedelta(days=day_offset)
                if schedule_date.weekday() < 6:
                    TechnicianSchedule.objects.get_or_create(
                        technician=tech,
                        date=schedule_date,
                        defaults={
                            'branch': hq,
                            'shift_start': time(9, 0),
                            'shift_end': time(18, 0),
                            'break_start': time(13, 0),
                            'break_end': time(14, 0),
                            'is_available': True,
                            'is_on_leave': False,
                        }
                    )

    def create_analytics_snapshots(self, branches):
        self.stdout.write('  Creating analytics snapshots...')
        hq = branches[0]
        
        for day_offset in range(30):
            snapshot_date = date.today() - timedelta(days=day_offset)
            AnalyticsSnapshot.objects.get_or_create(
                branch=hq,
                date=snapshot_date,
                defaults={
                    'total_jobs': random.randint(15, 30),
                    'completed_jobs': random.randint(10, 25),
                    'revenue': Decimal(str(random.randint(150000, 350000))),
                    'labor_revenue': Decimal(str(random.randint(50000, 100000))),
                    'parts_revenue': Decimal(str(random.randint(100000, 250000))),
                    'average_job_value': Decimal(str(random.randint(8000, 15000))),
                    'average_cycle_time': Decimal(str(round(random.uniform(3.0, 8.0), 2))),
                    'sla_compliance_rate': Decimal(str(round(random.uniform(85.0, 98.0), 2))),
                    'customer_satisfaction': Decimal(str(round(random.uniform(4.0, 5.0), 2))),
                    'technician_utilization': Decimal(str(round(random.uniform(70.0, 95.0), 2))),
                    'first_time_fix_rate': Decimal(str(round(random.uniform(88.0, 98.0), 2))),
                    'new_customers': random.randint(2, 8),
                    'repeat_customers': random.randint(8, 20),
                    'appointments_scheduled': random.randint(10, 25),
                    'appointments_completed': random.randint(8, 22),
                }
            )

    def create_notifications(self, users, job_cards):
        self.stdout.write('  Creating notifications...')
        
        notifications_data = [
            (users.get('manager'), NotificationType.APPROVAL_REQUIRED, 'Estimate Approval Required', 'New estimate needs your approval'),
            (users.get('advisor1'), NotificationType.SERVICE_UPDATE, 'Vehicle Ready', 'Vehicle service completed and ready for delivery'),
            (users.get('tech1'), NotificationType.GENERAL, 'New Task Assigned', 'You have been assigned a new task'),
            (users.get('inventory'), NotificationType.GENERAL, 'Low Stock Alert', 'Oil filters are running low on stock'),
        ]

        for user, notif_type, title, message in notifications_data:
            if user:
                Notification.objects.get_or_create(
                    recipient=user,
                    title=title,
                    defaults={
                        'notification_type': notif_type,
                        'channel': NotificationChannel.IN_APP,
                        'message': message,
                        'is_read': False,
                        'is_sent': True,
                        'sent_at': timezone.now(),
                    }
                )

    def create_license(self):
        self.stdout.write('  Creating license...')
        License.objects.get_or_create(
            license_key='AUTOSERV-ENT-2024-PERPETUAL',
            defaults={
                'license_type': LicenseType.PERPETUAL,
                'status': LicenseStatus.ACTIVE,
                'organization_name': 'AutoServ Enterprise Demo',
                'max_branches': 10,
                'max_users': 100,
                'features': {
                    'multi_branch': True,
                    'analytics': True,
                    'ai_insights': True,
                    'tally_integration': True,
                    'stripe_payments': True,
                    'razorpay_payments': True,
                },
                'is_primary': True,
            }
        )
