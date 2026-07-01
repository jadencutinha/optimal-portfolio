import httpx

from app.config import Settings


class AssistantError(Exception):
    def __init__(self, message: str, status_code: int = 502) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


async def call_messages(
    settings: Settings,
    *,
    system: str,
    messages: list[dict],
    tools: list[dict] | None = None,
    tool_choice: dict | None = None,
) -> dict:
    if not settings.anthropic_api_key:
        raise AssistantError(
            "The assistant is not configured. Set ANTHROPIC_API_KEY to enable it.", 503
        )

    payload: dict = {
        "model": settings.anthropic_model,
        "max_tokens": settings.anthropic_max_tokens,
        "system": system,
        "messages": messages,
    }
    if tools:
        payload["tools"] = tools
    if tool_choice:
        payload["tool_choice"] = tool_choice

    headers = {
        "x-api-key": settings.anthropic_api_key,
        "anthropic-version": settings.anthropic_version,
        "content-type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=settings.anthropic_timeout_seconds) as http:
            response = await http.post(
                f"{settings.anthropic_base_url}/messages", json=payload, headers=headers
            )
    except httpx.HTTPError as error:
        raise AssistantError("The assistant is temporarily unavailable.", 502) from error

    if response.status_code >= 400:
        raise AssistantError("The assistant could not process that request.", 502)

    return response.json()


def extract_tool_use(data: dict, name: str) -> dict | None:
    for block in data.get("content", []):
        if block.get("type") == "tool_use" and block.get("name") == name:
            return block.get("input") or {}
    return None


def extract_text(data: dict) -> str:
    parts = [block.get("text", "") for block in data.get("content", []) if block.get("type") == "text"]
    return "\n".join(part for part in parts if part).strip()
