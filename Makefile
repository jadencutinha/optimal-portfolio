.PHONY: backend-install backend-dev backend-test backend-lint frontend-install frontend-dev frontend-build compose-up

backend-install:
	cd backend && python3 -m venv .venv && ./.venv/bin/pip install --upgrade pip && ./.venv/bin/pip install -e ".[dev]"

backend-dev:
	cd backend && ./.venv/bin/uvicorn app.main:app --reload --port 8000

backend-test:
	cd backend && ./.venv/bin/pytest -q

backend-lint:
	cd backend && ./.venv/bin/ruff check .

frontend-install:
	cd frontend && npm install

frontend-dev:
	cd frontend && npm run dev

frontend-build:
	cd frontend && npm run build

compose-up:
	docker compose up --build
