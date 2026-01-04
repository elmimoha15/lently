from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class PlanLimits(BaseModel):
    """Plan limits for a subscription tier"""
    videosPerMonth: int = Field(..., description="Maximum videos that can be analyzed per month")
    commentsPerVideo: int = Field(..., description="Maximum comments per video")
    totalComments: int = Field(..., description="Maximum total comments per month")
    aiQuestionsPerMonth: int = Field(..., description="Maximum AI questions per month")
    reSyncsPerMonth: int = Field(..., description="Maximum re-syncs per month")
    autoSync: bool = Field(..., description="Whether auto-sync is enabled")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "videosPerMonth": 20,
                "commentsPerVideo": 10000,
                "totalComments": 10000,
                "aiQuestionsPerMonth": 100,
                "reSyncsPerMonth": 20,
                "autoSync": True
            }
        }
    }


class UserUsage(BaseModel):
    """Current usage statistics for a user"""
    videosAnalyzed: int = Field(default=0, ge=0, description="Videos analyzed this month")
    commentsAnalyzed: int = Field(default=0, ge=0, description="Comments analyzed this month")
    aiQuestionsUsed: int = Field(default=0, ge=0, description="AI questions asked this month")
    reSyncsUsed: int = Field(default=0, ge=0, description="Re-syncs performed this month")
    resetDate: Optional[datetime] = Field(None, description="Date when usage counters reset")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "videosAnalyzed": 5,
                "commentsAnalyzed": 2500,
                "aiQuestionsUsed": 15,
                "reSyncsUsed": 2,
                "resetDate": "2025-02-01T00:00:00"
            }
        }
    }


class UserProfile(BaseModel):
    """
    User profile model representing a Lenlty user.
    
    This model includes subscription plan information, usage statistics,
    and account metadata.
    """
    userId: str = Field(..., description="Unique user identifier from Firebase")
    email: str = Field(..., description="User's email address")
    displayName: Optional[str] = Field(None, description="User's display name")
    plan: Literal["free", "starter", "pro", "business"] = Field(
        default="free",
        description="Current subscription plan"
    )
    planExpiry: Optional[datetime] = Field(
        None,
        description="Subscription expiration date (None for free plan)"
    )
    videosAnalyzed: int = Field(
        default=0,
        ge=0,
        description="Total number of videos analyzed by the user"
    )
    commentsAnalyzed: int = Field(
        default=0,
        ge=0,
        description="Total number of comments analyzed by the user"
    )
    createdAt: Optional[datetime] = Field(
        None,
        description="Account creation timestamp"
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "userId": "abc123xyz",
                "email": "user@example.com",
                "displayName": "John Doe",
                "plan": "pro",
                "planExpiry": "2025-12-31T23:59:59",
                "videosAnalyzed": 15,
                "commentsAnalyzed": 7500,
                "createdAt": "2024-01-15T10:30:00"
            }
        }
    }


class UserLimitsResponse(BaseModel):
    """Response model showing user's plan limits and current usage"""
    plan: str = Field(..., description="Current plan")
    limits: PlanLimits = Field(..., description="Plan limits")
    usage: UserUsage = Field(..., description="Current usage")
    remaining: dict = Field(..., description="Remaining quota for each feature")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "plan": "pro",
                "limits": {
                    "videosPerMonth": 20,
                    "commentsPerVideo": 10000,
                    "totalComments": 10000,
                    "aiQuestionsPerMonth": 100,
                    "reSyncsPerMonth": 20,
                    "autoSync": True
                },
                "usage": {
                    "videosAnalyzed": 5,
                    "commentsAnalyzed": 2500,
                    "aiQuestionsUsed": 15,
                    "reSyncsUsed": 2,
                    "resetDate": "2025-02-01T00:00:00"
                },
                "remaining": {
                    "videos": 15,
                    "aiQuestions": 85,
                    "reSyncs": 18
                }
            }
        }
    }
