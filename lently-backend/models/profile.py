"""
Profile models for user settings.
"""
from pydantic import BaseModel, Field
from typing import Optional


class ProfileUpdate(BaseModel):
    """Request to update user profile."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    timezone: Optional[str] = Field(None, max_length=50)


class ProfileResponse(BaseModel):
    """User profile response."""
    userId: str
    email: str
    name: str
    avatarUrl: Optional[str] = None
    timezone: str = "UTC"
    createdAt: str
    updatedAt: str


class AvatarUploadResponse(BaseModel):
    """Response after avatar upload."""
    avatarUrl: str
    message: str
