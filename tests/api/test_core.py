import pytest
from rest_framework import status

from tests.conftest import (
    BranchFactory, CustomerFactory, VehicleFactory, JobCardFactory,
    UserFactory, ProfileFactory, PartFactory, SupplierFactory,
)
from api.models import UserRole, WorkflowStage


@pytest.mark.api
@pytest.mark.django_db
class TestBranchAPI:
    def test_list_branches(self, authenticated_admin):
        BranchFactory.create_batch(3)
        response = authenticated_admin.get("/api/branches/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) >= 3

    def test_create_branch(self, authenticated_admin):
        response = authenticated_admin.post("/api/branches/", {
            "code": "NEW-BR",
            "name": "New Branch",
            "address": "123 Test St",
            "phone": "555-0001",
            "email": "new@branch.com",
            "city": "Delhi",
            "state": "Delhi",
        }, format="json")
        assert response.status_code == status.HTTP_201_CREATED

    def test_unauthenticated_cannot_list(self, api_client):
        response = api_client.get("/api/branches/")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


@pytest.mark.api
@pytest.mark.django_db
class TestCustomerAPI:
    def test_list_customers(self, authenticated_admin, customer):
        response = authenticated_admin.get("/api/customers/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert len(data) >= 1

    def test_retrieve_customer(self, authenticated_admin, customer):
        response = authenticated_admin.get(f"/api/customers/{customer.pk}/")
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["name"] == customer.name

    def test_filter_by_branch(self, authenticated_admin, branch, branch2):
        CustomerFactory(branch=branch, name="Branch1 Cust")
        CustomerFactory(branch=branch2, name="Branch2 Cust")
        response = authenticated_admin.get(f"/api/customers/?branch={branch.pk}")
        data = response.json()
        assert all(c["branch"] == branch.pk for c in data if c.get("branch"))


@pytest.mark.api
@pytest.mark.django_db
class TestVehicleAPI:
    def test_list_vehicles(self, authenticated_admin, vehicle):
        response = authenticated_admin.get("/api/vehicles/")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_customer(self, authenticated_admin, customer, vehicle):
        response = authenticated_admin.get(f"/api/vehicles/?customer_id={customer.pk}")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestJobCardAPI:
    def test_list_job_cards(self, authenticated_admin, job_card):
        response = authenticated_admin.get("/api/job-cards/")
        assert response.status_code == status.HTTP_200_OK

    def test_retrieve_job_card(self, authenticated_admin, job_card):
        response = authenticated_admin.get(f"/api/job-cards/{job_card.pk}/")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_branch(self, authenticated_admin, job_card, branch):
        response = authenticated_admin.get(f"/api/job-cards/?branch={branch.pk}")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_stage(self, authenticated_admin, job_card):
        response = authenticated_admin.get(f"/api/job-cards/?stage={WorkflowStage.APPOINTMENT}")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert all(jc["workflow_stage"] == WorkflowStage.APPOINTMENT for jc in data)


@pytest.mark.api
@pytest.mark.django_db
class TestPartAPI:
    def test_list_parts(self, authenticated_admin, part):
        response = authenticated_admin.get("/api/parts/")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_branch(self, authenticated_admin, part, branch):
        response = authenticated_admin.get(f"/api/parts/?branch={branch.pk}")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestSupplierAPI:
    def test_list_suppliers(self, authenticated_admin, supplier):
        response = authenticated_admin.get("/api/suppliers/")
        assert response.status_code == status.HTTP_200_OK

    def test_create_supplier(self, authenticated_admin):
        response = authenticated_admin.post("/api/suppliers/", {
            "name": "New Supplier Co",
            "phone": "555-9999",
            "email": "newsup@test.com",
        }, format="json")
        assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.api
@pytest.mark.django_db
class TestDashboardAPIs:
    def test_dashboard_stats(self, authenticated_admin):
        response = authenticated_admin.get("/api/dashboard/stats/")
        assert response.status_code == status.HTTP_200_OK

    def test_workflow_stages(self, authenticated_admin):
        response = authenticated_admin.get("/api/workflow/stages/")
        assert response.status_code == status.HTTP_200_OK

    def test_analytics_summary(self, authenticated_admin):
        response = authenticated_admin.get("/api/analytics/summary/")
        assert response.status_code == status.HTTP_200_OK

    def test_analytics_branch_filter(self, authenticated_admin, branch):
        response = authenticated_admin.get(f"/api/analytics/summary/?branch_id={branch.pk}")
        assert response.status_code == status.HTTP_200_OK

    def test_dashboard_unauthenticated(self, api_client):
        response = api_client.get("/api/dashboard/stats/")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]
