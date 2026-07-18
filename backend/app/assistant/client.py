import json

import httpx

from app.config import Settings


class AssistantError(Exception):
    def __init__(self, message: str, status_code: int = 502) -> None:
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def resolve_provider(settings: Settings) -> str | None:
    choice = settings.assistant_provider
    if choice == "openai":
        return "openai" if settings.openai_api_key else None
    if choice == "anthropic":
        return "anthropic" if settings.anthropic_api_key else None
    if settings.openai_api_key:
        return "openai"
    if settings.anthropic_api_key:
        return "anthropic"
    return None


def resolved_model(settings: Settings) -> str:
    provider = resolve_provider(settings)
    if provider == "openai":
        return settings.openai_model
    if provider == "anthropic":
        return settings.anthropic_model
    return ""


def _require_provider(settings: Settings) -> str:
    provider = resolve_provider(settings)
    if provider is None:
        raise AssistantError(
            "The assistant is not configured. Set OPENAI_API_KEY to enable it.",
            503,
        )
    return provider


async def call_tool(settings: Settings, *, system: str, user: str, tool: dict) -> dict:
    if _require_provider(settings) == "openai":
        return await _openai_tool(settings, system, user, tool)
    return await _anthropic_tool(settings, system, user, tool)


async def call_text(settings: Settings, *, system: str, user: str) -> str:
    if _require_provider(settings) == "openai":
        return await _openai_text(settings, system, user)
    return await _anthropic_text(settings, system, user)


async def call_agent(settings: Settings, *, system: str, user: str, tool: dict) -> tuple[dict | None, str]:
    """One turn where the model may either call the tool or answer with plain text."""
    if _require_provider(settings) == "openai":
        return await _openai_agent(settings, system, user, tool)
    return await _anthropic_agent(settings, system, user, tool)


async def _post(url: str, headers: dict, payload: dict, timeout: float) -> dict:
    try:
        async with httpx.AsyncClient(timeout=timeout) as http:
            response = await http.post(url, json=payload, headers=headers)
    except httpx.HTTPError as error:
        raise AssistantError("The assistant is temporarily unavailable.", 502) from error
    if response.status_code >= 400:
        raise AssistantError("The assistant could not process that request.", 502)
    return response.json()


# ---- Anthropic (Messages API) ----
async def _anthropic_call(
    settings: Settings, system: str, messages: list[dict], tools: list[dict] | None = None, tool_choice: dict | None = None
) -> dict:
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
    return await _post(f"{settings.anthropic_base_url}/messages", headers, payload, settings.anthropic_timeout_seconds)


async def _anthropic_tool(settings: Settings, system: str, user: str, tool: dict) -> dict:
    data = await _anthropic_call(
        settings,
        system,
        [{"role": "user", "content": user}],
        tools=[tool],
        tool_choice={"type": "tool", "name": tool["name"]},
    )
    result = extract_tool_use(data, tool["name"])
    if result is None:
        raise AssistantError("The assistant could not interpret that goal. Try rephrasing.", 502)
    return result


async def _anthropic_text(settings: Settings, system: str, user: str) -> str:
    data = await _anthropic_call(settings, system, [{"role": "user", "content": user}])
    return extract_text(data)


async def _anthropic_agent(settings: Settings, system: str, user: str, tool: dict) -> tuple[dict | None, str]:
    data = await _anthropic_call(
        settings,
        system,
        [{"role": "user", "content": user}],
        tools=[tool],
        tool_choice={"type": "auto"},
    )
    return extract_tool_use(data, tool["name"]), extract_text(data)


def extract_tool_use(data: dict, name: str) -> dict | None:
    for block in data.get("content", []):
        if block.get("type") == "tool_use" and block.get("name") == name:
            return block.get("input") or {}
    return None


def extract_text(data: dict) -> str:
    parts = [block.get("text", "") for block in data.get("content", []) if block.get("type") == "text"]
    return "\n".join(part for part in parts if part).strip()


# ---- OpenAI (Chat Completions API) ----
async def _openai_call(settings: Settings, messages: list[dict], tools: list[dict] | None = None, tool_choice: dict | None = None) -> dict:
    payload: dict = {"model": settings.openai_model, "messages": messages}
    if tools:
        payload["tools"] = tools
    if tool_choice:
        payload["tool_choice"] = tool_choice
    headers = {"authorization": f"Bearer {settings.openai_api_key}", "content-type": "application/json"}
    return await _post(f"{settings.openai_base_url}/chat/completions", headers, payload, settings.openai_timeout_seconds)


async def _openai_tool(settings: Settings, system: str, user: str, tool: dict) -> dict:
    function_tool = {
        "type": "function",
        "function": {
            "name": tool["name"],
            "description": tool.get("description", ""),
            "parameters": tool["input_schema"],
        },
    }
    data = await _openai_call(
        settings,
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        tools=[function_tool],
        tool_choice={"type": "function", "function": {"name": tool["name"]}},
    )
    try:
        arguments = data["choices"][0]["message"]["tool_calls"][0]["function"]["arguments"]
    except (KeyError, IndexError, TypeError) as error:
        raise AssistantError("The assistant could not interpret that goal. Try rephrasing.", 502) from error
    if isinstance(arguments, dict):
        return arguments
    try:
        return json.loads(arguments)
    except (TypeError, json.JSONDecodeError) as error:
        raise AssistantError("The assistant returned an unreadable configuration. Try rephrasing.", 502) from error


async def _openai_text(settings: Settings, system: str, user: str) -> str:
    data = await _openai_call(
        settings, [{"role": "system", "content": system}, {"role": "user", "content": user}]
    )
    try:
        return (data["choices"][0]["message"]["content"] or "").strip()
    except (KeyError, IndexError, TypeError):
        return ""


async def _openai_agent(settings: Settings, system: str, user: str, tool: dict) -> tuple[dict | None, str]:
    function_tool = {
        "type": "function",
        "function": {
            "name": tool["name"],
            "description": tool.get("description", ""),
            "parameters": tool["input_schema"],
        },
    }
    data = await _openai_call(
        settings,
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        tools=[function_tool],
        tool_choice="auto",
    )
    try:
        message = data["choices"][0]["message"]
    except (KeyError, IndexError, TypeError):
        return None, ""
    text = (message.get("content") or "").strip()
    tool_calls = message.get("tool_calls") or []
    tool_input: dict | None = None
    if tool_calls:
        arguments = tool_calls[0].get("function", {}).get("arguments")
        if isinstance(arguments, dict):
            tool_input = arguments
        elif isinstance(arguments, str):
            try:
                tool_input = json.loads(arguments)
            except (TypeError, json.JSONDecodeError):
                tool_input = None
    return tool_input, text
