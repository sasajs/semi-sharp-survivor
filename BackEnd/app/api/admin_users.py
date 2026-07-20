from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.db import get_connection
from app.repositories import user_repository


router = APIRouter(prefix="/admin/users", tags=["Admin Users"])


class UserCreateRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)
    display_name: str = Field(min_length=1, max_length=150)
    role: str = Field(default="USER")


@router.get("/")
def list_users(db=Depends(get_connection)):
    try:
        return user_repository.get_all_users(db)
    finally:
        db.close()


@router.post("/", status_code=201)
def add_user(payload: UserCreateRequest, db=Depends(get_connection)):
    try:
        user_repository.create_user(
            db,
            payload.username.strip(),
            payload.display_name.strip(),
            payload.role.upper(),
        )
        return {"status": "success"}
    finally:
        db.close()


@router.delete("/{user_id}")
def remove_user(user_id: int, db=Depends(get_connection)):
    try:
        user_repository.delete_user_by_id(db, user_id)
        return {"status": "success"}
    finally:
        db.close()


@router.patch("/{user_id}/role")
def change_role(user_id: int, role: str, db=Depends(get_connection)):
    try:
        user_repository.update_user_role(db, user_id, role.upper())
        return {"status": "success"}
    finally:
        db.close()
