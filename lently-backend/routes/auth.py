from fastapi import APIRouter, Depends, HTTPException, status, Request
from models.user import UserProfile
from middleware.auth import get_current_user
from middleware.rate_limiter import limiter

# Create router for authentication endpoints
router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)


@router.get(
    "/me",
    response_model=UserProfile,
    summary="Get current user profile",
    description="Returns the authenticated user's profile information including subscription plan, usage statistics, and account details.",
    responses={
        200: {
            "description": "Success - Returns user profile",
            "content": {
                "application/json": {
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
        },
        401: {
            "description": "Unauthorized - Invalid or missing Firebase token",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Authentication failed: Invalid ID token"
                    }
                }
            }
        },
        429: {
            "description": "Too Many Requests - Rate limit exceeded",
            "content": {
                "application/json": {
                    "example": {
                        "success": False,
                        "error": "Rate limit exceeded",
                        "message": "Too many requests. Please try again in 60 seconds.",
                        "retryAfter": "60 seconds"
                    }
                }
            }
        }
    }
)
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user)
) -> UserProfile:
    """
    Get the current authenticated user's profile.
    
    This endpoint requires a valid Firebase ID token in the Authorization header.
    
    **Authentication Required:**
    - Include Authorization header: `Bearer <firebase_id_token>`
    
    **Returns:**
    - User profile with subscription details and usage statistics
    
    **Example:**
    ```bash
    curl -H "Authorization: Bearer <your_firebase_token>" \\
         http://localhost:8000/api/auth/me
    ```
    """
    try:
        # Convert user dict to UserProfile model
        user_profile = UserProfile(**current_user)
        return user_profile
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve user profile: {str(e)}"
        )
