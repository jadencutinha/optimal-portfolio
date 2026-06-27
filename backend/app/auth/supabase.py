import jwt
from jwt import PyJWKClient

from app.config import Settings


class AuthError(Exception):
    pass


class SupabaseVerifier:
    def __init__(self, settings: Settings) -> None:
        self._secret = settings.supabase_jwt_secret
        self._jwks_client: PyJWKClient | None = None
        if settings.supabase_url:
            jwks_url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
            self._jwks_client = PyJWKClient(jwks_url)

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
