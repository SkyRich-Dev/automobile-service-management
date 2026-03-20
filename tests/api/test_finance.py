import pytest
from rest_framework import status

from tests.conftest import BranchFactory, CustomerFactory
from api.models import UserRole


@pytest.mark.api
@pytest.mark.django_db
class TestFinanceDashboard:
    def test_finance_dashboard(self, authenticated_admin):
        response = authenticated_admin.get("/api/finance/dashboard/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "total_revenue" in data
        assert "total_receivables" in data
        assert "total_payables" in data
        assert "total_expenses" in data

    def test_finance_dashboard_branch_filter(self, authenticated_admin, branch):
        response = authenticated_admin.get(f"/api/finance/dashboard/?branch={branch.pk}")
        assert response.status_code == status.HTTP_200_OK

    def test_finance_dashboard_unauthenticated(self, api_client):
        response = api_client.get("/api/finance/dashboard/")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]


@pytest.mark.api
@pytest.mark.django_db
class TestAccountsAPI:
    def test_list_accounts(self, authenticated_admin):
        response = authenticated_admin.get("/api/finance/accounts/")
        assert response.status_code == status.HTTP_200_OK

    def test_seed_default_accounts(self, authenticated_admin):
        response = authenticated_admin.post("/api/finance/accounts/seed_default/")
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]

    def test_seed_default_tax_rates(self, authenticated_admin):
        response = authenticated_admin.post("/api/finance/tax-rates/seed_default/")
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]


@pytest.mark.api
@pytest.mark.django_db
class TestInvoiceAPI:
    def test_list_enhanced_invoices(self, authenticated_admin):
        response = authenticated_admin.get("/api/finance/enhanced-invoices/")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_invoices_by_branch(self, authenticated_admin, branch):
        response = authenticated_admin.get(f"/api/finance/enhanced-invoices/?branch={branch.pk}")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_invoices_by_status(self, authenticated_admin):
        response = authenticated_admin.get("/api/finance/enhanced-invoices/?status=DRAFT")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestPaymentAPI:
    def test_list_payments(self, authenticated_admin):
        response = authenticated_admin.get("/api/finance/enhanced-payments/")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestExpenseAPI:
    def test_list_expenses(self, authenticated_admin):
        response = authenticated_admin.get("/api/finance/expenses/")
        assert response.status_code == status.HTTP_200_OK

    def test_list_expense_categories(self, authenticated_admin):
        response = authenticated_admin.get("/api/finance/expense-categories/")
        assert response.status_code == status.HTTP_200_OK
