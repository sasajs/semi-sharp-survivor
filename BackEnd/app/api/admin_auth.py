from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials

from app.services.auth_service import authenticate_user


security = HTTPBasic()


def require_admin(
    credentials: HTTPBasicCredentials = Depends(security),
):
    user = authenticate_user(
        credentials.username,
        credentials.password,
    )

    if user is None or user.get("role") != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Valid administrator credentials are required.",
            headers={"WWW-Authenticate": "Basic"},
        )

    return user
