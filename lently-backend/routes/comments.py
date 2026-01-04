"""
Comments API Routes
Endpoints for browsing and filtering analyzed comments.
"""

from fastapi import APIRouter, Depends, Query, HTTPException, Request
from typing import Optional
from models.comment import Comment, CommentsListResponse
from middleware.auth import get_current_user
from config.firebase import get_db

router = APIRouter(prefix="/api/videos", tags=["comments"])

@router.get("/{video_id}/comments", response_model=CommentsListResponse)
async def get_video_comments(
    video_id: str,
    limit: int = Query(20, ge=1, le=100, description="Number of comments per page"),
    offset: int = Query(0, ge=0, description="Number of comments to skip"),
    category: Optional[str] = Query(None, description="Filter by category: question|praise|complaint|spam|suggestion|neutral"),
    sentiment: Optional[str] = Query(None, description="Filter by sentiment: positive|neutral|negative"),
    minToxicity: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum toxicity score"),
    search: Optional[str] = Query(None, description="Search in comment text"),
    sortBy: str = Query("publishedAt", description="Sort by: publishedAt|likeCount|sentimentScore|toxicityScore"),
    order: str = Query("desc", description="Sort order: asc|desc"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get paginated list of comments for a video with optional filters.
    
    - **video_id**: YouTube video ID
    - **limit**: Number of comments per page (1-100, default 20)
    - **offset**: Number of comments to skip for pagination
    - **category**: Filter by AI category
    - **sentiment**: Filter by sentiment label
    - **minToxicity**: Show only comments with toxicity >= this value
    - **search**: Search text in comment content (case-insensitive)
    - **sortBy**: Field to sort by
    - **order**: Sort direction (asc or desc)
    """
    db = get_db()
    
    # Verify video exists and belongs to user
    video_ref = db.collection('videos').document(video_id)
    video_doc = video_ref.get()
    
    if not video_doc.exists:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video_data = video_doc.to_dict()
    if video_data.get('userId') != current_user.get('userId'):
        raise HTTPException(status_code=403, detail="You don't have access to this video")
    
    # Build Firestore query
    query = db.collection('comments').where('videoId', '==', video_id)
    
    # Apply filters
    if category:
        query = query.where('category', '==', category)
    
    if sentiment:
        query = query.where('sentimentLabel', '==', sentiment)
    
    if minToxicity is not None:
        query = query.where('toxicityScore', '>=', minToxicity)
    
    # Apply sorting
    if order == "asc":
        query = query.order_by(sortBy, direction='ASCENDING')
    else:
        query = query.order_by(sortBy, direction='DESCENDING')
    
    # Get all results
    all_results = query.stream()
    all_comments = []
    
    for doc in all_results:
        comment_data = doc.to_dict()
        
        # Apply search filter in memory (Firestore doesn't support text search natively)
        if search:
            if search.lower() not in comment_data.get('text', '').lower():
                continue
        
        all_comments.append({
            'id': doc.id,
            **comment_data
        })
    
    total = len(all_comments)
    
    # Apply pagination
    paginated_comments = all_comments[offset:offset + limit]
    
    # Convert to Comment models
    comments = [Comment(**comment) for comment in paginated_comments]
    
    has_more = offset + limit < total
    page = offset // limit
    
    return CommentsListResponse(
        comments=comments,
        total=total,
        page=page,
        limit=limit,
        hasMore=has_more
    )


@router.get("/comments/{comment_id}", response_model=Comment)
async def get_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Get a single comment by ID.
    
    - **comment_id**: Comment document ID (typically the YouTube comment ID)
    """
    db = get_db()
    
    # Fetch comment
    comment_ref = db.collection('comments').document(comment_id)
    comment_doc = comment_ref.get()
    
    if not comment_doc.exists:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    comment_data = comment_doc.to_dict()
    video_id = comment_data.get('videoId')
    
    # Verify user has access to the video this comment belongs to
    video_ref = db.collection('videos').document(video_id)
    video_doc = video_ref.get()
    
    if not video_doc.exists:
        raise HTTPException(status_code=404, detail="Video not found")
    
    video_data = video_doc.to_dict()
    if video_data.get('userId') != current_user.get('userId'):
        raise HTTPException(status_code=403, detail="You don't have access to this comment")
    
    return Comment(
        id=comment_doc.id,
        **comment_data
    )
