"""
Alert Models
Pydantic models for user alerts and notifications.
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal, Dict, Any
from datetime import datetime
from enum import Enum


class AlertType(str, Enum):
    """Alert type enumeration"""
    COMMENT_SPIKE = "comment_spike"
    SENTIMENT_DROP = "sentiment_drop"
    TOXIC_DETECTED = "toxic_detected"
    VIRAL_COMMENT = "viral_comment"


class Severity(str, Enum):
    """Alert severity enumeration"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class Alert(BaseModel):
    """
    Alert notification model.
    """
    alertId: str = Field(..., description="Unique alert ID")
    userId: str = Field(..., description="User ID")
    videoId: Optional[str] = Field(None, description="Related video ID")
    commentId: Optional[str] = Field(None, description="Related comment ID")
    type: str = Field(
        ..., 
        description="Alert type (comment_spike, sentiment_drop, toxic_detected, viral_comment, etc.)"
    )
    severity: str = Field(
        ..., 
        description="Alert severity level (low, medium, high, critical)"
    )
    title: str = Field(..., description="Alert title")
    message: str = Field(..., description="Alert message/description")
    data: Optional[Dict[str, Any]] = Field(default=None, description="Additional alert metadata")
    isRead: bool = Field(default=False, description="Whether alert has been read")
    createdAt: str = Field(..., description="ISO 8601 timestamp when alert was created")
    readAt: Optional[str] = Field(None, description="ISO 8601 timestamp when alert was read")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "alertId": "alert123",
                "userId": "user456",
                "videoId": "dQw4w9WgXcQ",
                "commentId": "comment789",
                "type": "toxic_detected",
                "severity": "high",
                "title": "Toxic Comments Detected",
                "message": "3 toxic comments detected in the last 24 hours",
                "data": {
                    "toxicCount": 3,
                    "toxicComments": ["comment1", "comment2", "comment3"]
                },
                "isRead": False,
                "createdAt": "2024-12-20T10:30:00Z",
                "readAt": None
            }
        }
    }


class AlertsListResponse(BaseModel):
    """Response containing list of alerts"""
    alerts: list[Alert] = Field(..., description="List of alerts")
    total: int = Field(..., description="Total number of alerts")
    unreadCount: int = Field(..., description="Number of unread alerts")


class MarkReadRequest(BaseModel):
    """Request to mark alert as read"""
    pass  # No body needed, alert ID in URL


class MarkReadResponse(BaseModel):
    """Response after marking alert as read"""
    success: bool = Field(..., description="Whether operation was successful")
    alert: Alert = Field(..., description="Updated alert")
