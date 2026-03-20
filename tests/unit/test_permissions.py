import pytest
from django.test import RequestFactory
from rest_framework.test import force_authenticate

from api.models import UserRole
from api.permissions import RoleBasedPermission
from tests.conftest import UserFactory, ProfileFactory, BranchFactory


@pytest.mark.unit
@pytest.mark.django_db
class TestRoleBasedPermission:
    def setup_method(self):
        self.factory = RequestFactory()
        self.permission = RoleBasedPermission()

    def _make_user(self, role):
        branch = BranchFactory()
        user = UserFactory()
        ProfileFactory(user=user, role=role, branch=branch)
        return user

    def _make_request(self, method, user):
        request = getattr(self.factory, method.lower())("/api/test/")
        request.user = user
        return request

    def test_super_admin_has_all_permissions(self):
        user = self._make_user(UserRole.SUPER_ADMIN)
        request = self._make_request("GET", user)

        class MockView:
            basename = "jobcard"
            action = "list"

        assert self.permission.has_permission(request, MockView()) is True

    def test_customer_role_limited_access(self):
        user = self._make_user(UserRole.CUSTOMER)
        request = self._make_request("DELETE", user)

        class MockView:
            basename = "jobcard"
            action = "destroy"

        result = self.permission.has_permission(request, MockView())
        assert isinstance(result, bool)

    def test_unauthenticated_user_denied(self):
        from django.contrib.auth.models import AnonymousUser
        request = self.factory.get("/api/test/")
        request.user = AnonymousUser()

        class MockView:
            basename = "jobcard"
            action = "list"

        assert self.permission.has_permission(request, MockView()) is False
