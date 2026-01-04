"""
AI Chat Models
Pydantic models for AI-powered chat and question answering.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AskAIRequest(BaseModel):
    """Request model for asking AI a question about comments"""
    videoId: str = Field(..., description="YouTube video ID to ask about")
    question: str = Field(..., description="User's question about the comments")
    conversationId: Optional[str] = Field(None, description="Optional conversation ID for context")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "videoId": "dQw4w9WgXcQ",
                "question": "What are people complaining about?",
                "conversationId": "conv_123abc"
            }
        }
    }


class AskAIResponse(BaseModel):
    """Response model for AI answer"""
    answer: str = Field(..., description="AI-generated answer to the question")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Confidence score of the answer (0.0-1.0)")
    relatedCommentIds: List[str] = Field(default_factory=list, description="IDs of comments used to generate the answer")
    remainingQuestions: int = Field(..., description="Number of AI questions remaining in user's quota")
    cached: bool = Field(False, description="Whether this answer was retrieved from cache (free!)")
    conversationId: Optional[str] = Field(None, description="Conversation ID for follow-up questions")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "answer": "Based on the comments, people are mainly complaining about audio quality issues, specifically background noise and volume inconsistencies. Several viewers mentioned they had trouble hearing parts of the video.",
                "confidence": 0.85,
                "relatedCommentIds": ["comment_1", "comment_5", "comment_12"],
                "remainingQuestions": 17,
                "cached": False,
                "conversationId": "conv_123abc"
            }
        }
    }


class ConversationTurn(BaseModel):
    """A single turn in a conversation"""
    role: str = Field(..., description="Role: 'user' or 'assistant'")
    content: str = Field(..., description="Content of the message")
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "role": "user",
                "content": "What are people complaining about?",
                "timestamp": "2024-01-20T14:30:00Z"
            }
        }
    }


class SuggestedQuestionsResponse(BaseModel):
    """Response with suggested questions"""
    suggestions: List[str] = Field(..., description="List of suggested questions")
    
    model_config = {
        "json_schema_extra": {
            "example": {
                "suggestions": [
                    "What are people complaining about?",
                    "What questions are people asking?",
                    "What do people love most?",
                    "What content should I make next?",
                    "Show me toxic comments"
                ]
            }
        }
    }
