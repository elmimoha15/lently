"""
Comment Models
Pydantic models for comment data, filters, and responses.
"""

from pydantic import BaseModel, Field
from typing import Optional, List


class Comment(BaseModel):
    """
    Comment model with analysis results.
    """
    id: str = Field(..., description="Comment document ID (typically youtubeCommentId)")
    videoId: str = Field(..., description="YouTube video ID this comment belongs to")
    youtubeCommentId: str = Field(..., description="YouTube comment ID")
    author: str = Field(..., description="Comment author display name")
    text: str = Field(..., description="Comment text content")
    likeCount: int = Field(..., description="Number of likes on the comment")
    publishedAt: str = Field(..., description="ISO 8601 timestamp when comment was published")
    
    # Analysis fields (may be None if not yet analyzed)
    category: Optional[str] = Field(None, description="AI category: question|praise|complaint|spam|suggestion|neutral")
    sentimentScore: Optional[float] = Field(None, description="Sentiment score from -1.0 (negative) to 1.0 (positive)")
    sentimentLabel: Optional[str] = Field(None, description="Sentiment label: positive|neutral|negative")
    toxicityScore: Optional[float] = Field(None, description="Toxicity score from 0.0 (not toxic) to 1.0 (very toxic)")
    extractedQuestion: Optional[str] = Field(None, description="Extracted question if category is 'question'")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "UgxKREWJu8FbJvCoXYx4AaABAg",
                "videoId": "dQw4w9WgXcQ",
                "youtubeCommentId": "UgxKREWJu8FbJvCoXYx4AaABAg",
                "author": "John Doe",
                "text": "Great video! How do I fix the audio quality issue you mentioned?",
                "likeCount": 15,
                "publishedAt": "2024-01-20T14:30:00Z",
                "category": "question",
                "sentimentScore": 0.7,
                "sentimentLabel": "positive",
                "toxicityScore": 0.1,
                "extractedQuestion": "How do I fix the audio quality issue?"
            }
        }
    }


class CommentFilters(BaseModel):
    """
    Query parameters for filtering comments.
    """
    category: Optional[str] = Field(None, description="Filter by category: question|praise|complaint|spam|suggestion|neutral")
    sentiment: Optional[str] = Field(None, description="Filter by sentiment: positive|neutral|negative")
    minToxicity: Optional[float] = Field(None, description="Minimum toxicity score (0.0-1.0)")
    search: Optional[str] = Field(None, description="Search text in comment content")
    sortBy: Optional[str] = Field("publishedAt", description="Sort field: publishedAt|likeCount|sentimentScore|toxicityScore")
    order: Optional[str] = Field("desc", description="Sort order: asc|desc")


class CommentsListResponse(BaseModel):
    """
    Paginated response for comment list.
    """
    comments: List[Comment] = Field(..., description="List of comments")
    total: int = Field(..., description="Total number of comments matching filters")
    page: int = Field(..., description="Current page number (0-indexed)")
    limit: int = Field(..., description="Number of items per page")
    hasMore: bool = Field(..., description="Whether there are more pages available")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "comments": [
                    {
                        "id": "comment1",
                        "videoId": "dQw4w9WgXcQ",
                        "youtubeCommentId": "comment1",
                        "author": "Jane Smith",
                        "text": "Love this tutorial!",
                        "likeCount": 25,
                        "publishedAt": "2024-01-20T12:00:00Z",
                        "category": "praise",
                        "sentimentScore": 0.9,
                        "sentimentLabel": "positive",
                        "toxicityScore": 0.0,
                        "extractedQuestion": None
                    }
                ],
                "total": 150,
                "page": 0,
                "limit": 20,
                "hasMore": True
            }
        }
    }
