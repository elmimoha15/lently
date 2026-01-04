from pydantic import BaseModel, Field
from typing import Optional


class SyncJob(BaseModel):
    jobId: str = Field(..., description="Unique job identifier")
    userId: str = Field(..., description="Owner user id")
    videoId: str = Field(..., description="YouTube video id")
    status: str = Field(..., description="queued|processing|completed|failed")
    progress: int = Field(..., description="Progress 0-100")
    totalComments: Optional[int] = Field(None, description="Total comments to process")
    processedComments: Optional[int] = Field(0, description="Number of comments processed so far")
    error: Optional[str] = Field(None, description="Error message if job failed")
    createdAt: Optional[str] = Field(None, description="ISO timestamp when job was created")
    completedAt: Optional[str] = Field(None, description="ISO timestamp when job completed")

    model_config = {
        "json_schema_extra": {
            "example": {
                "jobId": "job_abc123",
                "userId": "P4UAn0Yy9GRkeU50UZYK1nukLPn1",
                "videoId": "dQw4w9WgXcQ",
                "status": "queued",
                "progress": 0,
                "totalComments": 120,
                "processedComments": 0,
                "error": None,
                "createdAt": "2025-12-24T12:00:00Z",
                "completedAt": None
            }
        }
    }


class AnalyzeVideoRequest(BaseModel):
    youtubeUrl: str = Field(..., description="YouTube video URL to analyze")

    model_config = {
        "json_schema_extra": {
            "example": {"youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
        }
    }


class AnalyzeVideoResponse(BaseModel):
    jobId: str = Field(..., description="Sync job id")
    videoId: str = Field(..., description="YouTube video id")
    estimatedTime: Optional[int] = Field(None, description="Estimated time in seconds")

    model_config = {
        "json_schema_extra": {
            "example": {"jobId": "job_abc123", "videoId": "dQw4w9WgXcQ", "estimatedTime": 120}
        }
    }
