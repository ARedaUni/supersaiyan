"""User repository for database operations."""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_password_hash
from app.models.user import User as UserModel
from app.repositories.base import BaseRepository
from app.schemas.user import UserCreate, UserUpdate


class UserRepository(BaseRepository[UserModel, UserCreate, UserUpdate]):
    """Repository for User operations."""

    def __init__(self, session: AsyncSession):
        super().__init__(UserModel, session)

    async def get_by_username(self, username: str) -> UserModel | None:
        """Get user by username."""
        stmt = select(UserModel).where(UserModel.username == username)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> UserModel | None:
        """Get user by email."""
        stmt = select(UserModel).where(UserModel.email == email)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def exists_by_username(self, username: str) -> bool:
        """Check if user exists by username."""
        user = await self.get_by_username(username)
        return user is not None

    async def exists_by_email(self, email: str) -> bool:
        """Check if user exists by email."""
        user = await self.get_by_email(email)
        return user is not None

    async def user_exists(self, username: str, email: str) -> dict[str, bool]:
        """Check if username or email already exists."""
        username_exists = await self.exists_by_username(username)
        email_exists = await self.exists_by_email(email)

        return {
            "username_exists": username_exists,
            "email_exists": email_exists
        }

    async def get_multi_filtered(
        self,
        skip: int = 0,
        limit: int = 100,
        is_active: bool | None = None,
        is_superuser: bool | None = None
    ) -> list[UserModel]:
        """Get multiple users with optional filtering."""
        stmt = select(UserModel)

        if is_active is not None:
            stmt = stmt.where(UserModel.is_active == is_active)
        if is_superuser is not None:
            stmt = stmt.where(UserModel.is_superuser == is_superuser)

        stmt = stmt.offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def _create_db_obj(self, obj_in: UserCreate) -> UserModel:
        """Create database object from UserCreate schema."""
        hashed_password = get_password_hash(obj_in.password)

        return UserModel(
            username=obj_in.username,
            email=obj_in.email,
            full_name=obj_in.full_name,
            hashed_password=hashed_password,
            is_active=True,
            is_superuser=False,
        )

    async def _get_update_data(self, obj_in: UserUpdate) -> dict[str, Any]:
        """Get update data from UserUpdate schema."""
        update_data = obj_in.model_dump(exclude_unset=True)

        if "password" in update_data:
            hashed_password = get_password_hash(update_data["password"])
            update_data["hashed_password"] = hashed_password
            del update_data["password"]

        return update_data
