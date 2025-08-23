"""Base repository with common CRUD operations."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Generic, TypeVar

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import Base

ModelType = TypeVar("ModelType", bound=Base)
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")


class BaseRepository(Generic[ModelType, CreateSchemaType, UpdateSchemaType], ABC):
    """Abstract base repository with common CRUD operations."""

    def __init__(self, model: type[ModelType], session: AsyncSession):
        self.model = model
        self.session = session

    async def get(self, id: Any) -> ModelType | None:
        """Get a single record by ID."""
        stmt = select(self.model).where(self.model.id == id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_multi(
        self, skip: int = 0, limit: int = 100
    ) -> list[ModelType]:
        """Get multiple records with pagination."""
        stmt = select(self.model).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, obj_in: CreateSchemaType) -> ModelType:
        """Create a new record."""
        db_obj = await self._create_db_obj(obj_in)
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def update(
        self, db_obj: ModelType, obj_in: UpdateSchemaType
    ) -> ModelType:
        """Update an existing record."""
        update_data = await self._get_update_data(obj_in)

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete(self, id: Any) -> bool:
        """Delete a record by ID."""
        stmt = delete(self.model).where(self.model.id == id)
        result = await self.session.execute(stmt)
        await self.session.commit()
        return result.rowcount > 0

    @abstractmethod
    async def _create_db_obj(self, obj_in: CreateSchemaType) -> ModelType:
        """Create database object from schema. Must be implemented by subclasses."""
        pass

    @abstractmethod
    async def _get_update_data(self, obj_in: UpdateSchemaType) -> dict[str, Any]:
        """Get update data from schema. Must be implemented by subclasses."""
        pass
