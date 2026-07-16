from pprint import pprint
from app.repositories.user_repository import get_user_entries

users = get_user_entries()

pprint(users)
