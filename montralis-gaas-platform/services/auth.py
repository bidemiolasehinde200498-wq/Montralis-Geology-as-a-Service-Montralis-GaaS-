import base64
import hashlib
import hmac
import json
import os
import time

from fastapi import Cookie, Depends, HTTPException

COOKIE_NAME = "mtrl_session"
_HEADER = '{"alg":"HS256","typ":"JWT"}'


def _b64(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _unb64(text: str) -> bytes:
    return base64.urlsafe_b64decode(text + "=" * (-len(text) % 4))


def _secret() -> bytes:
    secret = os.environ.get("MONTRALIS_JWT_SECRET", "")
    if len(secret) < 32:
        raise HTTPException(status_code=503, detail="Auth is not configured.")
    return secret.encode()


def verify_token(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    try:
        if _unb64(parts[0]).decode() != _HEADER:
            raise ValueError
        expected = hmac.new(_secret(), f"{parts[0]}.{parts[1]}".encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(expected, _unb64(parts[2])):
            raise ValueError
        claims = json.loads(_unb64(parts[1]))
    except (ValueError, json.JSONDecodeError):
        raise HTTPException(status_code=401, detail="Not authenticated.")
    if claims.get("exp", 0) <= time.time():
        raise HTTPException(status_code=401, detail="Session expired.")
    return claims


def require_session(mtrl_session: str | None = Cookie(default=None)) -> dict:
    if not mtrl_session:
        raise HTTPException(status_code=401, detail="Not authenticated.")
    return verify_token(mtrl_session)


def require_staff(claims: dict = Depends(require_session)) -> dict:
    if claims.get("portal") != "staff":
        raise HTTPException(status_code=403, detail="Staff access required.")
    return claims


def require_roles(*roles: str):
    def check(claims: dict = Depends(require_session)) -> dict:
        if claims.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Your account cannot access this resource.")
        return claims

    return check
