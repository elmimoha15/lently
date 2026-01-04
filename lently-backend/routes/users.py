"""
User Management Routes
Endpoints for user profile and plan limits.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Body
from middleware.auth import get_current_user
from services.user_service import user_service
from models.user import UserProfile, UserLimitsResponse
from typing import Dict, Literal
from pydantic import BaseModel


router = APIRouter(prefix="/api/users", tags=["Users"])


class UpdatePlanRequest(BaseModel):
    """Request body for updating user plan"""
    plan: Literal["free", "starter", "pro", "business"]


@router.post(
    "/init",
    response_model=UserProfile,
    summary="Initialize user profile",
    description="Creates or retrieves user profile. Call this after user signs in for the first time.",
    responses={
        200: {
            "description": "User profile created or retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "userId": "abc123",
                        "email": "user@example.com",
                        "displayName": "John Doe",
                        "plan": "free",
                        "planExpiry": None,
                        "videosAnalyzed": 0,
                        "commentsAnalyzed": 0,
                        "createdAt": "2025-12-28T15:00:00"
                    }
                }
            }
        },
        401: {"description": "Unauthorized - invalid or missing token"},
        500: {"description": "Server error"}
    }
)
async def initialize_user(current_user: Dict = Depends(get_current_user)):
    """
    Initialize or retrieve user profile.
    
    This endpoint should be called after user authentication to ensure
    their profile exists in the database. If the user doesn't exist,
    it creates a new profile with the Free plan.
    """
    try:
        user_id = current_user.get('userId')
        email = current_user.get('email')
        display_name = current_user.get('name')
        
        user_profile = user_service.get_or_create_user(user_id, email, display_name)
        
        return UserProfile(**user_profile)
        
    except Exception as e:
        print(f"❌ Error initializing user: {e}")
        raise HTTPException(status_code=500, detail="Failed to initialize user profile")


@router.get(
    "/profile",
    response_model=UserProfile,
    summary="Get user profile",
    description="Returns the authenticated user's profile with plan and usage information.",
    responses={
        200: {
            "description": "User profile retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "userId": "abc123",
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
        401: {"description": "Unauthorized - invalid or missing token"},
        404: {"description": "User profile not found"},
        500: {"description": "Server error"}
    }
)
async def get_user_profile(current_user: Dict = Depends(get_current_user)):
    """
    Get the authenticated user's profile.
    
    Returns complete user profile including subscription plan,
    usage statistics, and account metadata.
    """
    try:
        user_id = current_user.get('userId')
        
        # Get user without creating (returns None if doesn't exist)
        user_profile = user_service.get_user(user_id)
        
        if not user_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found. Please sign up first."
            )
        
        return UserProfile(**user_profile)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting user profile: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to retrieve user profile")


@router.get(
    "/limits",
    response_model=UserLimitsResponse,
    summary="Get plan limits and usage",
    description="Returns user's plan limits, current usage, and remaining quota for all features.",
    responses={
        200: {
            "description": "Limits and usage retrieved successfully",
            "content": {
                "application/json": {
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
        },
        401: {"description": "Unauthorized - invalid or missing token"},
        404: {"description": "User not found"},
        500: {"description": "Server error"}
    }
)
async def get_user_limits(current_user: Dict = Depends(get_current_user)):
    """
    Get user's plan limits and current usage.
    
    Returns:
    - Plan limits (max videos, AI questions, etc.)
    - Current usage this month
    - Remaining quota for each feature
    - Reset date (when counters reset)
    
    Useful for displaying quota information in the frontend.
    """
    try:
        user_id = current_user.get('userId')
        
        limits_data = user_service.get_user_limits_and_usage(user_id)
        
        return UserLimitsResponse(**limits_data)
        
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"❌ Error getting user limits: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve user limits")


@router.put(
    "/plan",
    response_model=UserProfile,
    summary="Update user plan",
    description="Updates the user's subscription plan. For testing, all paid plans get 1 year expiry.",
    responses={
        200: {
            "description": "Plan updated successfully",
            "content": {
                "application/json": {
                    "example": {
                        "userId": "abc123",
                        "email": "user@example.com",
                        "displayName": "John Doe",
                        "plan": "pro",
                        "planExpiry": "2026-12-28T23:59:59",
                        "videosAnalyzed": 0,
                        "commentsAnalyzed": 0,
                        "createdAt": "2025-12-28T15:00:00"
                    }
                }
            }
        },
        400: {"description": "Invalid plan"},
        401: {"description": "Unauthorized - invalid or missing token"},
        404: {"description": "User not found"},
        500: {"description": "Server error"}
    }
)
async def update_user_plan(
    plan_data: UpdatePlanRequest,
    current_user: Dict = Depends(get_current_user)
):
    """
    Update user's subscription plan.
    
    For testing purposes:
    - All paid plans get 1 year expiry
    - Plan limits are generous for testing
    - Free plan has no expiry
    
    Plans available:
    - free: 1 video/month, 3 AI questions
    - starter: 50 videos/month, 100 AI questions
    - pro: 100 videos/month, 500 AI questions (recommended for testing)
    - business: 999 videos/month, 9999 AI questions (unlimited for testing)
    """
    try:
        user_id = current_user.get('userId')
        
        updated_user = user_service.update_user_plan(user_id, plan_data.plan)
        
        return UserProfile(**updated_user)
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"❌ Error updating plan: {e}")
        raise HTTPException(status_code=500, detail="Failed to update plan")

