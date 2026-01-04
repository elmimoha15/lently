"""
Alerts Router
Endpoints for managing user alerts and notifications.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime
from models.alert import Alert, AlertsListResponse, MarkReadResponse
from config.firebase import get_db
from middleware.auth import get_current_user

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])


@router.get(
    "",
    response_model=AlertsListResponse,
    summary="Get user alerts",
    description="Retrieve all alerts for the current user with optional filtering"
)
async def get_alerts(
    unread_only: bool = Query(False, description="Filter to only unread alerts"),
    alert_type: Optional[str] = Query(None, description="Filter by alert type"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of alerts to return"),
    current_user: dict = Depends(get_current_user)
):
    """
    Get alerts for the current user.
    
    Supports filtering by:
    - Read status (unread_only)
    - Alert type (toxic, spam, viral, question, urgent)
    - Severity (low, medium, high, critical)
    """
    db = get_db()
    user_id = current_user.get('userId')
    
    try:
        # Build query
        query = db.collection('alerts').where('userId', '==', user_id)
        
        # Apply filters
        if unread_only:
            query = query.where('isRead', '==', False)
        
        if alert_type:
            query = query.where('type', '==', alert_type)
            
        if severity:
            query = query.where('severity', '==', severity)
        
        # Order by creation date (newest first) and limit
        query = query.order_by('createdAt', direction='DESCENDING').limit(limit)
        
        # Execute query
        docs = query.stream()
        
        alerts = []
        unread_count = 0
        
        for doc in docs:
            alert_data = doc.to_dict()
            alert_data['alertId'] = doc.id
            alerts.append(Alert(**alert_data))
            
            if not alert_data.get('isRead', False):
                unread_count += 1
        
        # Get total count (without filters except user)
        total_query = db.collection('alerts').where('userId', '==', user_id)
        total = len(list(total_query.stream()))
        
        return AlertsListResponse(
            alerts=alerts,
            total=total,
            unreadCount=unread_count
        )
        
    except Exception as e:
        print(f"Error fetching alerts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch alerts")


@router.put(
    "/{alert_id}/read",
    response_model=MarkReadResponse,
    summary="Mark alert as read",
    description="Mark a specific alert as read"
)
async def mark_alert_read(
    alert_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Mark an alert as read.
    
    Updates the isRead flag and sets readAt timestamp.
    """
    db = get_db()
    user_id = current_user.get('userId')
    
    # Get alert
    alert_ref = db.collection('alerts').document(alert_id)
    alert_doc = alert_ref.get()
    
    if not alert_doc.exists:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert_data = alert_doc.to_dict()
    
    # Verify ownership
    if alert_data.get('userId') != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Update alert
    now = datetime.utcnow().isoformat() + "Z"
    alert_ref.update({
        'isRead': True,
        'readAt': now
    })
    
    # Get updated alert
    alert_data['isRead'] = True
    alert_data['readAt'] = now
    alert_data['alertId'] = alert_id
    
    return MarkReadResponse(
        success=True,
        alert=Alert(**alert_data)
    )


@router.post(
    "/mark-all-read",
    summary="Mark all alerts as read",
    description="Mark all unread alerts for the user as read"
)
async def mark_all_read(
    current_user: dict = Depends(get_current_user)
):
    """
    Mark all unread alerts as read for the current user.
    """
    db = get_db()
    user_id = current_user.get('userId')
    
    try:
        # Get all unread alerts
        query = db.collection('alerts')\
            .where('userId', '==', user_id)\
            .where('isRead', '==', False)
        
        docs = query.stream()
        
        now = datetime.utcnow().isoformat() + "Z"
        count = 0
        
        # Update each alert
        for doc in docs:
            doc.reference.update({
                'isRead': True,
                'readAt': now
            })
            count += 1
        
        return {
            "success": True,
            "markedCount": count,
            "message": f"Marked {count} alert(s) as read"
        }
        
    except Exception as e:
        print(f"Error marking alerts as read: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark alerts as read")


@router.delete(
    "/{alert_id}",
    summary="Delete alert",
    description="Delete a specific alert"
)
async def delete_alert(
    alert_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete an alert.
    """
    db = get_db()
    user_id = current_user.get('userId')
    
    # Get alert
    alert_ref = db.collection('alerts').document(alert_id)
    alert_doc = alert_ref.get()
    
    if not alert_doc.exists:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert_data = alert_doc.to_dict()
    
    # Verify ownership
    if alert_data.get('userId') != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    
    # Delete alert
    alert_ref.delete()
    
    return {
        "success": True,
        "message": "Alert deleted successfully"
    }
