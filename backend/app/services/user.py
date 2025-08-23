"""User service for business logic."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import convert_user_model_to_schema, verify_password
from app.models.user import User as UserModel
from app.repositories.user import UserRepository
from app.schemas.user import User, UserCreate, UserInDB, UserUpdate


class UserService:
    """Service for user-related business logic."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.repository = UserRepository(session)

    async def get_user_by_id(self, user_id: int) -> UserModel | None:
        """Get user by ID."""
        return await self.repository.get(user_id)

    async def get_user_by_username(self, username: str) -> UserInDB | None:
        """Get user by username and convert to schema."""
        user_model = await self.repository.get_by_username(username)
        if not user_model:
            return None
        return convert_user_model_to_schema(user_model)

    async def get_user_by_email(self, email: str) -> UserModel | None:
        """Get user by email."""
        return await self.repository.get_by_email(email)

    async def create_user(self, user_data: UserCreate) -> User:
        """Create a new user."""
        user_model = await self.repository.create(user_data)
        user_in_db = convert_user_model_to_schema(user_model)

        return User(
            username=user_in_db.username,
            email=user_in_db.email,
            full_name=user_in_db.full_name,
            disabled=user_in_db.disabled,
        )

    async def update_user(self, user_id: int, user_data: UserUpdate) -> UserModel | None:
        """Update an existing user."""
        user = await self.repository.get(user_id)
        if not user:
            return None

        return await self.repository.update(user, user_data)

    async def delete_user(self, user_id: int) -> bool:
        """Delete a user."""
        return await self.repository.delete(user_id)

    async def user_exists(self, username: str, email: str) -> dict[str, bool]:
        """Check if username or email already exists."""
        return await self.repository.user_exists(username, email)

    async def authenticate_user(self, username: str, password: str) -> User | None:
        """Authenticate a user with username and password."""
        user_in_db = await self.get_user_by_username(username)
        if not user_in_db:
            return None
        if not verify_password(password, user_in_db.hashed_password):
            return None
        if user_in_db.disabled:
            return None

        return User(
            username=user_in_db.username,
            email=user_in_db.email,
            full_name=user_in_db.full_name,
            disabled=user_in_db.disabled,
        )

    async def get_users(
        self,
        skip: int = 0,
        limit: int = 100,
        is_active: bool | None = None,
        is_superuser: bool | None = None,
    ) -> list[UserModel]:
        """Get multiple users with optional filtering."""
        return await self.repository.get_multi_filtered(
            skip=skip, limit=limit, is_active=is_active, is_superuser=is_superuser
        )
