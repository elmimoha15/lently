"""
Firebase Storage Service
Handles file uploads to Firebase Cloud Storage.
"""
import os
import uuid
import re
from datetime import datetime, timedelta
from typing import Optional
from firebase_admin import storage


class StorageService:
    """Service for Firebase Storage operations."""
    
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB
    
    def __init__(self):
        """Initialize storage service."""
        self.bucket = storage.bucket()
    
    def _is_allowed_file(self, filename: str) -> bool:
        """Check if file extension is allowed."""
        return '.' in filename and \
               filename.rsplit('.', 1)[1].lower() in self.ALLOWED_EXTENSIONS
    
    def upload_avatar(self, file_content: bytes, filename: str, user_id: str) -> str:
        """
        Upload user avatar to Firebase Storage.
        
        Args:
            file_content: File bytes
            filename: Original filename
            user_id: User ID for organizing files
            
        Returns:
            Public URL of uploaded file
            
        Raises:
            ValueError: If file is invalid or too large
        """
        # Validate file type
        if not self._is_allowed_file(filename):
            raise ValueError(
                f"File type not allowed. Allowed types: {', '.join(self.ALLOWED_EXTENSIONS)}"
            )
        
        # Validate file size
        if len(file_content) > self.MAX_FILE_SIZE:
            raise ValueError(f"File too large. Maximum size: {self.MAX_FILE_SIZE / 1024 / 1024}MB")
        
        # Sanitize filename - remove special characters
        filename = re.sub(r'[^a-zA-Z0-9._-]', '_', filename)
        
        # Generate unique filename
        ext = filename.rsplit('.', 1)[1].lower()
        safe_filename = f"{user_id}_{uuid.uuid4().hex}.{ext}"
        blob_path = f"avatars/{user_id}/{safe_filename}"
        
        # Upload to Firebase Storage
        blob = self.bucket.blob(blob_path)
        blob.upload_from_string(
            file_content,
            content_type=self._get_content_type(ext)
        )
        
        # Make public and get URL
        blob.make_public()
        
        return blob.public_url
    
    def delete_avatar(self, avatar_url: str) -> bool:
        """
        Delete avatar from Firebase Storage.
        
        Args:
            avatar_url: Public URL of avatar to delete
            
        Returns:
            True if deleted successfully
        """
        try:
            # Extract blob path from URL
            # URL format: https://storage.googleapis.com/bucket-name/avatars/...
            if 'avatars/' not in avatar_url:
                return False
            
            blob_path = avatar_url.split('avatars/', 1)[1].split('?')[0]
            blob_path = f"avatars/{blob_path}"
            
            blob = self.bucket.blob(blob_path)
            blob.delete()
            return True
        except Exception as e:
            print(f"Failed to delete avatar: {e}")
            return False
    
    def _get_content_type(self, ext: str) -> str:
        """Get MIME type for file extension."""
        content_types = {
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif',
            'webp': 'image/webp'
        }
        return content_types.get(ext, 'application/octet-stream')


# Create singleton instance
storage_service = StorageService()
