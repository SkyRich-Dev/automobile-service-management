import pytest
import factory
from django.contrib.auth.models import User
from django.test import RequestFactory
from rest_framework.test import APIClient

from api.models import (
    Branch, Profile, Customer, Vehicle, JobCard, Part, Supplier,
    Lead,
    UserRole, WorkflowStage, CustomerCategory, TaskStatus,
)


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def request_factory():
    return RequestFactory()


class BranchFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Branch

    code = factory.Sequence(lambda n: f"BR-{n:03d}")
    name = factory.Sequence(lambda n: f"Branch {n}")
    address = factory.Faker("address")
    phone = factory.Sequence(lambda n: f"555-{n:04d}")
    email = factory.LazyAttribute(lambda o: f"{o.code.lower()}@test.com")
    city = "Mumbai"
    state = "Maharashtra"
    country = "India"
    is_active = True


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"testuser_{n}")
    email = factory.LazyAttribute(lambda o: f"{o.username}@test.com")
    password = factory.PostGenerationMethodCall("set_password", "TestPass@1234")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")
    is_active = True


class ProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Profile

    user = factory.SubFactory(UserFactory)
    role = UserRole.TECHNICIAN
    branch = factory.SubFactory(BranchFactory)
    phone = factory.Sequence(lambda n: f"999-{n:04d}")


class CustomerFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Customer

    branch = factory.SubFactory(BranchFactory)
    name = factory.Faker("name")
    phone = factory.Sequence(lambda n: f"888-{n:04d}")
    email = factory.Sequence(lambda n: f"customer_{n}@test.com")
    customer_category = CustomerCategory.RETAIL
    is_active = True


class VehicleFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Vehicle

    customer = factory.SubFactory(CustomerFactory)
    plate_number = factory.Sequence(lambda n: f"MH-01-AB-{n:04d}")
    make = "Toyota"
    model = "Camry"
    year = 2023
    vin = factory.Sequence(lambda n: f"VIN{n:013d}")
    vehicle_type = "CAR"


class PartFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Part

    name = factory.Sequence(lambda n: f"Part {n}")
    sku = factory.Sequence(lambda n: f"SKU-{n:06d}")
    part_number = factory.Sequence(lambda n: f"PN-{n:06d}")
    category = "ENGINE"
    stock = 100
    min_stock = 10
    max_stock = 500
    selling_price = factory.LazyFunction(lambda: __import__('decimal').Decimal("999.99"))
    cost_price = factory.LazyFunction(lambda: __import__('decimal').Decimal("500.00"))
    branch = factory.SubFactory(BranchFactory)


class SupplierFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Supplier

    name = factory.Sequence(lambda n: f"Supplier {n}")
    phone = factory.Sequence(lambda n: f"777-{n:04d}")
    email = factory.Sequence(lambda n: f"supplier_{n}@test.com")
    is_active = True


class JobCardFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = JobCard

    branch = factory.SubFactory(BranchFactory)
    customer = factory.SubFactory(CustomerFactory)
    vehicle = factory.LazyAttribute(lambda o: VehicleFactory(customer=o.customer))
    workflow_stage = WorkflowStage.APPOINTMENT
    job_type = "General Service"
    priority = "Normal"
    complaint = "Test concern"
    created_by = factory.SubFactory(UserFactory)


class LeadFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Lead

    name = factory.Faker("name")
    phone = factory.Sequence(lambda n: f"666-{n:04d}")
    email = factory.Sequence(lambda n: f"lead_{n}@test.com")
    source = "WEBSITE"
    status = "NEW"
    branch = factory.SubFactory(BranchFactory)
    owner = factory.SubFactory(UserFactory)


@pytest.fixture
def branch(db):
    return BranchFactory()


@pytest.fixture
def branch2(db):
    return BranchFactory()


@pytest.fixture
def admin_user(db, branch):
    user = UserFactory(username="test_admin")
    ProfileFactory(user=user, role=UserRole.SUPER_ADMIN, branch=branch)
    return user


@pytest.fixture
def service_advisor(db, branch):
    user = UserFactory(username="test_advisor")
    ProfileFactory(user=user, role=UserRole.SERVICE_ADVISOR, branch=branch)
    return user


@pytest.fixture
def technician_user(db, branch):
    user = UserFactory(username="test_tech")
    ProfileFactory(user=user, role=UserRole.TECHNICIAN, branch=branch)
    return user


@pytest.fixture
def customer_user(db, branch):
    user = UserFactory(username="test_customer_role")
    ProfileFactory(user=user, role=UserRole.CUSTOMER, branch=branch)
    return user


@pytest.fixture
def authenticated_admin(api_client, admin_user):
    api_client.force_authenticate(user=admin_user)
    return api_client


@pytest.fixture
def authenticated_advisor(api_client, service_advisor):
    api_client.force_authenticate(user=service_advisor)
    return api_client


@pytest.fixture
def authenticated_technician(api_client, technician_user):
    api_client.force_authenticate(user=technician_user)
    return api_client


@pytest.fixture
def customer(db, branch):
    return CustomerFactory(branch=branch)


@pytest.fixture
def vehicle(db, customer):
    return VehicleFactory(customer=customer)


@pytest.fixture
def job_card(db, branch, customer, vehicle, admin_user):
    return JobCardFactory(
        branch=branch,
        customer=customer,
        vehicle=vehicle,
        created_by=admin_user,
    )


@pytest.fixture
def part(db, branch):
    return PartFactory(branch=branch)


@pytest.fixture
def supplier(db):
    return SupplierFactory()


@pytest.fixture
def lead(db, branch, admin_user):
    return LeadFactory(branch=branch, owner=admin_user)
