import pytest
from rest_framework import status

from tests.conftest import BranchFactory, LeadFactory, UserFactory, ProfileFactory
from api.models import UserRole


@pytest.mark.api
@pytest.mark.django_db
class TestCRMDashboard:
    def test_crm_dashboard(self, authenticated_admin):
        response = authenticated_admin.get("/api/crm/dashboard/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_customers" in data
        assert "new_leads" in data
        assert "open_tickets" in data
        assert "lead_pipeline" in data

    def test_crm_dashboard_branch_filter(self, authenticated_admin, branch):
        response = authenticated_admin.get(f"/api/crm/dashboard/?branch={branch.pk}")
        assert response.status_code == status.HTTP_200_OK

    def test_crm_dashboard_unauthenticated(self, api_client):
        response = api_client.get("/api/crm/dashboard/")
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.api
@pytest.mark.django_db
class TestLeadAPI:
    def test_list_leads(self, authenticated_admin, lead):
        response = authenticated_admin.get("/api/leads/")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.json()) >= 1

    def test_create_lead(self, authenticated_admin, branch):
        response = authenticated_admin.post("/api/leads/", {
            "name": "Test Lead",
            "phone": "555-1111",
            "email": "lead@test.com",
            "source": "WEBSITE",
            "status": "NEW",
            "branch": branch.pk,
        }, format="json")
        assert response.status_code == status.HTTP_201_CREATED

    def test_filter_leads_by_branch(self, authenticated_admin, branch, lead):
        response = authenticated_admin.get(f"/api/leads/?branch_id={branch.pk}")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_leads_by_status(self, authenticated_admin, lead):
        response = authenticated_admin.get("/api/leads/?status=NEW")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert all(l["status"] == "NEW" for l in data)


@pytest.mark.api
@pytest.mark.django_db
class TestTicketAPI:
    def test_list_tickets(self, authenticated_admin):
        response = authenticated_admin.get("/api/tickets/")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_tickets_by_branch(self, authenticated_admin, branch):
        response = authenticated_admin.get(f"/api/tickets/?branch={branch.pk}")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestCampaignAPI:
    def test_list_campaigns(self, authenticated_admin):
        response = authenticated_admin.get("/api/campaigns/")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestFollowUpTaskAPI:
    def test_list_tasks(self, authenticated_admin):
        response = authenticated_admin.get("/api/follow-up-tasks/")
        assert response.status_code == status.HTTP_200_OK
