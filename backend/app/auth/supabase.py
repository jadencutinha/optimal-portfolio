import ssl

import certifi
import httpx
import jwt
from jwt import PyJWKClient

from app.config import Settings


class AuthError(Exception):
    pass


class AdminError(Exception):
    pass


class SupabaseAdmin:
    """Privileged Supabase Auth operations that require the service-role key."""

    def __init__(self, settings: Settings) -> None:
        self._base_url = settings.supabase_url.rstrip("/") if settings.supabase_url else ""
        self._service_key = settings.supabase_service_role_key
        self._timeout = settings.request_timeout_seconds

    async def delete_user(self, user_id: str) -> None:
        if not self._base_url or not self._service_key:
            raise AdminError("Supabase admin is not configured (missing URL or service-role key).")
        url = f"{self._base_url}/auth/v1/admin/users/{user_id}"
        headers = {
            "apikey": self._service_key,
            "Authorization": f"Bearer {self._service_key}",
        }
        try:
            async with httpx.AsyncClient(timeout=self._timeout) as http:
                response = await http.request("DELETE", url, headers=headers)
        except httpx.HTTPError as error:
            raise AdminError("Could not reach Supabase to delete the account.") from error
        if response.status_code == 404:
            return
        if response.status_code >= 400:
            raise AdminError(f"Supabase rejected the account deletion ({response.status_code}).")


class SupabaseVerifier:
    def __init__(self, settings: Settings) -> None:
        self._secret = settings.supabase_jwt_secret
        self._jwks_client: PyJWKClient | None = None
        if settings.supabase_url:
            jwks_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
            ssl_context = ssl.create_default_context(cafile=certifi.where())
            self._jwks_client = PyJWKClient(jwks_url, ssl_context=ssl_context)

    def verify(self, token: str) -> dict:
        try:
            header = jwt.get_unverified_header(token)
        except jwt.PyJWTError as error:
            raise AuthError("Malformed token.") from error
        algorithm = header.get("alg", "")
        try:
            if algorithm == "HS256":
                if not self._secret:
                    raise AuthError("Received an HS256 token but no Supabase JWT secret is configured.")
                return jwt.decode(token, self._secret, algorithms=["HS256"], audience="authenticated")
            if self._jwks_client is None:
                raise AuthError("Supabase URL is not configured for JWKS verification.")
            signing_key = self._jwks_client.get_signing_key_from_jwt(token)
            return jwt.decode(token, signing_key.key, algorithms=[algorithm], audience="authenticated")
        except AuthError:
            raise
        except Exception as error:
            raise AuthError(str(error)) from error
