from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.auth_service import authenticate_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

class UserCredentials(BaseModel):
    username: str
    password: str

@router.post("/login")
def login(credentials: UserCredentials):
    """
    Authenticates user against the backend.
    Expects JSON: {"username": "...", "password": "..."}
    """
    user = authenticate_user(credentials.username, credentials.password)

    if user is None:
        # Returning 401 for invalid credentials is standard practice
        # and satisfies the regression test requirement.
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "authenticated": True,
        "user": user
    }
