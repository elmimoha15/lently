"""
Reply Routes
Handles posting replies to YouTube comments.
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from datetime import datetime
from typing import Dict
import uuid

from config.firebase import get_db
from middleware.auth import get_current_user
from models.reply import PostReplyRequest, ReplyResponse
from services.youtube_service import youtube_service

router = APIRouter(prefix="/api/comments", tags=["replies"])


@router.post("/{comment_id}/reply", response_model=ReplyResponse)
async def post_reply(
    comment_id: str,
    reply_request: PostReplyRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user)
):
    """
    Post a reply to a YouTube comment.
    
    - Validates user owns the video
    - Creates reply document with status tracking
    - If postToYouTube=true, posts to YouTube in background
    - Returns 202 Accepted with reply ID for tracking
    """
    db = get_db()
    
    # Get the comment to find video ID
    comment_doc = db.collection('comments').document(comment_id).get()
    if not comment_doc.exists:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment_data = comment_doc.to_dict()
    video_id = comment_data.get('videoId')
    
    if not video_id:
        raise HTTPException(status_code=400, detail="Comment has no associated video")
    
    # Get video to verify ownership
    video_doc = db.collection('videos').document(video_id).get()
    if not video_doc.exists:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video_data = video_doc.to_dict()
    
    # Verify user owns this video
    if video_data.get('userId') != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only reply to comments on your own videos"
        )
    
    # If posting to YouTube, verify user has connected their YouTube account
    if reply_request.postToYouTube:
        token_doc = db.collection('youtube_tokens').document(user_id).get()
        if not token_doc.exists:
            raise HTTPException(
                status_code=403,
                detail="You must connect your YouTube account in Settings to post replies"
            )
    
    # Create reply document
    reply_id = str(uuid.uuid4())
    reply_data = {
        'replyId': reply_id,
        'userId': user_id,
        'videoId': video_id,
        'commentId': comment_id,
        'replyText': reply_request.replyText,
        'templateId': reply_request.templateId,
        'status': 'queued' if reply_request.postToYouTube else 'draft',
        'youtubeCommentId': None,
        'attempts': 0,
        'lastError': None,
        'createdAt': datetime.utcnow().isoformat(),
        'postedAt': None
    }
    
    db.collection('replies').document(reply_id).set(reply_data)
    
    # If template was used, increment its usage count
    if reply_request.templateId:
        template_ref = db.collection('ai_replies').document(reply_request.templateId)
        template_doc = template_ref.get()
        
        if template_doc.exists:
            template_ref.update({
                'useCount': db.field_value.increment(1),
                'lastUsedAt': datetime.utcnow().isoformat()
            })
    
    # If posting to YouTube, queue background task
    if reply_request.postToYouTube:
        # Get YouTube comment ID from comment_data
        youtube_comment_id = comment_data.get('commentId')
        if not youtube_comment_id:
            raise HTTPException(
                status_code=400,
                detail="Comment has no YouTube ID"
            )
        
        # Queue posting task
        background_tasks.add_task(
            youtube_service.post_comment_reply,
            user_id=user_id,
            parent_comment_id=youtube_comment_id,
            reply_text=reply_request.replyText,
            reply_doc_id=reply_id
        )
        
        return ReplyResponse(
            replyId=reply_id,
            status='queued',
            message='Reply queued for posting to YouTube'
        )
    else:
        return ReplyResponse(
            replyId=reply_id,
            status='draft',
            message='Reply saved as draft'
        )


@router.get("/{comment_id}/replies", response_model=Dict)
async def get_replies(
    comment_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get all replies for a comment.
    Returns both posted and draft replies.
    """
    db = get_db()
    
    # Get comment to verify access
    comment_doc = db.collection('comments').document(comment_id).get()
    if not comment_doc.exists:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment_data = comment_doc.to_dict()
    video_id = comment_data.get('videoId')
    
    # Verify user owns the video
    video_doc = db.collection('videos').document(video_id).get()
    if not video_doc.exists or video_doc.to_dict().get('userId') != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only view replies on your own videos"
        )
    
    # Get all replies for this comment
    replies_query = db.collection('replies').where(
        'commentId', '==', comment_id
    ).order_by('createdAt', direction='DESCENDING')
    
    replies = []
    for doc in replies_query.stream():
        reply_data = doc.to_dict()
        replies.append(reply_data)
    
    return {
        'commentId': comment_id,
        'replies': replies,
        'count': len(replies)
    }


@router.get("/reply/{reply_id}", response_model=Dict)
async def get_reply_status(
    reply_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Get the status of a specific reply.
    Useful for checking if a queued reply has been posted.
    """
    db = get_db()
    
    reply_doc = db.collection('replies').document(reply_id).get()
    if not reply_doc.exists:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    reply_data = reply_doc.to_dict()
    
    # Verify user owns this reply
    if reply_data.get('userId') != user_id:
        raise HTTPException(
            status_code=403,
            detail="You can only view your own replies"
        )
    
    return reply_data
