"""
AI Replies Router
Endpoints for generating and managing AI reply suggestions.
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime
from models.ai_reply import (
    GenerateReplyRequest, 
    AIReplyResponse, 
    RepliesListResponse, 
    AIReply,
    CommonQuestionsResponse,
    CommonQuestion
)
from services.ai_reply_service import ai_reply_service
from config.firebase import get_db
from middleware.auth import get_current_user

router = APIRouter(prefix="/api", tags=["AI Replies"])


@router.get(
    "/ai-replies",
    response_model=RepliesListResponse,
    summary="Get user's saved replies",
    description="Retrieve all AI-generated replies saved by the user, sorted by usage count"
)
async def get_replies(
    current_user: dict = Depends(get_current_user)
):
    """
    Get all saved AI replies for the current user.
    Sorted by useCount (most used first).
    """
    user_id = current_user.get('userId')
    
    try:
        replies = ai_reply_service.get_user_replies(user_id)
        
        return RepliesListResponse(
            replies=[AIReply(**reply) for reply in replies],
            total=len(replies)
        )
        
    except Exception as e:
        print(f"Error fetching replies: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch replies")


@router.post(
    "/ai-replies/generate",
    response_model=AIReplyResponse,
    summary="Generate AI reply",
    description="Generate a professional AI reply for a question (Pro+ plan required)"
)
async def generate_reply(
    request: GenerateReplyRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Generate AI reply for a question.
    
    Requires Pro or Business plan.
    """
    user_id = current_user.get('userId')
    user_plan = current_user.get('plan', 'free')
    
    # Check plan requirement (Pro+ only)
    if user_plan not in ['pro', 'business']:
        raise HTTPException(
            status_code=403, 
            detail="AI Reply generation requires Pro or Business plan. Upgrade to unlock this feature."
        )
    
    try:
        # Generate reply using AI
        reply_text = await ai_reply_service.generate_reply(
            user_id=user_id,
            question=request.question,
            video_context=request.videoContext
        )
        
        # Extract video IDs from context if provided
        video_ids = []
        if request.videoContext and request.videoContext.get('videoId'):
            video_ids = [request.videoContext['videoId']]
        
        # Save reply to Firestore
        reply_id = await ai_reply_service.save_reply(
            user_id=user_id,
            question=request.question,
            reply_text=reply_text,
            video_ids=video_ids
        )
        
        return AIReplyResponse(
            replyId=reply_id,
            question=request.question,
            replyText=reply_text,
            timesAsked=1
        )
        
    except Exception as e:
        print(f"Error generating reply: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate reply: {str(e)}")


@router.put(
    "/ai-replies/{reply_id}",
    response_model=AIReply,
    summary="Update reply",
    description="Update the text of a saved reply"
)
async def update_reply(
    reply_id: str,
    reply_text: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Update a saved reply's text.
    """
    db = get_db()
    user_id = current_user.get('userId')
    
    # Get reply
    reply_ref = db.collection('ai_replies').document(reply_id)
    reply_doc = reply_ref.get()
    
    if not reply_doc.exists:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    reply_data = reply_doc.to_dict()
    
    # Verify ownership
    if reply_data.get('userId') != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Update reply
    reply_ref.update({
        'replyText': reply_text
    })
    
    # Get updated reply
    reply_data['replyText'] = reply_text
    reply_data['replyId'] = reply_id
    
    return AIReply(**reply_data)


@router.delete(
    "/ai-replies/{reply_id}",
    summary="Delete reply",
    description="Delete a saved reply"
)
async def delete_reply(
    reply_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete a saved reply.
    """
    db = get_db()
    user_id = current_user.get('userId')
    
    # Get reply
    reply_ref = db.collection('ai_replies').document(reply_id)
    reply_doc = reply_ref.get()
    
    if not reply_doc.exists:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    reply_data = reply_doc.to_dict()
    
    # Verify ownership
    if reply_data.get('userId') != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Delete reply
    reply_ref.delete()
    
    return {
        "success": True,
        "message": "Reply deleted successfully"
    }


@router.post(
    "/ai-replies/{reply_id}/use",
    summary="Mark reply as used",
    description="Increment use count for a reply"
)
async def mark_reply_used(
    reply_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark reply as used (increments useCount).
    """
    db = get_db()
    user_id = current_user.get('userId')
    
    # Get reply
    reply_ref = db.collection('ai_replies').document(reply_id)
    reply_doc = reply_ref.get()
    
    if not reply_doc.exists:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    reply_data = reply_doc.to_dict()
    
    # Verify ownership
    if reply_data.get('userId') != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Increment use count
    success = ai_reply_service.increment_use_count(reply_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to update reply")
    
    return {
        "success": True,
        "message": "Reply marked as used"
    }


@router.get(
    "/videos/{video_id}/common-questions",
    response_model=CommonQuestionsResponse,
    summary="Get common questions for video",
    description="Extract and group common questions from video comments"
)
async def get_common_questions(
    video_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get common questions asked in video comments.
    Returns top 10 most frequently asked questions.
    """
    db = get_db()
    user_id = current_user.get('userId')
    
    # Verify user owns video
    video_ref = db.collection('videos').document(video_id)
    video_doc = video_ref.get()
    
    if not video_doc.exists:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video_data = video_doc.to_dict()
    if video_data.get('userId') != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    try:
        questions = ai_reply_service.extract_common_questions(video_id)
        
        return CommonQuestionsResponse(
            questions=[CommonQuestion(**q) for q in questions],
            total=len(questions)
        )
        
    except Exception as e:
        print(f"Error extracting common questions: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract questions")
