"""
YouTube OAuth Router
Handles YouTube OAuth flow for posting comment replies.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import RedirectResponse
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from config.settings import settings
from config.firebase import get_db
from middleware.auth import get_current_user
from datetime import datetime
import secrets

router = APIRouter(prefix="/api/youtube", tags=["YouTube OAuth"])

# OAuth scopes needed for posting replies
SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl']


def get_oauth_flow():
    """Create OAuth flow instance"""
    if not all([settings.youtube_client_id, settings.youtube_client_secret, settings.youtube_redirect_uri]):
        raise HTTPException(
            status_code=500,
            detail="YouTube OAuth is not configured. Please set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REDIRECT_URI"
        )
    
    return Flow.from_client_config(
        {
            "web": {
                "client_id": settings.youtube_client_id,
                "client_secret": settings.youtube_client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [settings.youtube_redirect_uri]
            }
        },
        scopes=SCOPES,
        redirect_uri=settings.youtube_redirect_uri
    )


@router.get("/connect")
async def connect_youtube(current_user: dict = Depends(get_current_user)):
    """
    Start YouTube OAuth flow.
    Generates authorization URL and redirects user to Google consent screen.
    """
    try:
        flow = get_oauth_flow()
        
        # Generate state token for security
        state = secrets.token_urlsafe(32)
        
        # Store state in Firestore temporarily (expires in 10 minutes)
        db = get_db()
        user_id = current_user.get('userId')
        db.collection('oauth_states').document(state).set({
            'userId': user_id,
            'createdAt': datetime.utcnow().isoformat(),
            'expiresAt': datetime.utcnow().timestamp() + 600  # 10 minutes
        })
        
        # Generate authorization URL
        authorization_url, _ = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=state,
            prompt='consent'  # Force consent to get refresh token
        )
        
        return {
            "authorizationUrl": authorization_url,
            "state": state
        }
        
    except Exception as e:
        print(f"Error starting OAuth flow: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start OAuth flow: {str(e)}")


@router.get("/callback")
async def oauth_callback(code: str, state: str):
    """
    Handle OAuth callback from Google.
    Exchanges authorization code for access and refresh tokens.
    """
    try:
        db = get_db()
        
        # Verify state token
        state_doc = db.collection('oauth_states').document(state).get()
        if not state_doc.exists:
            raise HTTPException(status_code=400, detail="Invalid or expired state token")
        
        state_data = state_doc.to_dict()
        user_id = state_data.get('userId')
        
        # Check expiration
        if datetime.utcnow().timestamp() > state_data.get('expiresAt', 0):
            db.collection('oauth_states').document(state).delete()
            raise HTTPException(status_code=400, detail="State token expired")
        
        # Exchange code for tokens
        flow = get_oauth_flow()
        flow.fetch_token(code=code)
        
        credentials = flow.credentials
        
        # Get YouTube channel info
        youtube = build('youtube', 'v3', credentials=credentials)
        channel_response = youtube.channels().list(
            part='snippet',
            mine=True
        ).execute()
        
        if not channel_response.get('items'):
            raise HTTPException(status_code=400, detail="No YouTube channel found for this account")
        
        channel = channel_response['items'][0]
        channel_id = channel['id']
        channel_title = channel['snippet']['title']
        
        # Store tokens in Firestore (encrypted in production!)
        token_data = {
            'userId': user_id,
            'channelId': channel_id,
            'channelTitle': channel_title,
            'accessToken': credentials.token,
            'refreshToken': credentials.refresh_token,
            'tokenExpiry': credentials.expiry.isoformat() if credentials.expiry else None,
            'scopes': SCOPES,
            'connectedAt': datetime.utcnow().isoformat(),
            'lastRefreshed': datetime.utcnow().isoformat()
        }
        
        db.collection('youtube_tokens').document(user_id).set(token_data)
        
        # Delete state token
        db.collection('oauth_states').document(state).delete()
        
        # Redirect to frontend settings page
        redirect_url = f"{settings.frontend_url}/dashboard/settings?youtube_connected=true"
        return RedirectResponse(url=redirect_url)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in OAuth callback: {e}")
        # Redirect to frontend with error
        redirect_url = f"{settings.frontend_url}/dashboard/settings?youtube_error=true"
        return RedirectResponse(url=redirect_url)


@router.post("/disconnect")
async def disconnect_youtube(current_user: dict = Depends(get_current_user)):
    """
    Disconnect YouTube account (revoke tokens).
    """
    try:
        db = get_db()
        user_id = current_user.get('userId')
        
        # Get token document
        token_doc = db.collection('youtube_tokens').document(user_id).get()
        
        if not token_doc.exists:
            return {"success": True, "message": "No YouTube account connected"}
        
        # TODO: Revoke tokens with Google (optional but recommended)
        # This requires making a call to Google's revoke endpoint
        
        # Delete token document
        db.collection('youtube_tokens').document(user_id).delete()
        
        return {
            "success": True,
            "message": "YouTube account disconnected successfully"
        }
        
    except Exception as e:
        print(f"Error disconnecting YouTube: {e}")
        raise HTTPException(status_code=500, detail="Failed to disconnect YouTube account")


@router.get("/status")
async def get_connection_status(current_user: dict = Depends(get_current_user)):
    """
    Check if user has connected their YouTube account.
    """
    try:
        db = get_db()
        user_id = current_user.get('userId')
        
        token_doc = db.collection('youtube_tokens').document(user_id).get()
        
        if not token_doc.exists:
            return {
                "connected": False,
                "channelId": None,
                "channelTitle": None
            }
        
        token_data = token_doc.to_dict()
        
        return {
            "connected": True,
            "channelId": token_data.get('channelId'),
            "channelTitle": token_data.get('channelTitle'),
            "connectedAt": token_data.get('connectedAt')
        }
        
    except Exception as e:
        print(f"Error checking connection status: {e}")
        raise HTTPException(status_code=500, detail="Failed to check connection status")
