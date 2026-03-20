import pytest
from rest_framework import status

from tests.conftest import BranchFactory


@pytest.mark.api
@pytest.mark.django_db
class TestEmployeeAPI:
    def test_list_employees(self, authenticated_admin):
        response = authenticated_admin.get("/api/hrms/employees/")
        assert response.status_code == status.HTTP_200_OK

    def test_filter_by_branch(self, authenticated_admin, branch):
        response = authenticated_admin.get(f"/api/hrms/employees/?branch={branch.pk}")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestSkillAPI:
    def test_list_skills(self, authenticated_admin):
        response = authenticated_admin.get("/api/hrms/skills/")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestLeaveAPI:
    def test_list_leave_types(self, authenticated_admin):
        response = authenticated_admin.get("/api/hrms/leave-types/")
        assert response.status_code == status.HTTP_200_OK

    def test_list_leave_requests(self, authenticated_admin):
        response = authenticated_admin.get("/api/hrms/leave-requests/")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestAttendanceAPI:
    def test_list_attendance(self, authenticated_admin):
        response = authenticated_admin.get("/api/hrms/attendance/")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestPayrollAPI:
    def test_list_payroll(self, authenticated_admin):
        response = authenticated_admin.get("/api/hrms/payroll/")
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.api
@pytest.mark.django_db
class TestTrainingAPI:
    def test_list_programs(self, authenticated_admin):
        response = authenticated_admin.get("/api/hrms/training-programs/")
        assert response.status_code == status.HTTP_200_OK

    def test_list_enrollments(self, authenticated_admin):
        response = authenticated_admin.get("/api/hrms/training-enrollments/")
        assert response.status_code == status.HTTP_200_OK
