import asyncio
import socket

from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_session

router = APIRouter(prefix="/health", tags=["health"])


@router.get("", status_code=204)
async def health_check(
    request: Request, session: AsyncSession = Depends(get_session)
) -> Response:
    """Simple health check with database connectivity test."""
    try:
        await asyncio.wait_for(session.execute(text("SELECT 1")), timeout=1)
    except (asyncio.TimeoutError, socket.gaierror):
        return Response(status_code=503)
    return Response(status_code=204)
