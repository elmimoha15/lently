"""
Profile Routes
Handles user profile management (name, timezone, avatar).
"""
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Request
from datetime import datetime
from typing import Optional

from config.firebase import get_db
from middleware.auth import get_current_user
from models.profile import ProfileUpdate, ProfileResponse, AvatarUploadResponse
from services.storage_service import storage_service

router = APIRouter(prefix="/api/users", tags=["profile"])


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(user_id: str = Depends(get_current_user)):
    """
    Get current user profile.
    """
    db = get_db()
    user_doc = db.collection('users').document(user_id).get()
    
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = user_doc.to_dict()
    
    return ProfileResponse(
        userId=user_id,
        email=user_data.get('email', ''),
        name=user_data.get('name', ''),
        avatarUrl=user_data.get('avatarUrl'),
        timezone=user_data.get('timezone', 'UTC'),
        createdAt=user_data.get('createdAt', datetime.utcnow().isoformat()),
        updatedAt=user_data.get('updatedAt', datetime.utcnow().isoformat())
    )


@router.put("/profile", response_model=ProfileResponse)
async def update_profile(
    profile_update: ProfileUpdate,
    user_id: str = Depends(get_current_user)
):
    """
    Update user profile (name, timezone).
    """
    db = get_db()
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Build update data
    update_data = {
        'updatedAt': datetime.utcnow().isoformat()
    }
    
    if profile_update.name is not None:
        update_data['name'] = profile_update.name.strip()
    
    if profile_update.timezone is not None:
        update_data['timezone'] = profile_update.timezone
    
    # Update Firestore
    user_ref.update(update_data)
    
    # Get updated user data
    updated_user = user_ref.get().to_dict()
    
    return ProfileResponse(
        userId=user_id,
        email=updated_user.get('email', ''),
        name=updated_user.get('name', ''),
        avatarUrl=updated_user.get('avatarUrl'),
        timezone=updated_user.get('timezone', 'UTC'),
        createdAt=updated_user.get('createdAt', datetime.utcnow().isoformat()),
        updatedAt=updated_user.get('updatedAt', datetime.utcnow().isoformat())
    )


@router.post("/avatar", response_model=AvatarUploadResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    """
    Upload user avatar image.
    
    Accepts: PNG, JPG, JPEG, GIF, WEBP
    Max size: 5MB
    """
    db = get_db()
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Read file content
    file_content = await file.read()
    
    # Validate file
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")
    
    try:
        # Delete old avatar if exists
        user_data = user_doc.to_dict()
        old_avatar_url = user_data.get('avatarUrl')
        if old_avatar_url:
            storage_service.delete_avatar(old_avatar_url)
        
        # Upload new avatar
        avatar_url = storage_service.upload_avatar(
            file_content=file_content,
            filename=file.filename,
            user_id=user_id
        )
        
        # Update user document
        user_ref.update({
            'avatarUrl': avatar_url,
            'updatedAt': datetime.utcnow().isoformat()
        })
        
        return AvatarUploadResponse(
            avatarUrl=avatar_url,
            message="Avatar uploaded successfully"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        print(f"Avatar upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload avatar")


@router.delete("/avatar")
async def delete_avatar(user_id: str = Depends(get_current_user)):
    """
    Delete user avatar (reset to default).
    """
    db = get_db()
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    
    user_data = user_doc.to_dict()
    avatar_url = user_data.get('avatarUrl')
    
    if avatar_url:
        # Delete from storage
        storage_service.delete_avatar(avatar_url)
        
        # Update user document
        user_ref.update({
            'avatarUrl': None,
            'updatedAt': datetime.utcnow().isoformat()
        })
    
    return {"success": True, "message": "Avatar deleted successfully"}
