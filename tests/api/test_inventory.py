import pytest
from rest_framework import status

from tests.conftest import BranchFactory, PartFactory


@pytest.mark.api
@pytest.mark.django_db
class TestPartReservationAPI:
    def test_list_reservations(self, authenticated_admin):
        response = authenticated_admin.get("/api/part-reservations/")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestGRNAPI:
    def test_list_grns(self, authenticated_admin):
        response = authenticated_admin.get("/api/grns/")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_grns_by_branch(self, authenticated_admin, branch):
        response = authenticated_admin.get(f"/api/grns/?branch={branch.pk}")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestStockTransferAPI:
    def test_list_transfers(self, authenticated_admin):
        response = authenticated_admin.get("/api/stock-transfers/")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_branch(self, authenticated_admin, branch):
        response = authenticated_admin.get(f"/api/stock-transfers/?branch={branch.pk}")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestPurchaseRequisitionAPI:
    def test_list_requisitions(self, authenticated_admin):
        response = authenticated_admin.get("/api/purchase-requisitions/")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_branch(self, authenticated_admin, branch):
        response = authenticated_admin.get(f"/api/purchase-requisitions/?branch={branch.pk}")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestPurchaseOrderAPI:
    def test_list_orders(self, authenticated_admin):
        response = authenticated_admin.get("/api/purchase-orders/")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_branch(self, authenticated_admin, branch):
        response = authenticated_admin.get(f"/api/purchase-orders/?branch={branch.pk}")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestInventoryAlertAPI:
    def test_list_alerts(self, authenticated_admin):
        response = authenticated_admin.get("/api/inventory-alerts/")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_branch(self, authenticated_admin, branch):
        response = authenticated_admin.get(f"/api/inventory-alerts/?branch={branch.pk}")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestSupplierPerformanceAPI:
    def test_list_performance(self, authenticated_admin):
        response = authenticated_admin.get("/api/supplier-performance/")
        assert response.status_code == status.HTTP_200_OK
