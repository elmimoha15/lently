from pydantic import BaseModel, Field
from typing import List, Optional


class CommentAnalysis(BaseModel):
    """Analysis result for a single comment"""
    commentId: str = Field(..., description="ID of the analyzed comment")
    category: str = Field(
        ..., 
        description="Category: question|praise|complaint|spam|suggestion|neutral"
    )
    sentimentScore: float = Field(
        ..., 
        ge=-1.0, 
        le=1.0,
        description="Sentiment score from -1.0 (very negative) to 1.0 (very positive)"
    )
    sentimentLabel: str = Field(
        ..., 
        description="Sentiment label: positive|neutral|negative"
    )
    toxicityScore: float = Field(
        ..., 
        ge=0.0, 
        le=1.0,
        description="Toxicity score from 0.0 (not toxic) to 1.0 (very toxic)"
    )
    extractedQuestion: Optional[str] = Field(
        None, 
        description="Extracted question text if category is 'question'"
    )
    error: bool = Field(default=False, description="Whether an error occurred during analysis")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "commentId": "UgxKREhvODhROHhCoZ4AaABAg",
                "category": "question",
                "sentimentScore": 0.6,
                "sentimentLabel": "positive",
                "toxicityScore": 0.1,
                "extractedQuestion": "How do I fix the audio quality issue?",
                "error": False
            }
        }
    }


class CommentInput(BaseModel):
    """Input comment for analysis"""
    id: str = Field(..., description="Unique comment ID")
    text: str = Field(..., description="Comment text content")
    author: Optional[str] = Field(None, description="Comment author name")
    likeCount: Optional[int] = Field(None, description="Number of likes")
    publishedAt: Optional[str] = Field(None, description="Publication timestamp")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "id": "UgxKREhvODhROHhCoZ4AaABAg",
                "text": "Great video! How do I fix the audio quality issue you mentioned?",
                "author": "John Doe",
                "likeCount": 5,
                "publishedAt": "2024-12-20T10:30:00Z"
            }
        }
    }


class AnalysisRequest(BaseModel):
    """Request to analyze a batch of comments"""
    comments: List[CommentInput] = Field(
        ..., 
        description="List of comments to analyze",
        min_length=1,
        max_length=500
    )
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "comments": [
                    {
                        "id": "UgxKREhvODhROHhCoZ4AaABAg",
                        "text": "Great video! How do I fix the audio quality issue?",
                        "author": "John Doe",
                        "likeCount": 5,
                        "publishedAt": "2024-12-20T10:30:00Z"
                    },
                    {
                        "id": "UgyRKDhv88Q8hBpZ4AaABAh",
                        "text": "This is spam! Buy my product now!",
                        "author": "Spammer",
                        "likeCount": 0,
                        "publishedAt": "2024-12-20T11:00:00Z"
                    }
                ]
            }
        }
    }


class AnalysisResponse(BaseModel):
    """Response containing analysis results"""
    analyses: List[CommentAnalysis] = Field(
        ..., 
        description="Analysis results for each comment"
    )
    tokensUsed: int = Field(..., description="Total tokens used in analysis")
    cost: float = Field(..., description="Estimated cost in USD")
    success: bool = Field(..., description="Whether the analysis completed successfully")
    error: Optional[str] = Field(None, description="Error message if analysis failed")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "analyses": [
                    {
                        "commentId": "UgxKREhvODhROHhCoZ4AaABAg",
                        "category": "question",
                        "sentimentScore": 0.6,
                        "sentimentLabel": "positive",
                        "toxicityScore": 0.1,
                        "extractedQuestion": "How do I fix the audio quality issue?",
                        "error": False
                    },
                    {
                        "commentId": "UgyRKDhv88Q8hBpZ4AaABAh",
                        "category": "spam",
                        "sentimentScore": -0.3,
                        "sentimentLabel": "negative",
                        "toxicityScore": 0.4,
                        "extractedQuestion": None,
                        "error": False
                    }
                ],
                "tokensUsed": 1250,
                "cost": 0.0000125,
                "success": True,
                "error": None
            }
        }
    }
