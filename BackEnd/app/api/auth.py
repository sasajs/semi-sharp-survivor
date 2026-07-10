from fastapi import APIRouter

from app.services.auth_service import authenticate_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login")
def login(username: str, password: str):
    user = authenticate_user(username, password)

    if user is None:
        return {
            "authenticated": False
        }

    return {
        "authenticated": True,
        "user": user
    }
