import pytest
from decimal import Decimal
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth.models import User

from tests.conftest import BranchFactory, UserFactory, ProfileFactory, PartFactory
from api.models import UserRole


@pytest.mark.security
@pytest.mark.django_db
class TestProfilelessUserDenied:
    def test_user_without_profile_cannot_delete_branch(self):
        branch = BranchFactory()
        user = User.objects.create_user(username="noprofile", password="TestPass@1234")
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.delete(f"/api/branches/{branch.pk}/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_user_without_profile_cannot_create_branch(self):
        user = User.objects.create_user(username="noprofile2", password="TestPass@1234")
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.post("/api/branches/", {
            "code": "HACK-01",
            "name": "Hacked Branch",
            "address": "123 Bad St",
            "phone": "000-0000",
            "email": "hack@test.com",
            "city": "Test",
            "state": "Test",
        }, format="json")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_user_without_profile_cannot_delete_customer(self):
        from tests.conftest import CustomerFactory
        branch = BranchFactory()
        customer = CustomerFactory(branch=branch)
        user = User.objects.create_user(username="noprofile3", password="TestPass@1234")
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.delete(f"/api/customers/{customer.pk}/")
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.security
@pytest.mark.django_db
class TestRBACDestroyAction:
    def test_customer_role_destroy_branch_denied(self):
        branch = BranchFactory()
        user = UserFactory()
        ProfileFactory(user=user, role=UserRole.CUSTOMER, branch=branch)
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.delete(f"/api/branches/{branch.pk}/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_technician_role_destroy_branch_denied(self):
        branch = BranchFactory()
        user = UserFactory()
        ProfileFactory(user=user, role=UserRole.TECHNICIAN, branch=branch)
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.delete(f"/api/branches/{branch.pk}/")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_super_admin_destroy_branch_allowed(self):
        branch = BranchFactory()
        user = UserFactory()
        ProfileFactory(user=user, role=UserRole.SUPER_ADMIN, branch=branch)
        client = APIClient()
        client.force_authenticate(user=user)
        response = client.delete(f"/api/branches/{branch.pk}/")
        assert response.status_code == status.HTTP_204_NO_CONTENT


@pytest.mark.unit
@pytest.mark.django_db
class TestPartDecimalRegression:
    def test_part_save_with_decimal_cost_price(self):
        part = PartFactory(cost_price=Decimal("1000.00"), selling_price=Decimal("1500.00"))
        assert part.landing_cost == Decimal("1180.00")
        assert part.cgst_rate == Decimal("9")
        assert part.sgst_rate == Decimal("9")

    def test_part_save_with_zero_cost_price(self):
        part = PartFactory(cost_price=Decimal("0"), selling_price=Decimal("500.00"))
        assert part.landing_cost == Decimal("0")

    def test_part_margin_calculation(self):
        part = PartFactory(cost_price=Decimal("500.00"), selling_price=Decimal("1000.00"))
        assert part.margin_percent > 0
