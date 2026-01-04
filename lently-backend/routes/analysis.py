from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from models.analysis import AnalysisRequest, AnalysisResponse, CommentAnalysis
from models.user import UserProfile
from middleware.auth import get_current_user
from services.gemini_service import gemini_service

router = APIRouter(prefix="/api/analysis", tags=["AI Analysis"])


@router.post(
    "/analyze-batch",
    response_model=AnalysisResponse,
    summary="Analyze comments batch",
    description="Analyze a batch of comments using Gemini AI to extract category, sentiment, and toxicity",
    responses={
        200: {
            "description": "Successfully analyzed comments",
            "content": {
                "application/json": {
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
                            }
                        ],
                        "tokensUsed": 1250,
                        "cost": 0.0000125,
                        "success": True,
                        "error": None
                    }
                }
            }
        },
        400: {"description": "Invalid request - check comment format"},
        401: {"description": "Unauthorized - invalid or missing token"},
        500: {"description": "Server error during analysis"}
    }
)
async def analyze_batch(
    request: AnalysisRequest,
    current_user: Dict = Depends(get_current_user)
) -> AnalysisResponse:
    """
    Analyze a batch of YouTube comments using Gemini AI.
    
    This endpoint:
    - Accepts up to 500 comments per request
    - Processes comments in batches of 50
    - Returns category, sentiment, and toxicity for each comment
    - Extracts questions when detected
    - Tracks token usage and cost
    
    Requires authentication via Firebase token.
    """
    try:
        # Convert Pydantic models to dicts for service
        comments_data = [comment.model_dump() for comment in request.comments]
        
        # Analyze comments using Gemini service
        analyses = gemini_service.analyze_comments_batch(comments_data)
        
        # Calculate token usage and cost (rough estimates)
        total_chars = sum(len(c.text) for c in request.comments)
        tokens_used = int(total_chars / 4)  # Rough approximation: 1 token ≈ 4 chars
        cost = (tokens_used / 1000) * 0.00001  # Gemini 1.5 Flash pricing
        
        # Check if any analyses had errors
        has_errors = any(a.get("error", False) for a in analyses)
        
        return AnalysisResponse(
            analyses=[CommentAnalysis(**analysis) for analysis in analyses],
            tokensUsed=tokens_used,
            cost=round(cost, 6),
            success=not has_errors,
            error="Some comments failed to analyze" if has_errors else None
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input: {str(e)}"
        )
    except Exception as e:
        print(f"❌ Error in analyze_batch: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to analyze comments. Please try again."
        )
