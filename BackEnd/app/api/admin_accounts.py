from fastapi import APIRouter

router = APIRouter(prefix="/admin/accounts", tags=["admin_accounts"])

@router.get("/")
def list_accounts():
    return []

@router.post("/")
def create_account(user_id: int, account_name: str):
    return {"status": "created"}

@router.delete("/{account_id}")
def delete_account(account_id: int):
    return {"status": "deleted"}
