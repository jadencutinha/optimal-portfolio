import os
import tempfile
from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client() -> Iterator[TestClient]:
    workdir = tempfile.mkdtemp()
    os.environ["DATA_PROVIDER"] = "sample"
    os.environ["FMP_API_KEY"] = ""
    os.environ["REDIS_URL"] = ""
    os.environ["ANTHROPIC_API_KEY"] = ""
    os.environ["OPENAI_API_KEY"] = ""
    os.environ["ASSISTANT_PROVIDER"] = "auto"
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{workdir}/test.db"

    from app.config import get_settings

    get_settings.cache_clear()

    from app.main import create_app

    with TestClient(create_app()) as test_client:
        yield test_client
