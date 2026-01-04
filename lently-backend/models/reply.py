"""
Pydantic models for reply posting feature.
Tracks replies to comments with posting status.
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ReplyJob(BaseModel):
    """Reply job model for tracking comment replies."""
    replyId: str
    userId: str
    videoId: str
    commentId: str
    replyText: str
    templateId: Optional[str] = None  # If generated from template
    status: str  # "queued", "posting", "posted", "failed"
    youtubeCommentId: Optional[str] = None  # YouTube's comment ID after posting
    attempts: int = 0
    lastError: Optional[str] = None
    createdAt: datetime
    postedAt: Optional[datetime] = None


class PostReplyRequest(BaseModel):
    """Request to post a reply to a comment."""
    replyText: str = Field(..., min_length=1, max_length=10000)
    postToYouTube: bool = True
    templateId: Optional[str] = None  # Track which template was used


class ReplyResponse(BaseModel):
    """Response after posting a reply."""
    replyId: str
    status: str
    message: str
    youtubeCommentId: Optional[str] = None
    error: Optional[str] = None
