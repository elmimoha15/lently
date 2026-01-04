"""
Logger Utilities
Comprehensive logging system for errors and events.
"""

import traceback
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from config.firebase import get_db


def log_error(
    error: Exception, 
    context: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None,
    video_id: Optional[str] = None,
    service: Optional[str] = None,
    endpoint: Optional[str] = None
) -> str:
    """
    Log error to Firestore and console.
    
    Args:
        error: The exception that occurred
        context: Additional context dictionary
        user_id: User ID if available
        video_id: Video ID if available
        service: Service name where error occurred
        endpoint: API endpoint where error occurred
        
    Returns:
        error_id: Unique error ID for reference
    """
    error_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    # Build error log document
    error_log = {
        "errorId": error_id,
        "message": str(error),
        "errorType": type(error).__name__,
        "stackTrace": traceback.format_exc(),
        "timestamp": timestamp,
        "userId": user_id,
        "videoId": video_id,
        "service": service,
        "endpoint": endpoint,
        "context": context or {}
    }
    
    # Print to console for Cloud Logging
    print(f"[ERROR] {error_id}: {type(error).__name__}: {str(error)}")
    if user_id:
        print(f"  User: {user_id}")
    if video_id:
        print(f"  Video: {video_id}")
    if service:
        print(f"  Service: {service}")
    if endpoint:
        print(f"  Endpoint: {endpoint}")
    print(f"  Stack trace: {traceback.format_exc()}")
    
    # Save to Firestore
    try:
        db = get_db()
        db.collection('error_logs').document(error_id).set(error_log)
    except Exception as e:
        # If Firestore fails, at least we have console logs
        print(f"[ERROR] Failed to save error log to Firestore: {e}")
    
    return error_id


def log_event(
    event_type: str, 
    data: Dict[str, Any],
    user_id: Optional[str] = None
) -> str:
    """
    Log event to Firestore for tracking and analytics.
    
    Args:
        event_type: Type of event (user_signup, video_analyzed, etc.)
        data: Event data dictionary
        user_id: User ID if available
        
    Returns:
        event_id: Unique event ID
    """
    event_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    # Build event log document
    event_log = {
        "eventId": event_id,
        "eventType": event_type,
        "timestamp": timestamp,
        "userId": user_id,
        "data": data
    }
    
    # Print to console for Cloud Logging
    print(f"[EVENT] {event_type}: {data}")
    
    # Save to Firestore
    try:
        db = get_db()
        db.collection('event_logs').document(event_id).set(event_log)
    except Exception as e:
        print(f"[ERROR] Failed to save event log to Firestore: {e}")
    
    return event_id


def log_info(message: str, context: Optional[Dict[str, Any]] = None):
    """
    Log informational message to console.
    
    Args:
        message: Info message
        context: Additional context
    """
    timestamp = datetime.utcnow().isoformat() + "Z"
    print(f"[INFO] {timestamp}: {message}")
    if context:
        print(f"  Context: {context}")


def log_warning(message: str, context: Optional[Dict[str, Any]] = None):
    """
    Log warning message to console.
    
    Args:
        message: Warning message
        context: Additional context
    """
    timestamp = datetime.utcnow().isoformat() + "Z"
    print(f"[WARNING] {timestamp}: {message}")
    if context:
        print(f"  Context: {context}")
