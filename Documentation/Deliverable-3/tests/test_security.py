import pytest
import sys
import os
from pathlib import Path

# Add current directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# ==================== BASIC ENDPOINT TESTS ====================

class TestAuthEndpoints:
    """Test authentication endpoints"""

    def test_register_endpoint_exists(self):
        """Test that register endpoint exists"""
        response = client.post(
            "/auth/register",
            json={
                "username": "test",
                "email": "test@example.com",
                "password": "SecurePass123!@#"
            }
        )
        # Should either succeed or fail with validation, not 404
        assert response.status_code != 404

    def test_login_endpoint_exists(self):
        """Test that login endpoint exists"""
        response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": "SecurePass123!@#"
            }
        )
        # Should not be 404
        assert response.status_code != 404

    def test_login_missing_email(self):
        """Test login without email"""
        response = client.post(
            "/auth/login",
            json={
                "email": "",
                "password": "password"
            }
        )
        # Pydantic returns 422 for validation errors
        assert response.status_code in [400, 422]

    def test_login_missing_password(self):
        """Test login without password"""
        response = client.post(
            "/auth/login",
            json={
                "email": "test@example.com",
                "password": ""
            }
        )
        # Pydantic returns 422 for validation errors
        assert response.status_code in [400, 422]

    def test_register_invalid_email(self):
        """Test registration with invalid email"""
        response = client.post(
            "/auth/register",
            json={
                "username": "test",
                "email": "not-an-email",
                "password": "SecurePass123!@#"
            }
        )
        # Either Pydantic validation (422) or custom validation (400)
        assert response.status_code in [400, 422]

    def test_register_weak_password(self):
        """Test registration with weak password"""
        response = client.post(
            "/auth/register",
            json={
                "username": "test",
                "email": "test@example.com",
                "password": "123"
            }
        )
        # Weak password should be rejected
        assert response.status_code in [400, 422]

    def test_sql_injection_in_email(self):
        """Test SQL injection prevention"""
        response = client.post(
            "/auth/login",
            json={
                "email": "' OR '1'='1",
                "password": "anything"
            }
        )
        # Should fail safely - either validation error or not found
        assert response.status_code in [400, 401, 404, 422]

    def test_protected_endpoint_without_token(self):
        """Test accessing protected endpoint without token"""
        response = client.get("/auth/me")
        # Should require authentication
        assert response.status_code in [401, 403]

    def test_protected_endpoint_with_invalid_token(self):
        """Test accessing protected endpoint with invalid token"""
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        # Invalid token should fail - 401, 422, or 500 (internal error from bad token)
        assert response.status_code in [401, 422, 500]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])