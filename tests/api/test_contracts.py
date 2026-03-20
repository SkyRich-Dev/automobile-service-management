import pytest
from rest_framework import status

from tests.conftest import BranchFactory


@pytest.mark.api
@pytest.mark.django_db
class TestContractAPI:
    def test_list_contracts(self, authenticated_admin):
        response = authenticated_admin.get("/api/contracts/")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_branch(self, authenticated_admin, branch):
        response = authenticated_admin.get(f"/api/contracts/?branch={branch.pk}")
        assert response.status_code == status.HTTP_200_OK

    def test_dashboard_stats(self, authenticated_admin):
        response = authenticated_admin.get("/api/contracts/dashboard_stats/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_active" in data
        assert "expiring_soon" in data
        assert "total_contract_value" in data

    def test_dashboard_stats_branch_filter(self, authenticated_admin, branch):
        response = authenticated_admin.get(f"/api/contracts/dashboard_stats/?branch={branch.pk}")
        assert response.status_code == status.HTTP_200_OK

    def test_expiring_soon(self, authenticated_admin):
        response = authenticated_admin.get("/api/contracts/expiring_soon/")
        assert response.status_code == status.HTTP_200_OK
