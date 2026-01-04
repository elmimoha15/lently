"""
AI Reply Models
Pydantic models for AI-generated reply suggestions.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AIReply(BaseModel):
    """
    AI-generated reply model.
    """
    replyId: str = Field(..., description="Unique reply ID")
    userId: str = Field(..., description="User ID")
    question: str = Field(..., description="Original question being answered")
    replyText: str = Field(..., description="Generated reply text")
    timesAsked: int = Field(default=1, description="Number of times this question was asked")
    videoIds: List[str] = Field(default_factory=list, description="Video IDs where question appeared")
    useCount: int = Field(default=0, description="Number of times reply was used")
    lastUsedAt: Optional[str] = Field(None, description="ISO 8601 timestamp when reply was last used")
    createdAt: str = Field(..., description="ISO 8601 timestamp when reply was created")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "replyId": "reply123",
                "userId": "user456",
                "question": "What camera do you use?",
                "replyText": "Thanks for asking! I use the Sony A7III with a 24-70mm lens. It's great for both video and photos!",
                "timesAsked": 5,
                "videoIds": ["video1", "video2"],
                "useCount": 3,
                "lastUsedAt": "2024-12-20T10:30:00Z",
                "createdAt": "2024-12-15T08:00:00Z"
            }
        }
    }


class GenerateReplyRequest(BaseModel):
    """
    Request to generate AI reply.
    """
    question: str = Field(..., description="Question to generate reply for")
    videoContext: Optional[dict] = Field(
        None, 
        description="Optional video context (channelName, videoTitle)"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "question": "What camera do you use?",
                "videoContext": {
                    "channelName": "Tech Reviews Daily",
                    "videoTitle": "Best Budget Cameras 2024"
                }
            }
        }
    }


class AIReplyResponse(BaseModel):
    """
    Response after generating reply.
    """
    replyId: str = Field(..., description="Unique reply ID")
    question: str = Field(..., description="Original question")
    replyText: str = Field(..., description="Generated reply text")
    timesAsked: int = Field(..., description="Number of times question was asked")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "replyId": "reply123",
                "question": "What camera do you use?",
                "replyText": "Thanks for asking! I use the Sony A7III with a 24-70mm lens.",
                "timesAsked": 1
            }
        }
    }


class RepliesListResponse(BaseModel):
    """
    List of user's saved replies.
    """
    replies: List[AIReply] = Field(..., description="List of replies")
    total: int = Field(..., description="Total number of replies")


class CommonQuestion(BaseModel):
    """
    Common question with count.
    """
    question: str = Field(..., description="Question text")
    count: int = Field(..., description="Number of times asked")
    commentIds: List[str] = Field(default_factory=list, description="Sample comment IDs")


class CommonQuestionsResponse(BaseModel):
    """
    List of common questions for a video.
    """
    questions: List[CommonQuestion] = Field(..., description="List of common questions")
    total: int = Field(..., description="Total questions found")
