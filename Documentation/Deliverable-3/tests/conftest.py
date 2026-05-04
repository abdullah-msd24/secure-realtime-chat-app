import os
import pytest

@pytest.fixture(scope="session", autouse=True)
def set_test_env():
    """Automatically set testing mode for all tests"""
    os.environ["TESTING"] = "true"
    yield
    os.environ["TESTING"] = "false"
    