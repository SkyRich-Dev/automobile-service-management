from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import (
    Branch, Profile, Customer, Vehicle, JobCard, Task, ServiceEvent,
    Part, Supplier, PurchaseOrder, Appointment, Contract, Lead,
    CustomerInteraction, Ticket, FollowUpTask, Campaign, Notification
)
from decimal import Decimal
from datetime import datetime, timedelta, date, time
import random


class Command(BaseCommand):
    help = 'Seed sample data for testing and demonstration'

    def handle(self, *args, **options):
        self.stdout.write('Starting sample data seeding...')
        
        branch = self.create_branch()
        users = self.create_users(branch)
        customers = self.create_customers()
        vehicles = self.create_vehicles(customers)
        parts = self.create_parts(branch)
        suppliers = self.create_suppliers()
        purchase_orders = self.create_purchase_orders(suppliers, branch)
        leads = self.create_leads(branch)
        appointments = self.create_appointments(customers, vehicles, branch, users)
        job_cards = self.create_job_cards(customers, vehicles, branch, users)
        contracts = self.create_contracts(customers, vehicles, branch)
        self.create_crm_data(customers, branch, users)
        
        self.stdout.write(self.style.SUCCESS('Sample data seeded successfully!'))
        self.stdout.write(f'  - 1 branch')
        self.stdout.write(f'  - {len(users)} users')
        self.stdout.write(f'  - {len(customers)} customers')
        self.stdout.write(f'  - {len(vehicles)} vehicles')
        self.stdout.write(f'  - {len(parts)} parts')
        self.stdout.write(f'  - {len(suppliers)} suppliers')
        self.stdout.write(f'  - {len(purchase_orders)} purchase orders')
        self.stdout.write(f'  - {len(leads)} leads')
        self.stdout.write(f'  - {len(appointments)} appointments')
        self.stdout.write(f'  - {len(job_cards)} job cards')
        self.stdout.write(f'  - {len(contracts)} contracts')

    def create_branch(self):
        branch, created = Branch.objects.get_or_create(
            name='AutoServ Main Branch',
            defaults={
                'code': 'MAIN001',
                'address': '123 Service Road, Mumbai',
                'city': 'Mumbai',
                'state': 'Maharashtra',
                'phone': '022-12345678',
                'email': 'main@autoserv.com',
                'is_active': True,
            }
        )
        if created:
            self.stdout.write(f'  Created branch: {branch.name}')
        return branch

    def create_users(self, branch):
        users_data = [
            ('admin', 'admin@autoserv.com', 'Admin', 'User', 'SUPER_ADMIN'),
            ('manager', 'manager@autoserv.com', 'Branch', 'Manager', 'BRANCH_MANAGER'),
            ('service_mgr', 'service.mgr@autoserv.com', 'Service', 'Manager', 'SERVICE_MANAGER'),
            ('advisor1', 'advisor1@autoserv.com', 'Ravi', 'Kumar', 'SERVICE_ADVISOR'),
            ('advisor2', 'advisor2@autoserv.com', 'Priya', 'Sharma', 'SERVICE_ADVISOR'),
            ('tech1', 'tech1@autoserv.com', 'Amit', 'Patel', 'TECHNICIAN'),
            ('tech2', 'tech2@autoserv.com', 'Suresh', 'Verma', 'TECHNICIAN'),
            ('tech3', 'tech3@autoserv.com', 'Vikram', 'Singh', 'TECHNICIAN'),
            ('inventory', 'inventory@autoserv.com', 'Inventory', 'Manager', 'INVENTORY_MANAGER'),
            ('accountant', 'accountant@autoserv.com', 'Meera', 'Reddy', 'ACCOUNTANT'),
            ('crm_exec', 'crm@autoserv.com', 'CRM', 'Executive', 'CRM_EXECUTIVE'),
        ]
        
        created_users = []
        for username, email, first_name, last_name, role in users_data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                }
            )
            if created:
                user.set_password('password123')
                user.save()
            
            profile, _ = Profile.objects.get_or_create(
                user=user,
                defaults={
                    'role': role,
                    'branch': branch,
                    'phone': f'98765432{len(created_users):02d}',
                }
            )
            created_users.append(user)
        
        return created_users

    def create_customers(self):
        customers_data = [
            ('Rajesh Kumar', '9876543210', 'rajesh.kumar@email.com', '123 MG Road, Mumbai'),
            ('Priya Sharma', '9876543211', 'priya.sharma@email.com', '456 Brigade Road, Bangalore'),
            ('Amit Patel', '9876543212', 'amit.patel@email.com', '789 FC Road, Pune'),
            ('Sunita Verma', '9876543213', 'sunita.verma@email.com', '321 Park Street, Kolkata'),
            ('Vikram Singh', '9876543214', 'vikram.singh@email.com', '654 Connaught Place, Delhi'),
            ('Meera Reddy', '9876543215', 'meera.reddy@email.com', '987 Jubilee Hills, Hyderabad'),
            ('Arjun Nair', '9876543216', 'arjun.nair@email.com', '147 Marine Drive, Kochi'),
            ('Kavitha Menon', '9876543217', 'kavitha.menon@email.com', '258 Anna Salai, Chennai'),
            ('Rohit Mehta', '9876543218', 'rohit.mehta@email.com', '369 SG Highway, Ahmedabad'),
            ('Deepa Joshi', '9876543219', 'deepa.joshi@email.com', '741 Civil Lines, Jaipur'),
        ]
        
        customers = []
        for name, phone, email, address in customers_data:
            customer, created = Customer.objects.get_or_create(
                phone=phone,
                defaults={
                    'name': name,
                    'email': email,
                    'address': address,
                    'customer_type': random.choice(['INDIVIDUAL', 'CORPORATE']),
                    'is_active': True,
                }
            )
            customers.append(customer)
        
        return customers

    def create_vehicles(self, customers):
        vehicles_data = [
            ('Maruti Suzuki', 'Swift', 2022, 'MH01AB1234', 'White', 'PETROL', 25000),
            ('Hyundai', 'Creta', 2023, 'KA02CD5678', 'Black', 'DIESEL', 15000),
            ('Tata', 'Nexon', 2021, 'MH03EF9012', 'Blue', 'PETROL', 35000),
            ('Honda', 'City', 2022, 'DL04GH3456', 'Silver', 'PETROL', 28000),
            ('Toyota', 'Fortuner', 2023, 'TN05IJ7890', 'White', 'DIESEL', 12000),
            ('Mahindra', 'XUV700', 2023, 'GJ06KL2345', 'Red', 'DIESEL', 8000),
            ('Kia', 'Seltos', 2022, 'RJ07MN6789', 'Grey', 'PETROL', 22000),
            ('MG', 'Hector', 2021, 'UP08OP0123', 'Black', 'DIESEL', 40000),
            ('Skoda', 'Kushaq', 2023, 'HR09QR4567', 'Orange', 'PETROL', 10000),
            ('Volkswagen', 'Taigun', 2022, 'PB10ST8901', 'White', 'PETROL', 18000),
            ('Maruti Suzuki', 'Baleno', 2021, 'MH11UV2345', 'Blue', 'PETROL', 45000),
            ('Hyundai', 'i20', 2022, 'KA12WX6789', 'Red', 'PETROL', 20000),
        ]
        
        vehicles = []
        for i, (make, model, year, plate, color, fuel, km) in enumerate(vehicles_data):
            customer = customers[i % len(customers)]
            vehicle, created = Vehicle.objects.get_or_create(
                vin=f'VIN{plate.replace(" ", "")}001',
                defaults={
                    'customer': customer,
                    'make': make,
                    'model': model,
                    'year': year,
                    'color': color,
                    'fuel_type': fuel,
                    'current_odometer': km,
                    'plate_number': plate,
                }
            )
            vehicles.append(vehicle)
        
        return vehicles

    def create_parts(self, branch):
        parts_data = [
            ('Engine Oil 5W-30', 'OIL-5W30-001', 'Lubricants', 850, 100, 20),
            ('Oil Filter', 'FILT-OIL-001', 'Filters', 350, 75, 15),
            ('Air Filter', 'FILT-AIR-001', 'Filters', 450, 60, 15),
            ('Brake Pads Front', 'BRK-PAD-F01', 'Brakes', 2200, 40, 10),
            ('Brake Pads Rear', 'BRK-PAD-R01', 'Brakes', 1800, 40, 10),
            ('Spark Plug Set', 'SPK-PLG-004', 'Ignition', 1200, 50, 12),
            ('Battery 12V 60Ah', 'BAT-12V-60', 'Electrical', 5500, 20, 5),
            ('Coolant 5L', 'COOL-5L-001', 'Fluids', 650, 80, 20),
            ('Wiper Blade Set', 'WIP-BLD-SET', 'Accessories', 550, 35, 10),
            ('Headlight Bulb H4', 'BLB-H4-001', 'Lighting', 280, 60, 15),
            ('AC Compressor', 'AC-COMP-001', 'AC Parts', 12000, 10, 3),
            ('Timing Belt', 'TIM-BLT-001', 'Engine', 3500, 25, 5),
            ('Clutch Plate', 'CLT-PLT-001', 'Transmission', 4500, 15, 4),
            ('Fuel Filter', 'FILT-FUL-001', 'Filters', 400, 50, 12),
            ('Radiator Hose', 'RAD-HSE-001', 'Cooling', 800, 30, 8),
        ]
        
        parts = []
        for name, sku, category, price, qty, reorder in parts_data:
            part, created = Part.objects.get_or_create(
                sku=sku,
                defaults={
                    'name': name,
                    'category': category,
                    'selling_price': Decimal(str(price)),
                    'cost_price': Decimal(str(int(price * 0.7))),
                    'stock': qty,
                    'min_stock': reorder,
                    'branch': branch,
                    'is_active': True,
                }
            )
            parts.append(part)
        
        return parts

    def create_suppliers(self):
        suppliers_data = [
            ('AutoParts India Ltd', 'Ramesh Agarwal', '9111222333', 'sales@autopartsindia.com', 'Mumbai', 'Maharashtra', '27AABCT1234A1ZV'),
            ('Genuine Spares Co', 'Sunil Kapoor', '9111222334', 'orders@genuinespares.com', 'Delhi', 'Delhi', '07AABCT2345B1ZV'),
            ('Premium Lubricants', 'Vijay Sharma', '9111222335', 'bulk@premiumlube.com', 'Chennai', 'Tamil Nadu', '33AABCT3456C1ZV'),
            ('Tire World Distributors', 'Anand Puri', '9111222336', 'sales@tireworld.com', 'Bangalore', 'Karnataka', '29AABCT4567D1ZV'),
            ('Electric Auto Parts', 'Mohan Das', '9111222337', 'info@electricauto.com', 'Pune', 'Maharashtra', '27AABCT5678E1ZV'),
        ]
        
        suppliers = []
        for name, contact, phone, email, city, state, gst in suppliers_data:
            supplier, created = Supplier.objects.get_or_create(
                gst_number=gst,
                defaults={
                    'name': name,
                    'contact_person': contact,
                    'phone': phone,
                    'email': email,
                    'city': city,
                    'state': state,
                    'payment_terms': random.choice(['NET_15', 'NET_30', 'NET_45']),
                    'credit_limit': Decimal('100000'),
                    'is_active': True,
                }
            )
            suppliers.append(supplier)
        
        return suppliers

    def create_purchase_orders(self, suppliers, branch):
        pos = []
        for i, supplier in enumerate(suppliers[:3]):
            po, created = PurchaseOrder.objects.get_or_create(
                supplier=supplier,
                branch=branch,
                status='PENDING_APPROVAL' if i == 0 else ('APPROVED' if i == 1 else 'ORDERED'),
                defaults={
                    'expected_delivery': date.today() + timedelta(days=7 + i * 3),
                    'notes': f'Sample PO for {supplier.name}',
                    'subtotal': Decimal(str(10000 + i * 5000)),
                    'tax': Decimal(str(1800 + i * 900)),
                    'grand_total': Decimal(str(11800 + i * 5900)),
                }
            )
            pos.append(po)
        
        return pos

    def create_leads(self, branch):
        leads_data = [
            ('Rohit Mehta', '9998887770', 'rohit.m@email.com', 'WALK_IN', 'NEW'),
            ('Anjali Gupta', '9998887771', 'anjali.g@email.com', 'WEBSITE', 'CONTACTED'),
            ('Suresh Iyer', '9998887772', 'suresh.i@email.com', 'REFERRAL', 'QUALIFIED'),
            ('Deepa Joshi', '9998887773', 'deepa.j@email.com', 'SOCIAL_MEDIA', 'QUOTED'),
            ('Karan Malhotra', '9998887774', 'karan.m@email.com', 'COLD_CALL', 'NEGOTIATION'),
            ('Neha Saxena', '9998887775', 'neha.s@email.com', 'ADVERTISEMENT', 'NEW'),
            ('Prakash Rao', '9998887776', 'prakash.r@email.com', 'WALK_IN', 'CONTACTED'),
        ]
        
        leads = []
        for name, phone, email, source, status in leads_data:
            lead, created = Lead.objects.get_or_create(
                phone=phone,
                defaults={
                    'name': name,
                    'email': email,
                    'source': source,
                    'status': status,
                    'branch': branch,
                    'service_interest': random.choice(['Regular Service', 'AC Repair', 'Engine Work', 'Body Work']),
                }
            )
            leads.append(lead)
        
        return leads

    def create_appointments(self, customers, vehicles, branch, users):
        service_types = ['Regular Service', 'Major Service', 'AC Service', 'Brake Service', 'Engine Checkup']
        times = [time(9, 0), time(10, 30), time(11, 0), time(14, 0), time(15, 30), time(16, 0)]
        statuses = ['SCHEDULED', 'CONFIRMED', 'SCHEDULED', 'CONFIRMED', 'SCHEDULED', 'CHECKED_IN']
        
        appointments = []
        for i in range(6):
            apt_date = date.today() + timedelta(days=i)
            customer = customers[i % len(customers)]
            vehicle = vehicles[i % len(vehicles)]
            
            apt, created = Appointment.objects.get_or_create(
                customer=customer,
                vehicle=vehicle,
                appointment_date=apt_date,
                appointment_time=times[i],
                defaults={
                    'branch': branch,
                    'service_type': service_types[i % len(service_types)],
                    'status': statuses[i],
                    'notes': f'Sample appointment for {service_types[i % len(service_types)]}',
                }
            )
            appointments.append(apt)
        
        return appointments

    def create_job_cards(self, customers, vehicles, branch, users):
        stages = [
            'APPOINTMENT', 'CHECK_IN', 'INSPECTION', 'JOB_CARD', 'ESTIMATE',
            'APPROVAL', 'EXECUTION', 'QC', 'BILLING', 'DELIVERY', 'COMPLETED'
        ]
        job_types = [
            'Regular Service', 'Major Service', 'AC Repair', 'Brake Service',
            'Engine Overhaul', 'Transmission Service', 'Electrical Repair',
            'Body Work', 'Wheel Alignment', 'Battery Replacement', 'Full Service'
        ]
        
        job_cards = []
        advisor = users[3] if len(users) > 3 else users[0]
        technician = users[5] if len(users) > 5 else users[0]
        
        for i, stage in enumerate(stages):
            customer = customers[i % len(customers)]
            vehicle = vehicles[i % len(vehicles)]
            
            jc, created = JobCard.objects.get_or_create(
                vehicle=vehicle,
                workflow_stage=stage,
                defaults={
                    'customer': customer,
                    'branch': branch,
                    'job_type': job_types[i],
                    'complaint': f'Customer reports issues related to {job_types[i]}',
                    'estimated_amount': Decimal(str(1500 + i * 500)),
                    'service_advisor': advisor,
                    'lead_technician': technician if stage in ['EXECUTION', 'QC', 'COMPLETED'] else None,
                    'priority': random.choice(['Low', 'Normal', 'High']),
                }
            )
            
            if created:
                ServiceEvent.objects.create(
                    job_card=jc,
                    event_type='WORKFLOW_TRANSITION',
                    old_value=None,
                    new_value=stage,
                    actor=advisor,
                    comment=f'Job card created at {stage} stage for demonstration',
                )
            
            job_cards.append(jc)
        
        return job_cards

    def create_contracts(self, customers, vehicles, branch):
        contract_types = ['WARRANTY', 'EXTENDED_WARRANTY', 'AMC', 'SERVICE_PACKAGE', 'INSURANCE']
        billing_models = ['ONE_TIME', 'YEARLY', 'MONTHLY', 'QUARTERLY']
        providers = ['OEM Warranty', 'Extended Care Plus', 'Premium AMC', 'Service Plus', 'Comprehensive Insurance']
        
        contracts = []
        for i, contract_type in enumerate(contract_types):
            customer = customers[i % len(customers)]
            vehicle = vehicles[i % len(vehicles)] if i < len(vehicles) else None
            
            start_date = date.today() - timedelta(days=i * 60)
            end_date = start_date + timedelta(days=365)
            
            contract, created = Contract.objects.get_or_create(
                customer=customer,
                contract_type=contract_type,
                policy_number=f'POL-2024-{1000 + i}',
                defaults={
                    'vehicle': vehicle,
                    'branch': branch,
                    'provider': providers[i],
                    'start_date': start_date,
                    'end_date': end_date,
                    'contract_value': Decimal(str((i + 1) * 15000)),
                    'billing_model': billing_models[i % len(billing_models)],
                    'max_services': 12 if contract_type == 'AMC' else None,
                    'status': 'ACTIVE',
                    'priority_handling': i % 2 == 0,
                    'auto_renewal': i % 3 == 0,
                }
            )
            contracts.append(contract)
        
        return contracts

    def create_crm_data(self, customers, branch, users):
        crm_user = users[-1] if users else None
        
        for i, customer in enumerate(customers[:5]):
            CustomerInteraction.objects.get_or_create(
                customer=customer,
                interaction_type=random.choice(['CALL', 'EMAIL', 'SMS', 'VISIT']),
                defaults={
                    'branch': branch,
                    'handled_by': crm_user,
                    'description': f'Follow-up interaction with {customer.name}',
                    'outcome': random.choice(['POSITIVE', 'NEUTRAL', 'FOLLOW_UP_NEEDED']),
                }
            )
            
            if i < 3:
                Ticket.objects.get_or_create(
                    customer=customer,
                    subject=f'Service inquiry from {customer.name}',
                    defaults={
                        'branch': branch,
                        'ticket_type': random.choice(['SERVICE_QUALITY', 'BILLING_DISPUTE', 'FEEDBACK', 'GENERAL_INQUIRY']),
                        'priority': random.choice(['LOW', 'MEDIUM', 'HIGH']),
                        'status': random.choice(['RAISED', 'IN_PROGRESS', 'RESOLVED']),
                        'description': f'Customer {customer.name} raised a query about their recent service.',
                    }
                )
            
            if i < 4:
                FollowUpTask.objects.get_or_create(
                    customer=customer,
                    subject=f'Follow up with {customer.name}',
                    defaults={
                        'branch': branch,
                        'assigned_to': crm_user,
                        'follow_up_type': 'GENERAL',
                        'due_date': datetime.now() + timedelta(days=i + 1),
                        'priority': random.choice(['LOW', 'MEDIUM', 'HIGH']),
                        'status': 'PENDING' if i < 2 else 'COMPLETED',
                        'description': f'Schedule follow-up call with {customer.name}',
                    }
                )
        
        self.stdout.write('  Created CRM interactions, tickets, and follow-up tasks')
