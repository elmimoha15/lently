"""
Video and Comment Models
Pydantic models for video metadata and comments.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class VideoMetadata(BaseModel):
    """
    YouTube video metadata model.
    """
    youtubeVideoId: str = Field(..., description="YouTube video ID")
    title: str = Field(..., description="Video title")
    description: str = Field(..., description="Video description")
    thumbnailUrl: str = Field(..., description="Video thumbnail URL")
    channelName: str = Field(..., description="Channel/author name")
    viewCount: int = Field(..., description="Number of views")
    likeCount: int = Field(..., description="Number of likes")
    commentCount: int = Field(..., description="Number of comments")
    publishedAt: str = Field(..., description="ISO 8601 publication timestamp")
    duration: Optional[str] = Field(None, description="Video duration in ISO 8601 format")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "youtubeVideoId": "dQw4w9WgXcQ",
                "title": "Amazing Video Title",
                "description": "This is a great video about...",
                "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
                "channelName": "Awesome Channel",
                "viewCount": 1500000,
                "likeCount": 45000,
                "commentCount": 3200,
                "publishedAt": "2024-01-15T10:30:00Z",
                "duration": "PT15M33S"
            }
        }
    }


class Comment(BaseModel):
    """
    YouTube comment model.
    """
    youtubeCommentId: str = Field(..., description="YouTube comment ID")
    author: str = Field(..., description="Comment author display name")
    authorChannelId: str = Field(..., description="Author's YouTube channel ID")
    text: str = Field(..., description="Comment text content")
    likeCount: int = Field(..., description="Number of likes on the comment")
    replyCount: int = Field(..., description="Number of replies to the comment")
    publishedAt: str = Field(..., description="ISO 8601 timestamp when comment was published")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "youtubeCommentId": "UgxKREWJu8FbJvCoXYx4AaABAg",
                "author": "John Doe",
                "authorChannelId": "UCxxxxxxxxxxxxxxxxxxxxxx",
                "text": "Great video! Really enjoyed the editing.",
                "likeCount": 15,
                "replyCount": 2,
                "publishedAt": "2024-01-20T14:30:00Z"
            }
        }
    }


class ValidateVideoRequest(BaseModel):
    """
    Request model for video validation endpoint.
    """
    youtubeUrl: str = Field(..., description="YouTube video URL")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            }
        }
    }


class ValidateVideoResponse(BaseModel):
    """
    Response model for video validation endpoint.
    """
    success: bool = Field(..., description="Whether validation was successful")
    videoMetadata: Optional[VideoMetadata] = Field(None, description="Video metadata if found")
    error: Optional[str] = Field(None, description="Error message if validation failed")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "success": True,
                    "videoMetadata": {
                        "youtubeVideoId": "dQw4w9WgXcQ",
                        "title": "Amazing Video Title",
                        "description": "This is a great video about...",
                        "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
                        "channelName": "Awesome Channel",
                        "viewCount": 1500000,
                        "likeCount": 45000,
                        "commentCount": 3200,
                        "publishedAt": "2024-01-15T10:30:00Z",
                        "duration": "PT15M33S"
                    },
                    "error": None
                },
                {
                    "success": False,
                    "videoMetadata": None,
                    "error": "Video not found"
                }
            ]
        }
    }
