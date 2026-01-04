"""
Videos Router
Endpoints for YouTube video validation and management.
"""

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, status, Request
from typing import List
from models.video import ValidateVideoRequest, ValidateVideoResponse, VideoMetadata
from models.user import UserProfile
from models.sync_job import AnalyzeVideoRequest, AnalyzeVideoResponse, SyncJob
from services.youtube_service import youtube_service
from services.sync_service import sync_service
from services.user_service import user_service
from utils.constants import PLAN_LIMITS
from config.firebase import get_db
from middleware.auth import get_current_user
from middleware.rate_limiter import limiter

router = APIRouter(prefix="/api/videos", tags=["Videos"])


@router.post(
    "/validate",
    response_model=ValidateVideoResponse,
    summary="Validate YouTube video",
    description="""
    Validates a YouTube video URL and fetches its metadata.
    
    This endpoint:
    - Extracts the video ID from various YouTube URL formats
    - Fetches video metadata from YouTube Data API
    - Returns video information including title, views, comments count, etc.
    - Verifies the video exists and is accessible
    
    Requires authentication via Firebase ID token.
    """,
    responses={
        200: {
            "description": "Success - video validated and metadata returned",
            "content": {
                "application/json": {
                    "example": {
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
                    }
                }
            }
        },
        400: {
            "description": "Bad Request - invalid YouTube URL format",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "videoMetadata": None,
                        "error": "Invalid YouTube URL format"
                    }
                }
            }
        },
        401: {
            "description": "Unauthorized - invalid or missing authentication token",
            "content": {
                "application/json": {
                    "example": {"detail": "Unauthorized"}
                }
            }
        },
        404: {
            "description": "Not Found - video does not exist or is not accessible",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "videoMetadata": None,
                        "error": "Video not found"
                    }
                }
            }
        }
    }
)
async def validate_video(
    request: ValidateVideoRequest,
    current_user: dict = Depends(get_current_user)
):
    """
    Validate a YouTube video URL and return its metadata.
    
    Args:
        request: ValidateVideoRequest containing youtubeUrl
        current_user: Authenticated user from Firebase token
        
    Returns:
        ValidateVideoResponse with video metadata or error
    """
    try:
        # Extract video ID from URL
        try:
            video_id = youtube_service.extract_video_id(request.youtubeUrl)
        except ValueError as e:
            return ValidateVideoResponse(
                success=False,
                videoMetadata=None,
                error=str(e)
            )
        
        # Fetch video metadata
        metadata = youtube_service.get_video_metadata(video_id)
        
        # Check if video was found
        if not metadata:
            return ValidateVideoResponse(
                success=False,
                videoMetadata=None,
                error="Video not found or is not accessible"
            )
        
        # Return success response
        return ValidateVideoResponse(
            success=True,
            videoMetadata=VideoMetadata(**metadata),
            error=None
        )
        
    except Exception as e:
        print(f"Error validating video: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while validating the video"
        )



@router.post(
    "/analyze",
    response_model=AnalyzeVideoResponse,
    summary="Queue video analysis",
    description="Create a sync job to fetch, analyze and store comments for a YouTube video.",
)
async def analyze_video(
    request_body: AnalyzeVideoRequest,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Create sync job and return job id immediately."""
    user_id = current_user.get('userId')
    
    # Check if user has reached their video analysis limit for this month
    if not user_service.check_plan_limit(user_id, 'videosPerMonth'):
        user_plan = current_user.get('plan', 'free')
        
        # Get upgrade recommendation
        upgrade_plans = {
            'free': 'Starter (5 videos/month)',
            'starter': 'Pro (20 videos/month)',
            'pro': 'Business (100 videos/month)',
            'business': 'You have reached the maximum limit'
        }
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Video analysis limit reached for {user_plan} plan. Upgrade to {upgrade_plans[user_plan]} to analyze more videos."
        )

    # Create job
    try:
        job_id, video_id = sync_service.create_sync_job(user_id, request_body.youtubeUrl)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Error creating sync job: {e}")
        raise HTTPException(status_code=500, detail="Failed to create sync job")

    # Increment user's video counter
    user_service.increment_usage(user_id, 'videosAnalyzed')

    # Queue background processing
    background_tasks.add_task(sync_service.process_sync_job, job_id)

    return AnalyzeVideoResponse(jobId=job_id, videoId=video_id, estimatedTime=120)



@router.get(
    "/sync-jobs/{job_id}",
    response_model=SyncJob,
    summary="Get sync job status",
)
async def get_sync_job(job_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    job_ref = db.collection('sync_jobs').document(job_id)
    job_snap = job_ref.get()
    
    if not job_snap.exists:
        # Job might not be written yet due to Firestore eventual consistency
        # Return a queued status instead of 404
        print(f"⚠️  Job {job_id} not found in Firestore yet, returning queued status")
        return SyncJob(
            jobId=job_id,
            userId=current_user.get('userId'),
            videoId="",
            status='queued',
            progress=0,
            totalComments=0,
            processedComments=0,
            error=None,
            createdAt="",
            completedAt=None
        )
    
    job = job_snap.to_dict()
    if job.get('userId') != current_user.get('userId'):
        raise HTTPException(status_code=403, detail="Forbidden")
    return SyncJob(**job)


@router.get(
    "",
    summary="List user's videos",
)
async def list_videos(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user_id = current_user.get('userId')
    videos = []
    try:
        docs = db.collection('videos').where('userId', '==', user_id).stream()
        for d in docs:
            v = d.to_dict()
            v['id'] = d.id  # Firestore document ID (same as youtubeVideoId)
            # Keep youtubeVideoId as videoId for frontend compatibility
            v['videoId'] = v.get('youtubeVideoId', d.id)
            videos.append(v)
    except Exception as e:
        print(f"Error listing videos: {e}")
        raise HTTPException(status_code=500, detail="Failed to list videos")

    return videos


@router.get(
    "/{video_id}",
    summary="Get video details",
)
async def get_video(video_id: str, current_user: dict = Depends(get_current_user)):
    db = get_db()
    doc = db.collection('videos').document(video_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Video not found")
    video = doc.to_dict()
    if video.get('userId') != current_user.get('userId'):
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Add the document ID and ensure videoId is set
    video['id'] = doc.id
    video['videoId'] = video.get('youtubeVideoId', doc.id)
    
    return video
