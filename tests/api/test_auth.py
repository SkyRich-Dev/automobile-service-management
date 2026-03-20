import pytest
from rest_framework import status
from rest_framework.test import APIClient

from tests.conftest import UserFactory, ProfileFactory, BranchFactory
from api.models import UserRole


@pytest.mark.api
@pytest.mark.django_db
class TestAuthEndpoints:
    def setup_method(self):
        self.client = APIClient()

    def test_login_success(self):
        branch = BranchFactory()
        user = UserFactory(username="logintest")
        ProfileFactory(user=user, role=UserRole.SUPER_ADMIN, branch=branch)
        response = self.client.post("/api/auth/login/", {
            "username": "logintest",
            "password": "TestPass@1234",
        }, format="json")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "user" in data
        assert data["user"]["username"] == "logintest"

    def test_login_wrong_password(self):
        UserFactory(username="badpw")
        response = self.client.post("/api/auth/login/", {
            "username": "badpw",
            "password": "wrongpassword",
        }, format="json")
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED]

    def test_login_nonexistent_user(self):
        response = self.client.post("/api/auth/login/", {
            "username": "doesnotexist",
            "password": "whatever",
        }, format="json")
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED]

    def test_login_missing_fields(self):
        response = self.client.post("/api/auth/login/", {}, format="json")
        assert response.status_code in [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED]

    def test_current_user_authenticated(self, admin_user):
        self.client.force_authenticate(user=admin_user)
        response = self.client.get("/api/auth/user/")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["user"]["username"] == "test_admin"

    def test_current_user_unauthenticated(self):
        response = self.client.get("/api/auth/user/")
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_200_OK]

    def test_logout(self, admin_user):
        self.client.force_authenticate(user=admin_user)
        response = self.client.post("/api/auth/logout/")
        assert response.status_code == status.HTTP_200_OK

    def test_register_new_user(self):
        response = self.client.post("/api/auth/register/", {
            "username": "newuser_reg",
            "email": "newuser@test.com",
            "password": "StrongPass@999",
            "first_name": "New",
            "last_name": "User",
        }, format="json")
        assert response.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]

    def test_register_duplicate_username(self):
        UserFactory(username="dupe_user")
        response = self.client.post("/api/auth/register/", {
            "username": "dupe_user",
            "email": "dupe@test.com",
            "password": "Pass@1234",
        }, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
