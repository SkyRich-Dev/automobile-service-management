from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal
from datetime import datetime, timedelta, date, time
import random
import uuid


class Command(BaseCommand):
    help = 'Seed comprehensive sample data across ALL modules (10-20 records each)'

    def handle(self, *args, **options):
        from api.models import (
            Branch, Profile, Customer, Vehicle, JobCard, Task, ServiceEvent, ServiceEventType,
            Part, Supplier, PurchaseOrder, PurchaseOrderLine, Appointment, Contract, Lead,
            CustomerInteraction, Ticket, FollowUpTask, Campaign, Notification,
            Bay, DigitalInspection, Estimate, EstimateLine, Invoice, Payment,
            Skill, Employee, EmployeeSkill, TrainingProgram, TrainingEnrollment,
            IncentiveRule, EmployeeIncentive, LeaveType, LeaveBalance, LeaveRequest,
            Holiday, HRShift, EmployeeShift, AttendanceRecord, HRAttendance, Payroll, Department,
            Account, TaxRate, EnhancedInvoice, EnhancedPayment,
            Expense, ExpenseCategory,
            AnalyticsSnapshot, TechnicianSchedule, InventoryAlert,
            ConfigCategory, ConfigOption,
            WorkflowStage, TaskStatus, UserRole, ItemType, TaxCategory,
            PurchaseOrderStatus, AccountCategory, AccountType, InvoiceStatus, InvoiceType,
            SkillCategory, SkillLevel, EmploymentType,
            InteractionType, InteractionOutcome, CommunicationChannel,
            IncentiveType, ExpenseStatus,
            ContractType, ContractStatus, BillingModel,
            LeadSource, LeadStatus,
        )
        self.models = {
            'Branch': Branch, 'Profile': Profile, 'Customer': Customer, 'Vehicle': Vehicle,
            'JobCard': JobCard, 'Task': Task, 'ServiceEvent': ServiceEvent, 'ServiceEventType': ServiceEventType,
            'Part': Part, 'Supplier': Supplier, 'PurchaseOrder': PurchaseOrder, 'PurchaseOrderLine': PurchaseOrderLine,
            'Appointment': Appointment, 'Contract': Contract, 'Lead': Lead,
            'CustomerInteraction': CustomerInteraction, 'Ticket': Ticket, 'FollowUpTask': FollowUpTask,
            'Campaign': Campaign, 'Notification': Notification, 'Bay': Bay,
            'DigitalInspection': DigitalInspection, 'Estimate': Estimate, 'EstimateLine': EstimateLine,
            'Invoice': Invoice, 'Payment': Payment, 'Skill': Skill, 'Employee': Employee,
            'EmployeeSkill': EmployeeSkill, 'TrainingProgram': TrainingProgram,
            'TrainingEnrollment': TrainingEnrollment, 'IncentiveRule': IncentiveRule,
            'EmployeeIncentive': EmployeeIncentive, 'LeaveType': LeaveType,
            'LeaveBalance': LeaveBalance, 'LeaveRequest': LeaveRequest,
            'Holiday': Holiday, 'HRShift': HRShift, 'EmployeeShift': EmployeeShift,
            'AttendanceRecord': AttendanceRecord, 'HRAttendance': HRAttendance, 'Payroll': Payroll, 'Department': Department,
            'Account': Account, 'TaxRate': TaxRate, 'EnhancedInvoice': EnhancedInvoice,
            'EnhancedPayment': EnhancedPayment, 'Expense': Expense,
            'ExpenseCategory': ExpenseCategory, 'AnalyticsSnapshot': AnalyticsSnapshot,
            'TechnicianSchedule': TechnicianSchedule, 'InventoryAlert': InventoryAlert,
            'ConfigCategory': ConfigCategory, 'ConfigOption': ConfigOption,
        }
        self.enums = {
            'WorkflowStage': WorkflowStage, 'TaskStatus': TaskStatus, 'UserRole': UserRole,
            'ItemType': ItemType, 'TaxCategory': TaxCategory, 'PurchaseOrderStatus': PurchaseOrderStatus,
            'AccountCategory': AccountCategory, 'AccountType': AccountType,
            'InvoiceStatus': InvoiceStatus, 'InvoiceType': InvoiceType,
            'SkillCategory': SkillCategory, 'SkillLevel': SkillLevel,
            'EmploymentType': EmploymentType, 'InteractionType': InteractionType,
            'InteractionOutcome': InteractionOutcome, 'CommunicationChannel': CommunicationChannel,
            'IncentiveType': IncentiveType, 'ExpenseStatus': ExpenseStatus,
            'ContractType': ContractType, 'ContractStatus': ContractStatus,
            'BillingModel': BillingModel, 'LeadSource': LeadSource, 'LeadStatus': LeadStatus,
            'ServiceEventType': ServiceEventType,
        }

        self.stdout.write('Starting comprehensive sample data seeding...\n')

        branches = self._seed_branches()
        users = self._seed_users(branches)
        departments = self._seed_departments(branches)
        customers = self._seed_customers(branches)
        vehicles = self._seed_vehicles(customers)
        self._seed_bays(branches)
        suppliers = self._seed_suppliers()
        parts = self._seed_parts(branches, suppliers)
        leads = self._seed_leads(branches, users)
        self._seed_appointments(customers, vehicles, branches, users)
        job_cards = self._seed_job_cards(customers, vehicles, branches, users)
        self._seed_tasks(job_cards, users)
        self._seed_inspections(job_cards, users)
        self._seed_estimates(job_cards, parts, users)
        invoices = self._seed_invoices(job_cards, users, customers, branches)
        self._seed_payments(invoices)
        self._seed_contracts(customers, vehicles, branches, users)
        self._seed_purchase_orders(suppliers, branches, parts, users)
        self._seed_crm_interactions(customers, leads, branches, users)
        self._seed_tickets(customers, branches, users)
        self._seed_follow_up_tasks(customers, leads, branches, users)
        self._seed_campaigns(branches, users)
        self._seed_notifications(users)
        skills = self._seed_skills()
        employees = self._seed_employees(users)
        self._seed_employee_skills(employees, skills)
        self._seed_training(skills, employees, users, branches)
        leave_types = self._seed_leave_types()
        self._seed_leave_data(employees, leave_types, users)
        self._seed_holidays(branches)
        shifts = self._seed_shifts(branches)
        self._seed_employee_shifts(employees, shifts)
        self._seed_attendance(employees, users)
        self._seed_incentives(employees, users)
        self._seed_payroll(employees, users)
        accounts = self._seed_accounts(branches)
        self._seed_tax_rates()
        self._seed_enhanced_invoices(job_cards, customers, branches, users, accounts)
        self._seed_expenses(branches, users)
        self._seed_analytics(branches)
        self._seed_technician_schedules(branches, users)
        self._seed_inventory_alerts(parts)
        self._seed_config_options()

        self.stdout.write(self.style.SUCCESS('\nComprehensive sample data seeded successfully!'))

    def _safe(self, fn_name, fn, *args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'    Warning in {fn_name}: {e}'))
            return None

    def _seed_branches(self):
        self.stdout.write('  Seeding branches...')
        Branch = self.models['Branch']
        data = [
            {'code': 'HQ', 'name': 'Headquarters - Mumbai', 'city': 'Mumbai', 'state': 'Maharashtra', 'address': '1 Gateway Rd, Mumbai', 'phone': '+91 22 2222 0001', 'email': 'hq@autoserv.app', 'is_headquarters': True},
            {'code': 'BR-MUM-W', 'name': 'Mumbai West Branch', 'city': 'Mumbai', 'state': 'Maharashtra', 'address': '45 Andheri West, Mumbai', 'phone': '+91 22 2222 0002', 'email': 'mumbai.west@autoserv.app'},
            {'code': 'BR-DEL', 'name': 'Delhi NCR Branch', 'city': 'New Delhi', 'state': 'Delhi', 'address': '12 Connaught Place, New Delhi', 'phone': '+91 11 4444 0001', 'email': 'delhi@autoserv.app'},
            {'code': 'BR-BLR', 'name': 'Bangalore Branch', 'city': 'Bangalore', 'state': 'Karnataka', 'address': '78 MG Road, Bangalore', 'phone': '+91 80 5555 0001', 'email': 'bangalore@autoserv.app'},
            {'code': 'BR-CHN', 'name': 'Chennai Branch', 'city': 'Chennai', 'state': 'Tamil Nadu', 'address': '22 Anna Salai, Chennai', 'phone': '+91 44 6666 0001', 'email': 'chennai@autoserv.app'},
            {'code': 'BR-PUN', 'name': 'Pune Branch', 'city': 'Pune', 'state': 'Maharashtra', 'address': '5 FC Road, Pune', 'phone': '+91 20 7777 0001', 'email': 'pune@autoserv.app'},
        ]
        result = []
        for d in data:
            b, _ = Branch.objects.get_or_create(code=d['code'], defaults=d)
            result.append(b)
        self.stdout.write(f'    {len(result)} branches')
        return result

    def _seed_users(self, branches):
        self.stdout.write('  Seeding users & profiles...')
        Profile = self.models['Profile']
        UserRole = self.enums['UserRole']
        defs = [
            ('ceo_ravi', 'Ravi', 'Sharma', UserRole.CEO_OWNER, 0),
            ('rm_priya', 'Priya', 'Nair', UserRole.REGIONAL_MANAGER, 0),
            ('bm_arjun', 'Arjun', 'Patel', UserRole.BRANCH_MANAGER, 0),
            ('bm_meera', 'Meera', 'Gupta', UserRole.BRANCH_MANAGER, 2),
            ('sm_vikram', 'Vikram', 'Singh', UserRole.SERVICE_MANAGER, 0),
            ('sm_neha', 'Neha', 'Reddy', UserRole.SALES_MANAGER, 0),
            ('am_suresh', 'Suresh', 'Iyer', UserRole.ACCOUNTS_MANAGER, 0),
            ('sup_rajesh', 'Rajesh', 'Kumar', UserRole.SUPERVISOR, 0),
            ('sa_anita', 'Anita', 'Deshmukh', UserRole.SERVICE_ADVISOR, 0),
            ('sa_kiran', 'Kiran', 'Rao', UserRole.SERVICE_ADVISOR, 2),
            ('se_manoj', 'Manoj', 'Verma', UserRole.SERVICE_ENGINEER, 0),
            ('sx_divya', 'Divya', 'Menon', UserRole.SALES_EXECUTIVE, 0),
            ('acc_pooja', 'Pooja', 'Joshi', UserRole.ACCOUNTANT, 0),
            ('inv_rahul', 'Rahul', 'Malhotra', UserRole.INVENTORY_MANAGER, 0),
            ('hr_swati', 'Swati', 'Pandey', UserRole.HR_MANAGER, 0),
            ('tech_amit', 'Amit', 'Chavan', UserRole.TECHNICIAN, 0),
            ('tech_sanjay', 'Sanjay', 'Patil', UserRole.TECHNICIAN, 0),
            ('tech_ramu', 'Ramu', 'Yadav', UserRole.TECHNICIAN, 2),
            ('crm_sneha', 'Sneha', 'Kulkarni', UserRole.CRM_EXECUTIVE, 0),
        ]
        users = []
        for uname, first, last, role, bi in defs:
            user, created = User.objects.get_or_create(
                username=uname,
                defaults={'first_name': first, 'last_name': last, 'email': f'{uname}@autoserv.app', 'is_active': True}
            )
            if created:
                user.set_password('Pass@1234')
                user.save()
            Profile.objects.get_or_create(
                user=user,
                defaults={
                    'role': role, 'branch': branches[bi],
                    'employee_id': f'EMP-{uname.upper()[:8]}',
                    'phone': f'+91 9{random.randint(100000000, 999999999)}',
                    'is_available': True,
                    'hourly_rate': Decimal(str(random.randint(300, 1200))),
                }
            )
            users.append(user)
        self.stdout.write(f'    {len(users)} users with profiles')
        return users

    def _seed_departments(self, branches):
        self.stdout.write('  Seeding departments...')
        Department = self.models['Department']
        dept_data = [
            ('Service', 'SVC', ['SERVICE_MANAGER', 'SERVICE_ADVISOR', 'SERVICE_ENGINEER', 'TECHNICIAN']),
            ('Sales', 'SLS', ['SALES_MANAGER', 'SALES_EXECUTIVE', 'CRM_EXECUTIVE']),
            ('Accounts', 'ACC', ['ACCOUNTS_MANAGER', 'ACCOUNTANT']),
            ('HR', 'HRD', ['HR_MANAGER']),
            ('Inventory', 'INV', ['INVENTORY_MANAGER']),
            ('Administration', 'ADM', ['SUPER_ADMIN', 'CEO_OWNER', 'BRANCH_MANAGER']),
        ]
        depts = []
        for name, code, roles in dept_data:
            try:
                d, _ = Department.objects.get_or_create(
                    code=code, branch=branches[0],
                    defaults={'name': name, 'description': f'{name} department', 'allowed_roles': roles, 'is_active': True}
                )
                depts.append(d)
            except Exception as e:
                self.stdout.write(f'    Dept {code} skipped: {e}')
        self.stdout.write(f'    {len(depts)} departments')
        return depts

    def _seed_customers(self, branches):
        self.stdout.write('  Seeding customers...')
        Customer = self.models['Customer']
        cust_data = [
            ('Anil Kapoor', '+91 9876543210', 'anil.kapoor@email.com', 'VIP', 'Mumbai'),
            ('Sunita Reddy', '+91 9876543211', 'sunita.reddy@email.com', 'RETAIL', 'Mumbai'),
            ('Raj Transport Ltd', '+91 9876543212', 'raj.transport@email.com', 'FLEET', 'Mumbai'),
            ('Deepak Mehta', '+91 9876543213', 'deepak.mehta@email.com', 'CORPORATE', 'Delhi'),
            ('Lakshmi Iyer', '+91 9876543214', 'lakshmi.iyer@email.com', 'RETAIL', 'Bangalore'),
            ('Kumar Auto Fleet', '+91 9876543215', 'kumar.fleet@email.com', 'FLEET', 'Chennai'),
            ('Preethi Nair', '+91 9876543216', 'preethi.nair@email.com', 'WALK_IN', 'Pune'),
            ('Srinivas Rao', '+91 9876543217', 'srinivas.rao@email.com', 'RETAIL', 'Mumbai'),
            ('InfoTech Solutions Pvt Ltd', '+91 9876543218', 'infotech@email.com', 'CORPORATE', 'Bangalore'),
            ('Fatima Sheikh', '+91 9876543219', 'fatima.sheikh@email.com', 'VIP', 'Delhi'),
            ('Ganesh Logistics', '+91 9876543220', 'ganesh.logistics@email.com', 'FLEET', 'Pune'),
            ('Ramesh Pandey', '+91 9876543221', 'ramesh.pandey@email.com', 'RETAIL', 'Mumbai'),
            ('Anjali Sharma', '+91 9876543222', 'anjali.sharma@email.com', 'RETAIL', 'Delhi'),
            ('TaxiGo Services', '+91 9876543223', 'taxigo@email.com', 'FLEET', 'Chennai'),
            ('Vikrant Joshi', '+91 9876543224', 'vikrant.joshi@email.com', 'WALK_IN', 'Mumbai'),
        ]
        state_map = {'Mumbai': 'Maharashtra', 'Pune': 'Maharashtra', 'Delhi': 'Delhi', 'Bangalore': 'Karnataka', 'Chennai': 'Tamil Nadu'}
        customers = []
        for name, phone, email, cat, city in cust_data:
            c, _ = Customer.objects.get_or_create(
                email=email,
                defaults={
                    'name': name, 'phone': phone, 'customer_category': cat,
                    'city': city, 'state': state_map.get(city, ''),
                    'branch': branches[0],
                    'address': f'{random.randint(1,200)} Main Road, {city}',
                    'customer_type': 'Company' if any(x in name for x in ['Ltd', 'Services', 'Logistics', 'Fleet']) else 'Individual',
                    'credit_limit': Decimal(str(random.choice([50000, 100000, 200000, 500000]))),
                    'loyalty_points': random.randint(0, 5000),
                    'total_visits': random.randint(1, 20),
                    'total_revenue': Decimal(str(random.randint(5000, 500000))),
                    'gst_number': f'{random.randint(10,35)}ABCDE{random.randint(1000,9999)}F1Z{random.randint(1,9)}' if any(x in name for x in ['Ltd', 'Services', 'Logistics', 'Fleet']) else '',
                    'referral_source': random.choice(['Walk-in', 'Google', 'Referral', 'Social Media']),
                    'tags': [random.choice(['premium', 'fleet', 'loyal', 'new'])],
                }
            )
            customers.append(c)
        self.stdout.write(f'    {len(customers)} customers')
        return customers

    def _seed_vehicles(self, customers):
        self.stdout.write('  Seeding vehicles...')
        Vehicle = self.models['Vehicle']
        specs = [
            ('Maruti Suzuki', 'Swift', 'VXI', 'CAR', 'Petrol', 'Manual', 2022),
            ('Hyundai', 'Creta', 'SX(O)', 'CAR', 'Diesel', 'Automatic', 2023),
            ('Tata', 'Nexon EV', 'Max LR', 'CAR', 'Electric', 'Automatic', 2024),
            ('Toyota', 'Innova Crysta', 'ZX', 'CAR', 'Diesel', 'Manual', 2021),
            ('Honda', 'City', 'V CVT', 'CAR', 'Petrol', 'Automatic', 2023),
            ('Mahindra', 'XUV700', 'AX7 L', 'CAR', 'Diesel', 'Automatic', 2024),
            ('Kia', 'Seltos', 'HTX+', 'CAR', 'Petrol', 'Automatic', 2022),
            ('Royal Enfield', 'Classic 350', 'Signals', 'BIKE', 'Petrol', 'Manual', 2023),
            ('Bajaj', 'Pulsar NS200', 'ABS', 'BIKE', 'Petrol', 'Manual', 2024),
            ('TVS', 'Apache RTR 200', '4V', 'BIKE', 'Petrol', 'Manual', 2023),
            ('Tata', 'Ace Gold', 'Diesel', 'TRUCK', 'Diesel', 'Manual', 2022),
            ('Mahindra', 'Bolero Pickup', 'Extra Long', 'TRUCK', 'Diesel', 'Manual', 2021),
            ('Maruti Suzuki', 'Dzire', 'ZXI+', 'CAR', 'Petrol', 'Automatic', 2024),
            ('Hyundai', 'i20', 'Asta', 'CAR', 'Petrol', 'Manual', 2023),
            ('Skoda', 'Kushaq', 'Style 1.0', 'CAR', 'Petrol', 'Automatic', 2023),
            ('Volkswagen', 'Taigun', 'GT Plus', 'CAR', 'Petrol', 'Automatic', 2024),
            ('Honda', 'Activa 6G', 'DLX', 'BIKE', 'Petrol', 'Automatic', 2024),
            ('Tata', 'Punch', 'Creative', 'CAR', 'Petrol', 'Manual', 2024),
            ('MG', 'Hector', 'Sharp', 'CAR', 'Diesel', 'Automatic', 2023),
            ('Jeep', 'Compass', 'Limited', 'CAR', 'Diesel', 'Automatic', 2022),
        ]
        colors = ['White', 'Silver', 'Black', 'Red', 'Blue', 'Grey']
        st_codes = ['MH', 'DL', 'KA', 'TN', 'GJ']
        vehicles = []
        for i, (make, model, variant, vtype, fuel, trans, year) in enumerate(specs):
            cust = customers[i % len(customers)]
            vin = f'IN{make[:3].upper()}{uuid.uuid4().hex[:12].upper()}'
            plate = f'{random.choice(st_codes)}-{random.randint(1,50):02d}-{chr(random.randint(65,90))}{chr(random.randint(65,90))}-{random.randint(1000,9999)}'
            v, _ = Vehicle.objects.get_or_create(
                vin=vin,
                defaults={
                    'customer': cust, 'make': make, 'model': model, 'variant': variant,
                    'year': year, 'color': random.choice(colors), 'fuel_type': fuel,
                    'transmission': trans, 'vehicle_type': vtype, 'plate_number': plate,
                    'engine_number': f'ENG{uuid.uuid4().hex[:10].upper()}',
                    'current_odometer': random.randint(1000, 80000),
                    'insurance_expiry': date.today() + timedelta(days=random.randint(-30, 365)),
                    'puc_expiry': date.today() + timedelta(days=random.randint(-15, 180)),
                }
            )
            vehicles.append(v)
        self.stdout.write(f'    {len(vehicles)} vehicles')
        return vehicles

    def _seed_bays(self, branches):
        self.stdout.write('  Seeding service bays...')
        Bay = self.models['Bay']
        count = 0
        types = ['General Service', 'Quick Service', 'Body Shop', 'Electrical']
        for branch in branches[:3]:
            for i, bt in enumerate(types, 1):
                try:
                    Bay.objects.get_or_create(branch=branch, bay_number=f'B{i}', defaults={'bay_type': bt, 'is_available': True})
                    count += 1
                except Exception:
                    pass
        self.stdout.write(f'    {count} bays')

    def _seed_suppliers(self):
        self.stdout.write('  Seeding suppliers...')
        Supplier = self.models['Supplier']
        data = [
            ('Bosch Auto Parts India', 'Bosch Sales Desk', 'Mumbai', 'bosch@suppliers.com', '+91 22 3333 0001', '27AABCB1234F1Z5'),
            ('Mahindra Genuine Parts', 'Mahindra Sales', 'Pune', 'mahindra@suppliers.com', '+91 20 4444 0001', '27AABCM5678G1Z3'),
            ('Tata Motors Spares', 'Tata Parts Desk', 'Mumbai', 'tata.spares@suppliers.com', '+91 22 5555 0001', '27AABCT9012H1Z1'),
            ('Castrol India Ltd', 'Castrol Business', 'Mumbai', 'castrol@suppliers.com', '+91 22 6666 0001', '27AABCC3456I1Z9'),
            ('3M Auto Care Products', '3M Sales', 'Bangalore', '3m.auto@suppliers.com', '+91 80 7777 0001', '29AABCM7890J1Z7'),
            ('Denso India Pvt Ltd', 'Denso India', 'Gurgaon', 'denso@suppliers.com', '+91 12 8888 0001', '06AABCD1234K1Z5'),
            ('Exide Industries Ltd', 'Exide Sales', 'Kolkata', 'exide@suppliers.com', '+91 33 9999 0001', '19AABCE5678L1Z3'),
            ('CEAT Tyres Ltd', 'CEAT Business', 'Mumbai', 'ceat@suppliers.com', '+91 22 1111 0002', '27AABCC9012M1Z1'),
            ('Shell Lubricants India', 'Shell Sales', 'Mumbai', 'shell.india@suppliers.com', '+91 22 2222 0003', '27AABCS3456N1Z9'),
            ('Wuerth India Pvt Ltd', 'Wuerth Sales', 'Chennai', 'wuerth@suppliers.com', '+91 44 3333 0002', '33AABCW7890O1Z7'),
            ('Minda Industries Ltd', 'Minda Sales', 'Noida', 'minda@suppliers.com', '+91 12 4444 0002', '09AABCM1234P1Z5'),
            ('Valeo India Pvt Ltd', 'Valeo Sales', 'Chennai', 'valeo@suppliers.com', '+91 44 5555 0002', '33AABCV5678Q1Z3'),
        ]
        suppliers = []
        for name, contact, city, email, phone, gst in data:
            s, _ = Supplier.objects.get_or_create(
                email=email,
                defaults={
                    'name': name, 'contact_person': contact, 'phone': phone,
                    'city': city, 'state': city, 'address': f'{random.randint(1,500)} Industrial Area, {city}',
                    'gst_number': gst, 'payment_terms': random.choice(['Net 30', 'Net 45', 'Net 60']),
                    'rating': Decimal(str(round(random.uniform(3.5, 5.0), 1))), 'is_active': True,
                }
            )
            suppliers.append(s)
        self.stdout.write(f'    {len(suppliers)} suppliers')
        return suppliers

    def _seed_parts(self, branches, suppliers):
        self.stdout.write('  Seeding parts/inventory...')
        Part = self.models['Part']
        ItemType = self.enums['ItemType']
        TaxCategory = self.enums['TaxCategory']
        data = [
            ('Engine Oil 5W-30 (1L)', 'OIL-5W30-1L', 'Lubricants', 'Castrol', 320, 550, 18, ItemType.CONSUMABLE),
            ('Engine Oil 5W-40 (4L)', 'OIL-5W40-4L', 'Lubricants', 'Shell', 1100, 1800, 18, ItemType.CONSUMABLE),
            ('Oil Filter - Universal', 'FLT-OIL-UNI', 'Filters', 'Bosch', 180, 350, 18, ItemType.SPARE_PART),
            ('Air Filter - Maruti', 'FLT-AIR-MSZ', 'Filters', 'Bosch', 250, 480, 18, ItemType.SPARE_PART),
            ('Brake Pad Set - Front', 'BRK-PAD-FRT', 'Brakes', 'Bosch', 900, 1650, 18, ItemType.SPARE_PART),
            ('Brake Pad Set - Rear', 'BRK-PAD-RR', 'Brakes', 'Bosch', 750, 1400, 18, ItemType.SPARE_PART),
            ('Brake Disc - Front', 'BRK-DSC-FRT', 'Brakes', 'Brembo', 2200, 3800, 18, ItemType.SPARE_PART),
            ('Spark Plug - Iridium', 'SPK-IRD-001', 'Engine', 'Denso', 350, 650, 18, ItemType.SPARE_PART),
            ('Battery 65Ah', 'BAT-65AH', 'Electrical', 'Exide', 4500, 6800, 28, ItemType.SPARE_PART),
            ('Tyre 185/65 R15', 'TYR-185-R15', 'Tyres', 'CEAT', 3200, 4900, 28, ItemType.SPARE_PART),
            ('Tyre 205/55 R16', 'TYR-205-R16', 'Tyres', 'CEAT', 4100, 6200, 28, ItemType.SPARE_PART),
            ('AC Compressor Clutch', 'AC-COMP-CLT', 'AC System', 'Denso', 3500, 5800, 18, ItemType.SPARE_PART),
            ('Cabin Air Filter', 'FLT-CAB-AIR', 'Filters', 'Bosch', 280, 550, 18, ItemType.SPARE_PART),
            ('Coolant 1L', 'CLT-1L', 'Coolant', 'Castrol', 180, 320, 18, ItemType.CONSUMABLE),
            ('Wiper Blade 20"', 'WPR-BLD-20', 'Wipers', 'Bosch', 350, 600, 18, ItemType.SPARE_PART),
            ('Headlight Bulb H4', 'BLB-H4-STD', 'Electrical', 'Osram', 220, 420, 18, ItemType.SPARE_PART),
            ('Clutch Plate Set', 'CLT-PLT-SET', 'Clutch', 'Valeo', 3800, 6200, 18, ItemType.SPARE_PART),
            ('Timing Belt Kit', 'TMG-BLT-KIT', 'Engine', 'Gates', 2800, 4500, 18, ItemType.SPARE_PART),
            ('Power Steering Fluid', 'PS-FLD-500', 'Steering', 'Shell', 280, 450, 18, ItemType.CONSUMABLE),
            ('Car Wash Shampoo 5L', 'WSH-SHP-5L', 'Detailing', 'Wuerth', 320, 580, 18, ItemType.CONSUMABLE),
        ]
        parts = []
        for name, sku, cat, brand, cost, sell, tax, itype in data:
            p, _ = Part.objects.get_or_create(
                sku=sku,
                defaults={
                    'name': name, 'category': cat, 'brand': brand, 'item_type': itype,
                    'branch': branches[0], 'cost_price': Decimal(str(cost)),
                    'selling_price': Decimal(str(sell)), 'tax_rate': Decimal(str(tax)),
                    'tax_category': TaxCategory.GST_18 if tax == 18 else TaxCategory.GST_28,
                    'stock': random.randint(15, 100), 'min_stock': 5, 'max_stock': 150,
                    'reorder_quantity': 20,
                    'location': f'Rack {random.choice("ABCDEF")}{random.randint(1,5)}',
                    'rack_number': f'R{random.randint(1,20)}', 'bin_number': f'B{random.randint(1,50)}',
                    'hsn_code': f'{random.randint(3900,8800)}',
                    'primary_supplier': random.choice(suppliers) if suppliers else None,
                    'is_active': True, 'is_oem': random.choice([True, False]),
                    'unit': 'Nos' if itype == ItemType.SPARE_PART else 'Ltr',
                }
            )
            parts.append(p)
        self.stdout.write(f'    {len(parts)} parts')
        return parts

    def _seed_leads(self, branches, users):
        self.stdout.write('  Seeding CRM leads...')
        Lead = self.models['Lead']
        crm_user = users[18] if len(users) > 18 else users[0]
        data = [
            ('Ashok Kumar', '+91 8888000001', 'WALK_IN', 'NEW', 'Maruti Suzuki', 'Alto K10', 'General Service'),
            ('Priyanka Das', '+91 8888000002', 'WEBSITE', 'CONTACTED', 'Honda', 'Amaze', 'Engine Overhaul'),
            ('Mohammad Ali', '+91 8888000003', 'REFERRAL', 'QUALIFIED', 'Hyundai', 'Venue', 'AC Repair'),
            ('Sneha Kapoor', '+91 8888000004', 'SOCIAL_MEDIA', 'QUOTED', 'Kia', 'Sonet', 'Body Painting'),
            ('Ravi Teja', '+91 8888000005', 'MOBILE_APP', 'NEGOTIATION', 'Toyota', 'Fortuner', 'Full Service'),
            ('Meenakshi S', '+91 8888000006', 'WHATSAPP', 'NEW', 'Tata', 'Harrier', 'Brake Service'),
            ('Naveen Jain', '+91 8888000007', 'COLD_CALL', 'CONTACTED', None, None, 'Fleet Management'),
            ('Suman Devi', '+91 8888000008', 'ADVERTISEMENT', 'QUALIFIED', 'MG', 'Astor', 'Periodic Service'),
            ('Arjun Reddy', '+91 8888000009', 'REFERRAL', 'NEW', 'Mahindra', 'Thar', 'Suspension Work'),
            ('Kavita Mishra', '+91 8888000010', 'CAMPAIGN', 'QUOTED', 'Volkswagen', 'Virtus', 'Insurance Claim'),
            ('Vikas Agarwal', '+91 8888000011', 'WALK_IN', 'CUSTOMER', 'Skoda', 'Slavia', 'General Service'),
            ('Farheen Bano', '+91 8888000012', 'WEBSITE', 'LOST', 'Jeep', 'Meridian', 'Wheel Alignment'),
            ('Deepika Rao', '+91 8888000013', 'SOCIAL_MEDIA', 'NEGOTIATION', 'Toyota', 'Glanza', 'AC Service'),
            ('Raghav Pandey', '+91 8888000014', 'MOBILE_APP', 'NEW', 'Tata', 'Tiago', 'General Service'),
            ('Shalini Verma', '+91 8888000015', 'FLEET_INQUIRY', 'QUALIFIED', None, None, 'Fleet AMC'),
        ]
        leads = []
        for name, phone, source, status, make, model, interest in data:
            l, _ = Lead.objects.get_or_create(
                phone=phone,
                defaults={
                    'name': name, 'email': f'{name.lower().replace(" ", ".")}@email.com',
                    'source': source, 'status': status, 'branch': branches[0],
                    'vehicle_make': make, 'vehicle_model': model, 'service_interest': interest,
                    'expected_value': Decimal(str(random.randint(2000, 50000))),
                    'priority': random.choice(['Low', 'Medium', 'High']),
                    'owner': crm_user, 'assigned_to': crm_user,
                    'city': random.choice(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Pune']),
                    'contact_attempts': random.randint(0, 5),
                    'notes': f'Lead interested in {interest}',
                    'next_follow_up': timezone.now() + timedelta(days=random.randint(1, 14)),
                }
            )
            leads.append(l)
        self.stdout.write(f'    {len(leads)} leads')
        return leads

    def _seed_appointments(self, customers, vehicles, branches, users):
        self.stdout.write('  Seeding appointments...')
        Appointment = self.models['Appointment']
        Vehicle = self.models['Vehicle']
        services = ['General Service', 'Oil Change', 'Brake Service', 'AC Repair', 'Wheel Alignment', 'Full Service', 'Body Repair', 'Engine Tune-up', 'Tyre Replacement', 'Electrical Check']
        statuses = ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED']
        sa = users[8] if len(users) > 8 else users[0]
        count = 0
        for i in range(15):
            cust = customers[i % len(customers)]
            vehs = Vehicle.objects.filter(customer=cust)
            veh = vehs.first() if vehs.exists() else vehicles[i % len(vehicles)]
            apt_date = date.today() + timedelta(days=random.randint(-10, 30))
            try:
                Appointment.objects.get_or_create(
                    customer=cust, vehicle=veh, appointment_date=apt_date,
                    defaults={
                        'branch': branches[i % len(branches)], 'service_advisor': sa,
                        'appointment_time': time(hour=random.randint(8, 16), minute=random.choice([0, 15, 30, 45])),
                        'service_type': services[i % len(services)],
                        'complaint': f'Customer requests {services[i % len(services)]}',
                        'status': statuses[i % len(statuses)],
                        'estimated_duration': Decimal(str(random.choice([1, 1.5, 2, 3, 4]))),
                    }
                )
                count += 1
            except Exception:
                pass
        self.stdout.write(f'    {count} appointments')

    def _seed_job_cards(self, customers, vehicles, branches, users):
        self.stdout.write('  Seeding job cards...')
        JobCard = self.models['JobCard']
        ServiceEvent = self.models['ServiceEvent']
        ServiceEventType = self.enums['ServiceEventType']
        WorkflowStage = self.enums['WorkflowStage']
        Vehicle = self.models['Vehicle']

        stages = [
            WorkflowStage.APPOINTMENT, WorkflowStage.CHECK_IN, WorkflowStage.INSPECTION,
            WorkflowStage.JOB_CARD, WorkflowStage.ESTIMATE, WorkflowStage.APPROVAL,
            WorkflowStage.EXECUTION, WorkflowStage.QC, WorkflowStage.BILLING,
            WorkflowStage.DELIVERY, WorkflowStage.COMPLETED,
        ]
        job_types = ['General Service', 'Oil Change', 'Brake Repair', 'AC Service', 'Body Work', 'Engine Overhaul', 'Suspension', 'Electrical', 'Tyre Service', 'Full Service']
        priorities = ['Low', 'Normal', 'High', 'Urgent']
        sa = users[8] if len(users) > 8 else users[0]
        tech = users[15] if len(users) > 15 else users[0]
        job_cards = []
        for i in range(15):
            cust = customers[i % len(customers)]
            vehs = Vehicle.objects.filter(customer=cust)
            veh = vehs.first() if vehs.exists() else vehicles[i % len(vehicles)]
            stage = stages[i % len(stages)]
            est_amt = Decimal(str(random.randint(2000, 50000)))
            try:
                jc, created = JobCard.objects.get_or_create(
                    vehicle=veh, customer=cust, workflow_stage=stage,
                    defaults={
                        'branch': branches[0], 'service_advisor': sa, 'lead_technician': tech,
                        'job_type': job_types[i % len(job_types)],
                        'priority': priorities[i % len(priorities)],
                        'complaint': f'Customer complaint: {job_types[i % len(job_types)]} required',
                        'diagnosis': f'Diagnosis: {job_types[i % len(job_types)]} needed after inspection' if i > 2 else '',
                        'odometer_in': random.randint(5000, 80000),
                        'fuel_level_in': random.choice(['Full', '3/4', '1/2', '1/4']),
                        'estimated_hours': Decimal(str(random.choice([1, 2, 3, 4, 6, 8]))),
                        'estimated_amount': est_amt,
                        'labor_amount': est_amt * Decimal('0.4'),
                        'parts_amount': est_amt * Decimal('0.5'),
                        'tax_amount': est_amt * Decimal('0.18'),
                        'created_by': sa,
                        'promised_delivery': timezone.now() + timedelta(days=random.randint(1, 5)),
                    }
                )
                if created:
                    ServiceEvent.objects.create(
                        job_card=jc, event_type=ServiceEventType.WORKFLOW_TRANSITION,
                        actor=sa, old_value='', new_value=stage,
                        comment=f'Job card created at stage {stage}'
                    )
                job_cards.append(jc)
            except Exception as e:
                self.stdout.write(f'    JobCard {i} skipped: {e}')
        self.stdout.write(f'    {len(job_cards)} job cards')
        return job_cards

    def _seed_tasks(self, job_cards, users):
        self.stdout.write('  Seeding service tasks...')
        Task = self.models['Task']
        TaskStatus = self.enums['TaskStatus']
        tech_users = [u for u in users if hasattr(u, 'profile') and u.profile.role in ['TECHNICIAN', 'SERVICE_ENGINEER']]
        if not tech_users:
            tech_users = users[:2]
        descs = [
            ('Oil & Filter Change', 'Lubrication', 1.0, 400),
            ('Brake Inspection & Service', 'Brakes', 1.5, 600),
            ('AC Gas Recharge', 'AC System', 2.0, 800),
            ('Wheel Alignment', 'Suspension', 1.0, 500),
            ('Engine Diagnostics', 'Engine', 2.0, 1000),
            ('Battery Check & Replace', 'Electrical', 0.5, 300),
            ('Tyre Rotation & Balance', 'Tyres', 1.0, 400),
            ('Coolant Flush', 'Cooling', 1.0, 500),
            ('Spark Plug Replacement', 'Engine', 1.0, 500),
            ('Wiper Replacement', 'Exterior', 0.5, 200),
        ]
        count = 0
        for jc in job_cards:
            for j in range(random.randint(1, 3)):
                d = descs[(count + j) % len(descs)]
                status = random.choice([TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED])
                try:
                    Task.objects.create(
                        job_card=jc, description=d[0], category=d[1],
                        assigned_technician=random.choice(tech_users),
                        status=status, priority=random.choice(['Low', 'Normal', 'High']),
                        estimated_hours=Decimal(str(d[2])),
                        actual_hours=Decimal(str(round(d[2] * random.uniform(0.8, 1.3), 2))) if status == TaskStatus.COMPLETED else Decimal('0'),
                        labor_rate=Decimal(str(d[3])), labor_cost=Decimal(str(d[3] * d[2])),
                    )
                    count += 1
                except Exception:
                    pass
        self.stdout.write(f'    {count} tasks')

    def _seed_inspections(self, job_cards, users):
        self.stdout.write('  Seeding digital inspections...')
        DI = self.models['DigitalInspection']
        count = 0
        for jc in job_cards[:10]:
            try:
                DI.objects.get_or_create(
                    job_card=jc,
                    defaults={
                        'inspector': users[10] if len(users) > 10 else users[0],
                        'checklist_data': {
                            'engine': {'status': random.choice(['Good', 'Fair', 'Needs Attention'])},
                            'brakes': {'status': random.choice(['Good', 'Fair', 'Needs Attention'])},
                            'tyres': {'status': random.choice(['Good', 'Fair', 'Needs Attention'])},
                            'lights': {'status': random.choice(['Good', 'Fair', 'Needs Attention'])},
                            'suspension': {'status': random.choice(['Good', 'Fair', 'Needs Attention'])},
                        },
                        'findings': 'Inspection completed. Minor wear observed.',
                        'recommendations': 'Recommend brake pad replacement within 5000km.',
                        'is_completed': True,
                    }
                )
                count += 1
            except Exception:
                pass
        self.stdout.write(f'    {count} inspections')

    def _seed_estimates(self, job_cards, parts, users):
        self.stdout.write('  Seeding estimates...')
        Estimate = self.models['Estimate']
        EstimateLine = self.models['EstimateLine']
        sa = users[8] if len(users) > 8 else users[0]
        count = 0
        for jc in job_cards[:10]:
            try:
                est, created = Estimate.objects.get_or_create(
                    job_card=jc, version=1,
                    defaults={
                        'labor_total': Decimal(str(random.randint(1000, 8000))),
                        'parts_total': Decimal(str(random.randint(500, 12000))),
                        'discount': Decimal(str(random.randint(0, 500))),
                        'tax': Decimal(str(random.randint(200, 3000))),
                        'grand_total': Decimal(str(random.randint(2000, 25000))),
                        'approval_status': random.choice(['PENDING', 'APPROVED']),
                        'created_by': sa, 'is_current': True,
                    }
                )
                if created:
                    for _ in range(random.randint(2, 4)):
                        part = random.choice(parts)
                        qty = random.randint(1, 4)
                        EstimateLine.objects.create(
                            estimate=est, line_type=random.choice(['LABOR', 'PART']),
                            description=part.name, part=part, quantity=qty,
                            unit_price=part.selling_price, total=part.selling_price * qty,
                        )
                count += 1
            except Exception:
                pass
        self.stdout.write(f'    {count} estimates')

    def _seed_invoices(self, job_cards, users, customers, branches):
        self.stdout.write('  Seeding invoices...')
        Invoice = self.models['Invoice']
        WorkflowStage = self.enums['WorkflowStage']
        sa = users[8] if len(users) > 8 else users[0]
        billing_jcs = [jc for jc in job_cards if jc.workflow_stage in [WorkflowStage.BILLING, WorkflowStage.DELIVERY, WorkflowStage.COMPLETED]]
        invoices = []
        for jc in billing_jcs:
            labor = Decimal(str(random.randint(1000, 10000)))
            parts_t = Decimal(str(random.randint(1000, 15000)))
            sub = labor + parts_t
            tax = sub * Decimal('0.18')
            total = sub + tax
            try:
                inv, _ = Invoice.objects.get_or_create(
                    job_card=jc,
                    defaults={
                        'customer': jc.customer, 'branch': branches[0],
                        'labor_total': labor, 'parts_total': parts_t,
                        'subtotal': sub, 'tax': tax, 'grand_total': total,
                        'payment_status': random.choice(['PENDING', 'PAID', 'PARTIAL']),
                        'created_by': sa,
                        'invoice_date': date.today() - timedelta(days=random.randint(0, 15)),
                        'due_date': date.today() + timedelta(days=random.randint(15, 45)),
                    }
                )
                invoices.append(inv)
            except Exception:
                pass
        self.stdout.write(f'    {len(invoices)} invoices')
        return invoices

    def _seed_payments(self, invoices):
        self.stdout.write('  Seeding payments...')
        Payment = self.models['Payment']
        count = 0
        for inv in invoices:
            try:
                Payment.objects.get_or_create(
                    invoice=inv,
                    defaults={
                        'amount': inv.grand_total if random.random() > 0.3 else inv.grand_total * Decimal('0.5'),
                        'payment_method': random.choice(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE']),
                        'payment_date': timezone.now() - timedelta(days=random.randint(0, 15)),
                        'reference_number': f'PAY-{uuid.uuid4().hex[:8].upper()}',
                    }
                )
                count += 1
            except Exception:
                pass
        self.stdout.write(f'    {count} payments')

    def _seed_contracts(self, customers, vehicles, branches, users):
        self.stdout.write('  Seeding contracts...')
        Contract = self.models['Contract']
        Vehicle = self.models['Vehicle']
        ContractType = self.enums['ContractType']
        ContractStatus = self.enums['ContractStatus']
        BillingModel = self.enums['BillingModel']
        types = [ContractType.AMC, ContractType.WARRANTY, ContractType.INSURANCE, ContractType.SERVICE_PACKAGE]
        statuses = [ContractStatus.ACTIVE, ContractStatus.ACTIVE, ContractStatus.DRAFT, ContractStatus.EXPIRED, ContractStatus.PENDING_APPROVAL]
        sa = users[8] if len(users) > 8 else users[0]
        contracts = []
        for i in range(12):
            cust = customers[i % len(customers)]
            vehs = Vehicle.objects.filter(customer=cust)
            veh = vehs.first() if vehs.exists() else vehicles[i % len(vehicles)]
            start = date.today() - timedelta(days=random.randint(0, 180))
            try:
                c, _ = Contract.objects.get_or_create(
                    customer=cust, contract_type=types[i % len(types)], vehicle=veh,
                    defaults={
                        'branch': branches[0], 'status': statuses[i % len(statuses)],
                        'start_date': start, 'end_date': start + timedelta(days=365),
                        'coverage_period_months': 12,
                        'contract_value': Decimal(str(random.choice([15000, 25000, 40000, 60000, 100000]))),
                        'billing_model': random.choice([BillingModel.ONE_TIME, BillingModel.MONTHLY, BillingModel.QUARTERLY]),
                        'max_services': random.choice([4, 6, 12, None]),
                        'services_used': random.randint(0, 3),
                        'coverage_km_limit': random.choice([10000, 20000, 50000, None]),
                        'labor_coverage_percent': Decimal(str(random.choice([80, 100]))),
                        'services_included': ['Oil Change', 'General Service', 'Brake Service'],
                        'created_by': sa,
                        'provider': random.choice(['AutoServ Direct', 'Partner Network', 'OEM Warranty']),
                    }
                )
                contracts.append(c)
            except Exception:
                pass
        self.stdout.write(f'    {len(contracts)} contracts')

    def _seed_purchase_orders(self, suppliers, branches, parts, users):
        self.stdout.write('  Seeding purchase orders...')
        PO = self.models['PurchaseOrder']
        POL = self.models['PurchaseOrderLine']
        POStatus = self.enums['PurchaseOrderStatus']
        inv_user = users[13] if len(users) > 13 else users[0]
        pos = []
        for i in range(12):
            sup = suppliers[i % len(suppliers)]
            status = random.choice([POStatus.DRAFT, POStatus.APPROVED, POStatus.ORDERED, POStatus.RECEIVED])
            try:
                total = Decimal(str(random.randint(5000, 100000)))
                po, created = PO.objects.get_or_create(
                    supplier=sup, branch=branches[0], status=status,
                    defaults={
                        'subtotal': total, 'tax': total * Decimal('0.18'),
                        'grand_total': total * Decimal('1.18'),
                        'expected_delivery': date.today() + timedelta(days=random.randint(3, 30)),
                        'created_by': inv_user, 'notes': f'Regular replenishment order #{i+1}',
                    }
                )
                if created:
                    for _ in range(random.randint(2, 4)):
                        part = random.choice(parts)
                        qty = random.randint(5, 30)
                        POL.objects.create(
                            purchase_order=po, part=part,
                            quantity_ordered=qty, unit_price=part.cost_price,
                            total=part.cost_price * qty,
                        )
                pos.append(po)
            except Exception:
                pass
        self.stdout.write(f'    {len(pos)} purchase orders')

    def _seed_crm_interactions(self, customers, leads, branches, users):
        self.stdout.write('  Seeding CRM interactions...')
        CI = self.models['CustomerInteraction']
        IT = self.enums['InteractionType']
        IO = self.enums['InteractionOutcome']
        CC = self.enums['CommunicationChannel']
        crm = users[18] if len(users) > 18 else users[0]
        itypes = [IT.CALL_OUTBOUND, IT.EMAIL_SENT, IT.WHATSAPP_SENT, IT.WALK_IN, IT.FOLLOW_UP, IT.FEEDBACK]
        outcomes = [IO.SUCCESSFUL, IO.CALLBACK_REQUESTED, IO.SCHEDULED, IO.RESOLVED]
        count = 0
        for i in range(20):
            cust = customers[i % len(customers)] if i < len(customers) else None
            lead = leads[i % len(leads)] if i >= len(customers) and leads else None
            try:
                CI.objects.create(
                    customer=cust, lead=lead, branch=branches[0],
                    interaction_type=random.choice(itypes),
                    channel=random.choice([CC.PHONE, CC.EMAIL, CC.WHATSAPP]),
                    subject=f'Follow-up #{i+1} - Service inquiry',
                    description=f'Discussed service requirements. Customer is {random.choice(["interested", "considering", "ready to book"])}.',
                    outcome=random.choice(outcomes),
                    handled_by=crm, duration_minutes=random.randint(5, 30),
                )
                count += 1
            except Exception:
                pass
        self.stdout.write(f'    {count} interactions')

    def _seed_tickets(self, customers, branches, users):
        self.stdout.write('  Seeding support tickets...')
        Ticket = self.models['Ticket']
        crm = users[18] if len(users) > 18 else users[0]
        subjects = [
            'Service delay beyond promised time', 'Billing discrepancy noticed',
            'Request for service history report', 'AC not cooling after repair',
            'Engine noise persists after service', 'Spare part quality concern',
            'Request for pickup/drop service', 'Insurance claim assistance needed',
            'Feedback on recent service experience', 'Request for AMC renewal',
            'Warranty claim for battery', 'Vibration at high speed after service',
        ]
        count = 0
        ticket_types = ['COMPLAINT', 'INQUIRY', 'SERVICE_REQUEST', 'FEEDBACK', 'WARRANTY_CLAIM']
        statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED']
        prios = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        for i in range(12):
            try:
                Ticket.objects.create(
                    customer=customers[i % len(customers)], branch=branches[0],
                    ticket_type=ticket_types[i % len(ticket_types)],
                    status=statuses[i % len(statuses)],
                    priority=prios[i % len(prios)],
                    subject=subjects[i], description=f'Detailed: {subjects[i]}',
                    assigned_to=crm, raised_by=crm,
                    sla_response_hours=random.choice([2, 4, 8, 24]),
                    sla_resolution_hours=random.choice([24, 48, 72]),
                )
                count += 1
            except Exception:
                pass
        self.stdout.write(f'    {count} tickets')

    def _seed_follow_up_tasks(self, customers, leads, branches, users):
        self.stdout.write('  Seeding follow-up tasks...')
        FUT = self.models['FollowUpTask']
        crm = users[18] if len(users) > 18 else users[0]
        types = ['CALL', 'EMAIL', 'VISIT', 'WHATSAPP', 'MEETING']
        count = 0
        for i in range(15):
            cust = customers[i % len(customers)] if i < len(customers) else None
            lead = leads[i % len(leads)] if i >= len(customers) and leads else None
            try:
                FUT.objects.create(
                    customer=cust, lead=lead, branch=branches[0],
                    follow_up_type=types[i % len(types)],
                    status=random.choice(['PENDING', 'COMPLETED', 'OVERDUE']),
                    priority=random.choice(['Low', 'Medium', 'High']),
                    subject=f'Follow-up: {random.choice(["Service reminder", "Quote discussion", "Feedback", "AMC renewal", "Payment reminder"])}',
                    description='Scheduled follow-up as per CRM process.',
                    due_date=timezone.now() + timedelta(days=random.randint(-5, 14)),
                    assigned_to=crm, created_by=crm,
                )
                count += 1
            except Exception:
                pass
        self.stdout.write(f'    {count} follow-up tasks')

    def _seed_campaigns(self, branches, users):
        self.stdout.write('  Seeding campaigns...')
        Campaign = self.models['Campaign']
        CommunicationChannel = self.enums['CommunicationChannel']
        data = [
            ('Monsoon Service Camp', 'SERVICE', 'Drive safe this monsoon'),
            ('Summer AC Check Special', 'SERVICE', 'Beat the heat with AC service'),
            ('Festival Season Offers', 'PROMOTIONAL', 'Special festive discounts'),
            ('Fleet Management Outreach', 'OUTREACH', 'Fleet maintenance packages'),
            ('New Customer Welcome', 'RETENTION', 'First service at 30% off'),
            ('Loyalty Rewards', 'RETENTION', 'Double loyalty points'),
            ('Annual Maintenance Campaign', 'SERVICE', 'Schedule annual maintenance'),
            ('Referral Bonus Program', 'REFERRAL', 'Refer and earn credits'),
            ('Insurance Renewal Drive', 'OUTREACH', 'Hassle-free insurance renewal'),
            ('EV Service Launch', 'PROMOTIONAL', 'Specialized EV service'),
        ]
        sm = users[5] if len(users) > 5 else users[0]
        count = 0
        for name, ctype, desc in data:
            try:
                start = date.today() - timedelta(days=random.randint(0, 60))
                Campaign.objects.create(
                    name=name, campaign_type=ctype, branch=branches[0],
                    channel=random.choice([CommunicationChannel.EMAIL, CommunicationChannel.SMS, CommunicationChannel.WHATSAPP]),
                    subject=name, message_template=desc,
                    status=random.choice(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED']),
                    valid_from=start, valid_until=start + timedelta(days=random.randint(30, 90)),
                    cost=Decimal(str(random.randint(10000, 100000))),
                    target_segment=random.choice(['All Customers', 'Fleet', 'VIP', 'New', 'Inactive']),
                    created_by=sm,
                )
                count += 1
            except Exception:
                pass
        self.stdout.write(f'    {count} campaigns')

    def _seed_notifications(self, users):
        self.stdout.write('  Seeding notifications...')
        Notification = self.models['Notification']
        data = [
            ('Service Reminder', 'Your vehicle is due for service.', 'SERVICE_REMINDER'),
            ('Appointment Confirmed', 'Your appointment is confirmed.', 'APPOINTMENT'),
            ('Job Card Created', 'New job card created for your vehicle.', 'JOB_CARD'),
            ('Estimate Ready', 'Your service estimate is ready.', 'ESTIMATE'),
            ('Service Complete', 'Your vehicle service is done.', 'SERVICE'),
            ('Payment Received', 'Payment successfully received.', 'PAYMENT'),
            ('Invoice Generated', 'Your invoice has been generated.', 'INVOICE'),
            ('Low Stock Alert', 'Oil Filter stock below minimum.', 'INVENTORY'),
            ('SLA Breach Warning', 'Job card approaching SLA deadline.', 'SLA'),
            ('Contract Expiring', 'AMC contract expiring in 30 days.', 'CONTRACT'),
        ]
        count = 0
        for title, msg, ntype in data:
            try:
                Notification.objects.create(
                    recipient=random.choice(users), title=title, message=msg,
                    notification_type=ntype, is_read=random.choice([True, False]),
                )
                count += 1
            except Exception:
                pass
        self.stdout.write(f'    {count} notifications')

    def _seed_skills(self):
        self.stdout.write('  Seeding HRMS skills...')
        Skill = self.models['Skill']
        SC = self.enums['SkillCategory']
        data = [
            ('Engine Diagnostics', 'ENG-DIAG', SC.DIAGNOSTICS),
            ('Brake System Repair', 'BRK-RPR', SC.MECHANICAL),
            ('AC System Service', 'AC-SVC', SC.ELECTRICAL),
            ('Electrical Systems', 'ELEC-SYS', SC.ELECTRICAL),
            ('Wheel Alignment', 'WHL-ALN', SC.MECHANICAL),
            ('Body Painting', 'BDY-PNT', SC.BODY_PAINT),
            ('Hybrid/EV Technology', 'HYB-EV', SC.EV_HYBRID),
            ('General Service', 'GEN-SVC', SC.GENERAL),
            ('Electronics Diagnostics', 'ELEC-DGN', SC.ELECTRONICS),
            ('Suspension Repair', 'SUSP-RPR', SC.MECHANICAL),
            ('OBD-II Scanner Operation', 'OBD-SCN', SC.DIAGNOSTICS),
            ('Transmission Repair', 'TRANS-RPR', SC.MECHANICAL),
        ]
        skills = []
        for name, code, cat in data:
            s, _ = Skill.objects.get_or_create(skill_id=code, defaults={'name': name, 'category': cat, 'is_active': True, 'description': f'Skill: {name}'})
            skills.append(s)
        self.stdout.write(f'    {len(skills)} skills')
        return skills

    def _seed_employees(self, users):
        self.stdout.write('  Seeding HRMS employees...')
        Employee = self.models['Employee']
        ET = self.enums['EmploymentType']
        employees = []
        for user in users:
            try:
                profile = user.profile
                emp, _ = Employee.objects.get_or_create(
                    profile=profile,
                    defaults={
                        'employment_type': random.choice([ET.PERMANENT, ET.PERMANENT, ET.CONTRACT]),
                        'department': 'Service', 'designation': profile.role.replace('_', ' ').title(),
                        'joining_date': date.today() - timedelta(days=random.randint(90, 1800)),
                        'basic_salary': Decimal(str(random.choice([25000, 35000, 45000, 60000, 80000, 100000]))),
                        'bank_name': random.choice(['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank']),
                        'bank_account_number': f'{random.randint(10000000000, 99999999999)}',
                        'bank_ifsc': f'SBIN00{random.randint(10000, 99999)}',
                        'pan_number': f'ABCDE{random.randint(1000, 9999)}F',
                        'aadhar_number': f'{random.randint(100000000000, 999999999999)}',
                        'emergency_contact_name': f'{user.first_name} Family',
                        'emergency_contact_phone': f'+91 9{random.randint(100000000, 999999999999)}',
                        'is_active': True,
                    }
                )
                employees.append(emp)
            except Exception:
                pass
        self.stdout.write(f'    {len(employees)} employees')
        return employees

    def _seed_employee_skills(self, employees, skills):
        self.stdout.write('  Seeding employee skills...')
        ES = self.models['EmployeeSkill']
        SL = self.enums['SkillLevel']
        count = 0
        for emp in employees:
            chosen = random.sample(skills, min(random.randint(2, 5), len(skills)))
            for sk in chosen:
                try:
                    ES.objects.get_or_create(
                        employee=emp.profile, skill=sk,
                        defaults={
                            'skill_level': random.choice([SL.BEGINNER, SL.INTERMEDIATE, SL.ADVANCED, SL.EXPERT]),
                            'approval_status': random.choice(['PENDING', 'APPROVED', 'APPROVED']),
                        }
                    )
                    count += 1
                except Exception:
                    pass
        self.stdout.write(f'    {count} employee skills')

    def _seed_training(self, skills, employees, users, branches):
        self.stdout.write('  Seeding training programs...')
        TP = self.models['TrainingProgram']
        TE = self.models['TrainingEnrollment']
        hr = users[14] if len(users) > 14 else users[0]
        data = [
            ('Advanced Engine Diagnostics', 'TECHNICAL', 'PLANNED'),
            ('EV Service Certification', 'CERTIFICATION', 'IN_PROGRESS'),
            ('Customer Handling Workshop', 'WORKSHOP', 'COMPLETED'),
            ('Safety & Fire Drills', 'SAFETY', 'PLANNED'),
            ('Leadership Development', 'WORKSHOP', 'IN_PROGRESS'),
            ('AC System Advanced Training', 'TECHNICAL', 'COMPLETED'),
            ('OBD-II Scanner Certification', 'CERTIFICATION', 'PLANNED'),
            ('First Aid & Emergency', 'SAFETY', 'COMPLETED'),
            ('Digital Inspection Training', 'TECHNICAL', 'IN_PROGRESS'),
            ('Quality Control Standards', 'WORKSHOP', 'PLANNED'),
        ]
        programs = []
        for name, ttype, status in data:
            start = date.today() + timedelta(days=random.randint(-30, 30))
            try:
                prog, _ = TP.objects.get_or_create(
                    name=name,
                    defaults={
                        'training_type': ttype, 'status': status,
                        'description': f'Training: {name}',
                        'start_date': start, 'end_date': start + timedelta(days=random.choice([1, 3, 5])),
                        'max_participants': random.randint(10, 30),
                        'skill': random.choice(skills) if skills else None,
                        'branch': branches[0], 'created_by': hr,
                    }
                )
                programs.append(prog)
            except Exception:
                pass
        enroll_count = 0
        for prog in programs:
            enrolled = random.sample(employees, min(random.randint(3, 6), len(employees)))
            for emp in enrolled:
                try:
                    TE.objects.get_or_create(
                        training=prog, employee=emp.profile,
                        defaults={
                            'status': random.choice(['ENROLLED', 'IN_PROGRESS', 'COMPLETED']),
                            'assessment_score': random.randint(60, 100) if random.random() > 0.3 else None,
                        }
                    )
                    enroll_count += 1
                except Exception:
                    pass
        self.stdout.write(f'    {len(programs)} programs, {enroll_count} enrollments')

    def _seed_leave_types(self):
        self.stdout.write('  Seeding leave types...')
        LT = self.models['LeaveType']
        data = [
            ('Casual Leave', 'CL', 12), ('Sick Leave', 'SL', 10), ('Earned Leave', 'EL', 15),
            ('Maternity Leave', 'ML', 180), ('Paternity Leave', 'PL', 15),
            ('Compensatory Off', 'CO', 0), ('Loss of Pay', 'LOP', 0),
        ]
        types = []
        for name, code, days in data:
            lt, _ = LT.objects.get_or_create(
                code=code,
                defaults={'name': name, 'annual_quota': days, 'is_active': True, 'is_paid': days > 0}
            )
            types.append(lt)
        self.stdout.write(f'    {len(types)} leave types')
        return types

    def _seed_leave_data(self, employees, leave_types, users):
        self.stdout.write('  Seeding leave balances & requests...')
        LB = self.models['LeaveBalance']
        LR = self.models['LeaveRequest']
        hr = users[14] if len(users) > 14 else users[0]
        bal_c = 0
        for emp in employees:
            for lt in leave_types[:3]:
                try:
                    LB.objects.get_or_create(
                        employee=emp.profile, leave_type=lt, year=2026,
                        defaults={
                            'opening_balance': lt.annual_quota,
                            'accrued': lt.annual_quota,
                            'used': random.randint(0, min(5, lt.annual_quota)),
                        }
                    )
                    bal_c += 1
                except Exception:
                    pass
        req_c = 0
        for emp in employees[:10]:
            try:
                sd = date.today() + timedelta(days=random.randint(-10, 30))
                LR.objects.create(
                    employee=emp.profile, leave_type=random.choice(leave_types[:3]),
                    start_date=sd, end_date=sd + timedelta(days=random.randint(1, 3)),
                    reason=random.choice(['Personal work', 'Family event', 'Medical', 'Travel']),
                    status=random.choice(['PENDING', 'APPROVED', 'REJECTED']),
                    reviewed_by=hr if random.random() > 0.3 else None,
                )
                req_c += 1
            except Exception:
                pass
        self.stdout.write(f'    {bal_c} balances, {req_c} leave requests')

    def _seed_holidays(self, branches):
        self.stdout.write('  Seeding holidays...')
        Holiday = self.models['Holiday']
        data = [
            ('Republic Day', date(2026, 1, 26)), ('Holi', date(2026, 3, 10)),
            ('Good Friday', date(2026, 4, 3)), ('Eid ul-Fitr', date(2026, 3, 31)),
            ('Independence Day', date(2026, 8, 15)), ('Ganesh Chaturthi', date(2026, 8, 27)),
            ('Dussehra', date(2026, 10, 2)), ('Diwali', date(2026, 10, 20)),
            ('Christmas', date(2026, 12, 25)), ('New Year', date(2026, 1, 1)),
        ]
        count = 0
        for name, d in data:
            try:
                h, _ = Holiday.objects.get_or_create(name=name, date=d, defaults={'year': 2026})
                count += 1
            except Exception:
                pass
        self.stdout.write(f'    {count} holidays')

    def _seed_shifts(self, branches):
        self.stdout.write('  Seeding shifts...')
        HRShift = self.models['HRShift']
        data = [
            ('Morning Shift', 'MORN', time(8, 0), time(16, 0)),
            ('Day Shift', 'DAY', time(9, 0), time(17, 30)),
            ('Evening Shift', 'EVE', time(14, 0), time(22, 0)),
            ('Night Shift', 'NGHT', time(22, 0), time(6, 0)),
        ]
        shifts = []
        for name, code, start, end in data:
            try:
                s, _ = HRShift.objects.get_or_create(
                    name=name, branch=branches[0],
                    defaults={'code': code, 'start_time': start, 'end_time': end, 'is_active': True}
                )
                shifts.append(s)
            except Exception:
                pass
        self.stdout.write(f'    {len(shifts)} shifts')
        return shifts

    def _seed_employee_shifts(self, employees, shifts):
        self.stdout.write('  Seeding employee shift assignments...')
        ES = self.models['EmployeeShift']
        count = 0
        if not shifts:
            return
        for emp in employees:
            try:
                ES.objects.get_or_create(
                    employee=emp.profile, is_current=True,
                    defaults={
                        'shift': random.choice(shifts),
                        'effective_from': date.today() - timedelta(days=random.randint(0, 90)),
                    }
                )
                count += 1
            except Exception:
                pass
        self.stdout.write(f'    {count} shift assignments')

    def _seed_attendance(self, employees, users):
        self.stdout.write('  Seeding attendance records...')
        AR = self.models['AttendanceRecord']
        HRA = self.models['HRAttendance']
        count = 0
        hr_count = 0
        manager = users[0]
        for emp in employees[:12]:
            for d in range(10):
                att_date = date.today() - timedelta(days=d)
                if att_date.weekday() >= 5:
                    continue
                check_in_h = random.randint(8, 10)
                check_in_m = random.randint(0, 30)
                check_out_h = random.randint(17, 19)
                check_out_m = random.randint(0, 59)
                status = random.choice(['PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'HALF_DAY'])
                work_hrs = Decimal(str(round(random.uniform(7.5, 9.5), 2)))
                try:
                    AR.objects.get_or_create(
                        profile=emp.profile, date=att_date,
                        defaults={
                            'check_in': timezone.now().replace(hour=check_in_h, minute=check_in_m),
                            'check_out': timezone.now().replace(hour=check_out_h, minute=check_out_m),
                            'status': status,
                            'work_hours': work_hrs,
                        }
                    )
                    count += 1
                except Exception:
                    pass
                try:
                    from datetime import time as dt_time
                    overtime = random.randint(0, 60) if status == 'PRESENT' else 0
                    HRA.objects.get_or_create(
                        employee=emp.profile, date=att_date,
                        defaults={
                            'status': status,
                            'check_in_time': dt_time(check_in_h, check_in_m),
                            'check_out_time': dt_time(check_out_h, check_out_m),
                            'total_hours': work_hrs,
                            'productive_hours': Decimal(str(round(float(work_hrs) * 0.85, 2))),
                            'overtime_minutes': overtime,
                            'break_duration_minutes': random.choice([30, 45, 60]),
                            'is_remote': random.choice([True, False, False, False]),
                            'remarks': '',
                            'approved_by': manager,
                        }
                    )
                    hr_count += 1
                except Exception:
                    pass
        self.stdout.write(f'    {count} attendance records, {hr_count} HR attendance records')

    def _seed_incentives(self, employees, users):
        self.stdout.write('  Seeding incentive rules & employee incentives...')
        IR = self.models['IncentiveRule']
        EI = self.models['EmployeeIncentive']
        IT = self.enums['IncentiveType']
        hr = users[14] if len(users) > 14 else users[0]
        rule_data = [
            ('Monthly Target Bonus', IT.PER_JOB, Decimal('5000')),
            ('Customer Satisfaction Bonus', IT.QUALITY_BONUS, Decimal('3000')),
            ('Attendance Bonus', IT.ATTENDANCE_BONUS, Decimal('1500')),
            ('Skill Upgrade Bonus', IT.SKILL_BONUS, Decimal('4000')),
        ]
        rules = []
        for name, itype, amt in rule_data:
            try:
                r, _ = IR.objects.get_or_create(
                    name=name,
                    defaults={
                        'incentive_type': itype, 'base_amount': amt, 'is_active': True,
                        'description': f'Incentive: {name}',
                        'effective_from': date.today() - timedelta(days=90),
                    }
                )
                rules.append(r)
            except Exception:
                pass
        count = 0
        for emp in employees[:10]:
            if rules:
                rule = random.choice(rules)
                try:
                    EI.objects.create(
                        employee=emp.profile, rule=rule, base_amount=rule.base_amount,
                        net_amount=rule.base_amount,
                        period_start=date.today().replace(day=1),
                        period_end=date.today().replace(day=28),
                        status=random.choice(['PENDING', 'APPROVED', 'PAID']),
                        approved_by=hr if random.random() > 0.3 else None,
                    )
                    count += 1
                except Exception:
                    pass
        self.stdout.write(f'    {len(rules)} rules, {count} incentives')

    def _seed_payroll(self, employees, users):
        self.stdout.write('  Seeding payroll records...')
        Payroll = self.models['Payroll']
        hr = users[14] if len(users) > 14 else users[0]
        count = 0
        for emp in employees[:15]:
            try:
                base = emp.basic_salary or Decimal('30000')
                hra = base * Decimal('0.4')
                conv = Decimal('1600')
                sa_amt = Decimal('2000')
                pf = base * Decimal('0.12')
                tax = base * Decimal('0.1')
                gross = base + hra + conv + sa_amt
                net = gross - pf - tax
                prev_month = date.today().replace(day=1) - timedelta(days=1)
                Payroll.objects.get_or_create(
                    employee=emp.profile, month=prev_month.month, year=prev_month.year,
                    defaults={
                        'basic_salary': base, 'hra': hra, 'conveyance': conv,
                        'special_allowance': sa_amt,
                        'pf_deduction': pf, 'esi_deduction': Decimal('0'),
                        'professional_tax': Decimal('200'),
                        'tds_deduction': tax, 'total_deductions': pf + tax + Decimal('200'),
                        'gross_salary': gross, 'net_salary': net,
                        'days_worked': random.randint(20, 26),
                        'days_absent': random.randint(0, 3),
                        'status': random.choice(['DRAFT', 'APPROVED', 'PAID']),
                        'approved_by': hr if random.random() > 0.3 else None,
                    }
                )
                count += 1
            except Exception:
                pass
        self.stdout.write(f'    {count} payroll records')

    def _seed_accounts(self, branches):
        self.stdout.write('  Seeding chart of accounts...')
        Account = self.models['Account']
        AC = self.enums['AccountCategory']
        AT = self.enums['AccountType']
        data = [
            ('1000', 'Cash in Hand', AC.ASSETS, AT.CASH),
            ('1010', 'Bank Account - SBI', AC.ASSETS, AT.BANK),
            ('1020', 'Bank Account - HDFC', AC.ASSETS, AT.BANK),
            ('1100', 'Accounts Receivable', AC.ASSETS, AT.RECEIVABLE),
            ('1200', 'Inventory', AC.ASSETS, AT.INVENTORY),
            ('1300', 'Prepaid Expenses', AC.ASSETS, AT.CASH),
            ('1500', 'Equipment & Tools', AC.ASSETS, AT.FIXED_ASSET),
            ('2000', 'Accounts Payable', AC.LIABILITIES, AT.PAYABLE),
            ('2100', 'GST Payable', AC.LIABILITIES, AT.TAX_LIABILITY),
            ('2200', 'Salary Payable', AC.LIABILITIES, AT.PAYABLE),
            ('2300', 'TDS Payable', AC.LIABILITIES, AT.TAX_LIABILITY),
            ('3000', 'Owner Equity', AC.EQUITY, AT.CAPITAL),
            ('3100', 'Retained Earnings', AC.EQUITY, AT.RETAINED_EARNINGS),
            ('4000', 'Service Revenue - Labor', AC.INCOME, AT.REVENUE),
            ('4100', 'Service Revenue - Parts', AC.INCOME, AT.REVENUE),
            ('4200', 'AMC Revenue', AC.INCOME, AT.REVENUE),
            ('4300', 'Other Income', AC.INCOME, AT.REVENUE),
            ('5000', 'Cost of Parts Sold', AC.EXPENSES, AT.COGS),
            ('5100', 'Salaries & Wages', AC.EXPENSES, AT.EXPENSE),
            ('5200', 'Rent & Utilities', AC.EXPENSES, AT.EXPENSE),
            ('5300', 'Marketing & Advertising', AC.EXPENSES, AT.EXPENSE),
            ('5400', 'Insurance', AC.EXPENSES, AT.EXPENSE),
            ('5500', 'Depreciation', AC.EXPENSES, AT.EXPENSE),
            ('5600', 'Miscellaneous Expenses', AC.EXPENSES, AT.EXPENSE),
        ]
        accounts = []
        for code, name, cat, atype in data:
            try:
                a, _ = Account.objects.get_or_create(
                    code=code,
                    defaults={
                        'name': name, 'category': cat, 'account_type': atype,
                        'branch': branches[0], 'is_active': True,
                        'opening_balance': Decimal(str(random.randint(0, 500000))) if cat in [AC.ASSETS, AC.EQUITY] else Decimal('0'),
                    }
                )
                accounts.append(a)
            except Exception:
                pass
        self.stdout.write(f'    {len(accounts)} accounts')
        return accounts

    def _seed_tax_rates(self):
        self.stdout.write('  Seeding tax rates...')
        TR = self.models['TaxRate']
        data = [
            ('GST 5%', 'GST', Decimal('5')), ('GST 12%', 'GST', Decimal('12')),
            ('GST 18%', 'GST', Decimal('18')), ('GST 28%', 'GST', Decimal('28')),
            ('IGST 5%', 'IGST', Decimal('5')), ('IGST 18%', 'IGST', Decimal('18')),
            ('IGST 28%', 'IGST', Decimal('28')), ('Exempt', 'EXEMPT', Decimal('0')),
            ('TDS 1%', 'TDS', Decimal('1')), ('TDS 2%', 'TDS', Decimal('2')),
        ]
        rates = []
        for name, ttype, rate in data:
            try:
                t, _ = TR.objects.get_or_create(name=name, defaults={'tax_type': ttype, 'rate': rate, 'is_active': True})
                rates.append(t)
            except Exception:
                pass
        self.stdout.write(f'    {len(rates)} tax rates')

    def _seed_enhanced_invoices(self, job_cards, customers, branches, users, accounts):
        self.stdout.write('  Seeding enhanced invoices...')
        EI = self.models['EnhancedInvoice']
        IS = self.enums['InvoiceStatus']
        IT = self.enums['InvoiceType']
        WS = self.enums['WorkflowStage']
        acc = users[12] if len(users) > 12 else users[0]
        billing_jcs = [jc for jc in job_cards if jc.workflow_stage in [WS.BILLING, WS.DELIVERY, WS.COMPLETED]]
        receivable = next((a for a in accounts if a.code == '1100'), None)
        revenue = next((a for a in accounts if a.code == '4000'), None)
        count = 0
        for jc in billing_jcs:
            sub = Decimal(str(random.randint(5000, 50000)))
            cgst = sub * Decimal('0.09')
            sgst = sub * Decimal('0.09')
            total = sub + cgst + sgst
            try:
                EI.objects.get_or_create(
                    job_card=jc,
                    defaults={
                        'invoice_type': random.choice([IT.SERVICE, IT.SALES]),
                        'status': random.choice([IS.DRAFT, IS.APPROVED, IS.ISSUED, IS.PAID]),
                        'customer': jc.customer, 'branch': branches[0],
                        'subtotal': sub, 'taxable_amount': sub,
                        'cgst_amount': cgst, 'sgst_amount': sgst,
                        'total_tax': cgst + sgst, 'grand_total': total,
                        'balance_due': total if random.random() > 0.5 else Decimal('0'),
                        'amount_paid': Decimal('0') if random.random() > 0.5 else total,
                        'invoice_date': date.today() - timedelta(days=random.randint(0, 30)),
                        'due_date': date.today() + timedelta(days=random.randint(15, 45)),
                        'payment_terms': random.choice(['Net 15', 'Net 30', 'Due on Receipt']),
                        'place_of_supply': 'Maharashtra', 'created_by': acc,
                        'receivable_account': receivable, 'revenue_account': revenue,
                    }
                )
                count += 1
            except Exception:
                pass
        self.stdout.write(f'    {count} enhanced invoices')

    def _seed_expenses(self, branches, users):
        self.stdout.write('  Seeding expenses...')
        EC = self.models['ExpenseCategory']
        Expense = self.models['Expense']
        ES = self.enums['ExpenseStatus']
        acc = users[12] if len(users) > 12 else users[0]
        cats = []
        for name, code in [('Rent', 'RENT'), ('Utilities', 'UTIL'), ('Office Supplies', 'OFFC'), ('Vehicle Running', 'VHCL'), ('Maintenance', 'MAINT'), ('Marketing', 'MKTG')]:
            try:
                ec, _ = EC.objects.get_or_create(code=code, defaults={'name': name, 'is_active': True})
                cats.append(ec)
            except Exception:
                pass
        data = [
            ('Monthly Rent - Workshop', 50000), ('Electricity Bill', 18500),
            ('Water Supply', 3200), ('Internet & Phone', 5800),
            ('Office Stationery', 2500), ('Diesel for Generator', 8000),
            ('Cleaning Supplies', 3500), ('Staff Uniforms', 12000),
            ('Fire Extinguisher Refill', 4500), ('Marketing Pamphlets', 7500),
            ('AC Maintenance', 3000), ('Security Service', 15000),
        ]
        count = 0
        for desc, amt in data:
            try:
                Expense.objects.create(
                    description=desc, amount=Decimal(str(amt)),
                    total_amount=Decimal(str(amt)) * Decimal('1.18'),
                    branch=branches[0],
                    category=random.choice(cats) if cats else None,
                    status=random.choice([ES.DRAFT, ES.APPROVED, ES.PAID]),
                    expense_date=date.today() - timedelta(days=random.randint(0, 30)),
                    submitted_by=acc,
                    payment_mode=random.choice(['CASH', 'BANK_TRANSFER', 'UPI', 'CHEQUE']),
                    tax_amount=Decimal(str(amt)) * Decimal('0.18') if random.random() > 0.5 else Decimal('0'),
                )
                count += 1
            except Exception:
                pass
        self.stdout.write(f'    {len(cats)} categories, {count} expenses')

    def _seed_analytics(self, branches):
        self.stdout.write('  Seeding analytics snapshots...')
        AS = self.models['AnalyticsSnapshot']
        count = 0
        for d in range(15):
            snap_date = date.today() - timedelta(days=d)
            for branch in branches[:3]:
                try:
                    AS.objects.get_or_create(
                        branch=branch, date=snap_date,
                        defaults={
                            'total_jobs': random.randint(5, 25), 'completed_jobs': random.randint(3, 20),
                            'revenue': Decimal(str(random.randint(50000, 500000))),
                            'labor_revenue': Decimal(str(random.randint(20000, 200000))),
                            'parts_revenue': Decimal(str(random.randint(30000, 300000))),
                            'average_job_value': Decimal(str(random.randint(3000, 15000))),
                            'average_cycle_time': Decimal(str(round(random.uniform(2, 8), 2))),
                            'sla_compliance_rate': Decimal(str(round(random.uniform(80, 98), 2))),
                            'customer_satisfaction': Decimal(str(round(random.uniform(3.5, 5.0), 2))),
                            'technician_utilization': Decimal(str(round(random.uniform(60, 95), 2))),
                            'first_time_fix_rate': Decimal(str(round(random.uniform(75, 95), 2))),
                            'new_customers': random.randint(1, 5), 'repeat_customers': random.randint(3, 15),
                            'appointments_scheduled': random.randint(5, 20),
                            'appointments_completed': random.randint(3, 18),
                        }
                    )
                    count += 1
                except Exception:
                    pass
        self.stdout.write(f'    {count} analytics snapshots')

    def _seed_technician_schedules(self, branches, users):
        self.stdout.write('  Seeding technician schedules...')
        TS = self.models['TechnicianSchedule']
        techs = [u for u in users if hasattr(u, 'profile') and u.profile.role in ['TECHNICIAN', 'SERVICE_ENGINEER']]
        if not techs:
            techs = users[:3]
        count = 0
        for d in range(7):
            sched_date = date.today() + timedelta(days=d)
            for tech in techs:
                try:
                    TS.objects.get_or_create(
                        technician=tech, date=sched_date,
                        defaults={
                            'branch': branches[0],
                            'shift_start': time(9, 0), 'shift_end': time(17, 30),
                            'is_available': random.random() > 0.1,
                        }
                    )
                    count += 1
                except Exception:
                    pass
        self.stdout.write(f'    {count} technician schedules')

    def _seed_inventory_alerts(self, parts):
        self.stdout.write('  Seeding inventory alerts...')
        IA = self.models['InventoryAlert']
        count = 0
        for part in parts[:10]:
            try:
                IA.objects.create(
                    part=part, branch=part.branch,
                    alert_type=random.choice(['LOW_STOCK', 'REORDER', 'EXPIRY', 'OVERSTOCK']),
                    message=f'{part.name}: Stock level requires attention',
                    is_resolved=random.choice([True, False]),
                )
                count += 1
            except Exception:
                pass
        self.stdout.write(f'    {count} inventory alerts')

    def _seed_config_options(self):
        self.stdout.write('  Seeding configuration options...')
        CC = self.models['ConfigCategory']
        CO = self.models['ConfigOption']
        cats = [
            ('General Settings', 'general', 'System-wide configuration'),
            ('Service Settings', 'service', 'Service workflow configuration'),
            ('Billing Settings', 'billing', 'Billing and invoicing configuration'),
            ('Notification Settings', 'notification', 'Notification preferences'),
            ('CRM Settings', 'crm', 'CRM module configuration'),
        ]
        for name, code, desc in cats:
            try:
                cat, _ = CC.objects.get_or_create(code=code, defaults={'name': name, 'description': desc})
                configs = {
                    'general': [('company_name', 'AutoServ Solutions Pvt Ltd', 'Company Name'), ('currency', 'INR', 'Currency'), ('timezone', 'Asia/Kolkata', 'Timezone')],
                    'service': [('default_sla_hours', '24', 'Default SLA Hours'), ('max_parallel_jobs', '5', 'Max Parallel Jobs')],
                    'billing': [('default_payment_terms', 'Net 30', 'Payment Terms'), ('gst_enabled', 'true', 'GST Enabled')],
                    'notification': [('email_enabled', 'true', 'Email Notifications'), ('sms_enabled', 'true', 'SMS Notifications')],
                    'crm': [('lead_auto_assign', 'true', 'Auto-assign Leads'), ('max_contact_attempts', '5', 'Max Contact Attempts')],
                }
                for key, val, label in configs.get(code, []):
                    CO.objects.get_or_create(
                        category=cat, code=key,
                        defaults={'label': label, 'description': f'Config: {key}'}
                    )
            except Exception:
                pass
        self.stdout.write('    Config options seeded')
