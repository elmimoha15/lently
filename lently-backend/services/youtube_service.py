"""
YouTube API Service
Handles fetching video metadata and comments from YouTube Data API.
"""

from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from google.oauth2.credentials import Credentials
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import re
from config.settings import Settings
from config.firebase import get_db


class YouTubeService:
    """Service for interacting with YouTube Data API v3"""
    
    def __init__(self, api_key: str):
        """
        Initialize YouTube service with API key.
        
        Args:
            api_key: YouTube Data API v3 key
        """
        self.api_key = api_key
        self.youtube = build('youtube', 'v3', developerKey=api_key)
        self._cache = {}  # In-memory cache for video metadata
    
    def extract_video_id(self, url: str) -> str:
        """
        Extract video ID from various YouTube URL formats.
        
        Supported formats:
        - https://www.youtube.com/watch?v=VIDEO_ID
        - https://youtu.be/VIDEO_ID
        - https://www.youtube.com/embed/VIDEO_ID
        - https://www.youtube.com/v/VIDEO_ID
        
        Args:
            url: YouTube video URL
            
        Returns:
            video_id: Extracted video ID string
            
        Raises:
            ValueError: If URL format is invalid or video ID cannot be extracted
        """
        # Pattern to match various YouTube URL formats
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)',
            r'youtube\.com\/watch\?.*v=([^&\n?#]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                video_id = match.group(1)
                # Validate video ID format (11 characters, alphanumeric + - and _)
                if re.match(r'^[a-zA-Z0-9_-]{11}$', video_id):
                    return video_id
        
        raise ValueError(f"Invalid YouTube URL format: {url}")
    
    def get_video_metadata(self, video_id: str) -> Optional[Dict]:
        """
        Fetch video metadata from YouTube Data API.
        
        Uses videos.list endpoint with parts: snippet, statistics, contentDetails.
        Results are cached in memory for 1 hour to reduce API calls.
        
        Args:
            video_id: YouTube video ID
            
        Returns:
            dict with keys:
                - title: Video title
                - description: Video description
                - thumbnailUrl: High quality thumbnail URL
                - channelName: Channel/author name
                - viewCount: Number of views
                - likeCount: Number of likes
                - commentCount: Number of comments
                - publishedAt: ISO 8601 timestamp of publication
                - duration: Video duration in ISO 8601 format (e.g., PT15M33S)
            
            Returns None if video not found or API error occurs.
        """
        # Check cache first
        cache_key = f"video_meta_{video_id}"
        if cache_key in self._cache:
            cached_data, cached_time = self._cache[cache_key]
            # Cache valid for 1 hour
            if datetime.now() - cached_time < timedelta(hours=1):
                return cached_data
        
        try:
            # Call YouTube Data API
            request = self.youtube.videos().list(
                part='snippet,statistics,contentDetails',
                id=video_id
            )
            response = request.execute()
            
            # Check if video exists
            if not response.get('items'):
                return None
            
            video = response['items'][0]
            snippet = video['snippet']
            statistics = video['statistics']
            content_details = video['contentDetails']
            
            # Build metadata dict
            metadata = {
                'youtubeVideoId': video_id,
                'title': snippet['title'],
                'description': snippet['description'],
                'thumbnailUrl': snippet['thumbnails']['high']['url'],
                'channelName': snippet['channelTitle'],
                'viewCount': int(statistics.get('viewCount', 0)),
                'likeCount': int(statistics.get('likeCount', 0)),
                'commentCount': int(statistics.get('commentCount', 0)),
                'publishedAt': snippet['publishedAt'],
                'duration': content_details['duration']
            }
            
            # Cache the result
            self._cache[cache_key] = (metadata, datetime.now())
            
            return metadata
            
        except HttpError as e:
            print(f"YouTube API error fetching metadata for {video_id}: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error fetching metadata for {video_id}: {e}")
            return None
    
    def get_comments(
        self,
        video_id: str,
        page_token: Optional[str] = None,
        max_results: int = 100,
        published_after: Optional[str] = None
    ) -> Dict:
        """
        Fetch comments for a video with pagination support.
        
        Uses commentThreads.list endpoint to fetch top-level comments.
        
        Args:
            video_id: YouTube video ID
            page_token: Token for pagination (from previous response)
            max_results: Maximum comments to fetch (1-100, default 100)
            published_after: ISO 8601 timestamp to filter comments published after this date
            
        Returns:
            dict with keys:
                - comments: List of comment dicts
                - nextPageToken: Token for next page (None if last page)
            
            Each comment dict contains:
                - id: Comment ID
                - author: Author display name
                - authorChannelId: Author's channel ID
                - text: Comment text content
                - likeCount: Number of likes
                - replyCount: Number of replies
                - publishedAt: ISO 8601 timestamp
        """
        try:
            # Build request parameters
            params = {
                'part': 'snippet',
                'videoId': video_id,
                'maxResults': min(max_results, 100),  # API max is 100
                'textFormat': 'plainText',
                'order': 'time'  # Most recent first
            }
            
            if page_token:
                params['pageToken'] = page_token
            
            # Note: YouTube API doesn't support publishedAfter filter directly
            # We'll need to filter in post-processing if needed
            
            request = self.youtube.commentThreads().list(**params)
            response = request.execute()
            
            # Parse comments
            comments = []
            for item in response.get('items', []):
                comment_data = item['snippet']['topLevelComment']['snippet']
                
                # Filter by published_after if provided
                if published_after:
                    if comment_data['publishedAt'] < published_after:
                        continue
                
                comment = {
                    'id': item['snippet']['topLevelComment']['id'],
                    'youtubeCommentId': item['snippet']['topLevelComment']['id'],
                    'author': comment_data['authorDisplayName'],
                    'authorChannelId': comment_data.get('authorChannelId', {}).get('value', ''),
                    'text': comment_data['textDisplay'],
                    'likeCount': comment_data['likeCount'],
                    'replyCount': item['snippet']['totalReplyCount'],
                    'publishedAt': comment_data['publishedAt']
                }
                comments.append(comment)
            
            return {
                'comments': comments,
                'nextPageToken': response.get('nextPageToken')
            }
            
        except HttpError as e:
            # Handle "comments disabled" error gracefully
            if e.resp.status == 403:
                error_reason = e.error_details[0].get('reason', '') if e.error_details else ''
                if 'commentsDisabled' in error_reason:
                    print(f"Comments are disabled for video {video_id}")
                    return {'comments': [], 'nextPageToken': None}
            
            print(f"YouTube API error fetching comments for {video_id}: {e}")
            return {'comments': [], 'nextPageToken': None}
            
        except Exception as e:
            print(f"Unexpected error fetching comments for {video_id}: {e}")
            return {'comments': [], 'nextPageToken': None}
    
    def get_all_comments(
        self,
        video_id: str,
        published_after: Optional[str] = None,
        max_comments: Optional[int] = None
    ) -> List[Dict]:
        """
        Fetch all comments for a video by paginating through all pages.
        
        Args:
            video_id: YouTube video ID
            published_after: ISO 8601 timestamp to filter comments (for incremental sync)
            max_comments: Optional limit on total comments to fetch
            
        Returns:
            List of all comment dicts (same structure as get_comments)
        """
        all_comments = []
        next_page_token = None
        
        while True:
            # Fetch one page of comments
            result = self.get_comments(
                video_id=video_id,
                page_token=next_page_token,
                max_results=100,
                published_after=published_after
            )
            
            # Add comments to list
            all_comments.extend(result['comments'])
            
            # Check if we've reached max_comments limit
            if max_comments and len(all_comments) >= max_comments:
                all_comments = all_comments[:max_comments]
                break
            
            # Check if there are more pages
            next_page_token = result.get('nextPageToken')
            if not next_page_token:
                break
        
        print(f"Fetched {len(all_comments)} comments for video {video_id}")
        return all_comments
    
    def get_credentials_for_user(self, user_id: str) -> Optional[Credentials]:
        """
        Get OAuth credentials for a user from Firestore.
        
        Args:
            user_id: Firebase user ID
            
        Returns:
            Credentials object if found and valid, None otherwise
        """
        db = get_db()
        token_doc = db.collection('youtube_tokens').document(user_id).get()
        
        if not token_doc.exists:
            return None
        
        token_data = token_doc.to_dict()
        
        # Create credentials object
        credentials = Credentials(
            token=token_data.get('accessToken'),
            refresh_token=token_data.get('refreshToken'),
            token_uri='https://oauth2.googleapis.com/token',
            client_id=Settings().youtube_client_id,
            client_secret=Settings().youtube_client_secret,
            scopes=token_data.get('scopes', [])
        )
        
        return credentials
    
    def refresh_access_token_if_needed(self, user_id: str) -> bool:
        """
        Check if access token is expired and refresh if needed.
        
        Args:
            user_id: Firebase user ID
            
        Returns:
            True if token is valid (or was refreshed), False if refresh failed
        """
        db = get_db()
        token_doc_ref = db.collection('youtube_tokens').document(user_id)
        token_doc = token_doc_ref.get()
        
        if not token_doc.exists:
            return False
        
        token_data = token_doc.to_dict()
        token_expiry = token_data.get('tokenExpiry')
        
        # Check if token is expired (with 5 minute buffer)
        if token_expiry:
            expiry_time = datetime.fromisoformat(token_expiry.replace('Z', '+00:00'))
            if datetime.utcnow() < expiry_time - timedelta(minutes=5):
                return True  # Token still valid
        
        # Token expired or no expiry time, try to refresh
        credentials = self.get_credentials_for_user(user_id)
        if not credentials:
            return False
        
        try:
            # Refresh the token
            from google.auth.transport.requests import Request
            credentials.refresh(Request())
            
            # Update token in Firestore
            token_doc_ref.update({
                'accessToken': credentials.token,
                'tokenExpiry': credentials.expiry.isoformat() if credentials.expiry else None,
                'lastRefreshed': datetime.utcnow().isoformat()
            })
            
            return True
        except Exception as e:
            print(f"Failed to refresh token for user {user_id}: {e}")
            return False
    
    def post_comment_reply(
        self,
        user_id: str,
        parent_comment_id: str,
        reply_text: str,
        reply_doc_id: str
    ) -> Dict[str, any]:
        """
        Post a reply to a YouTube comment using user's OAuth credentials.
        
        Args:
            user_id: Firebase user ID
            parent_comment_id: YouTube comment ID to reply to
            reply_text: Text of the reply
            reply_doc_id: Firestore document ID for tracking this reply
            
        Returns:
            Dict with 'success', 'commentId' (if posted), and 'error' (if failed)
        """
        db = get_db()
        reply_doc_ref = db.collection('replies').document(reply_doc_id)
        
        try:
            # Update status to posting
            reply_doc_ref.update({
                'status': 'posting',
                'attempts': db.field_value.increment(1)
            })
            
            # Refresh token if needed
            if not self.refresh_access_token_if_needed(user_id):
                raise Exception("Failed to refresh YouTube access token")
            
            # Get credentials
            credentials = self.get_credentials_for_user(user_id)
            if not credentials:
                raise Exception("No YouTube credentials found for user")
            
            # Build authenticated YouTube client
            youtube = build('youtube', 'v3', credentials=credentials)
            
            # Post the reply
            request = youtube.comments().insert(
                part='snippet',
                body={
                    'snippet': {
                        'parentId': parent_comment_id,
                        'textOriginal': reply_text
                    }
                }
            )
            
            response = request.execute()
            comment_id = response['id']
            
            # Update reply status to posted
            reply_doc_ref.update({
                'status': 'posted',
                'youtubeCommentId': comment_id,
                'postedAt': datetime.utcnow().isoformat(),
                'lastError': None
            })
            
            return {
                'success': True,
                'commentId': comment_id
            }
            
        except HttpError as e:
            error_msg = f"YouTube API error: {e.status_code} - {e.error_details}"
            print(f"Failed to post reply: {error_msg}")
            
            # Update reply with error
            reply_doc_ref.update({
                'status': 'failed',
                'lastError': error_msg
            })
            
            return {
                'success': False,
                'error': error_msg
            }
            
        except Exception as e:
            error_msg = str(e)
            print(f"Failed to post reply: {error_msg}")
            
            # Update reply with error
            reply_doc_ref.update({
                'status': 'failed',
                'lastError': error_msg
            })
            
            return {
                'success': False,
                'error': error_msg
            }


# Create singleton instance
settings = Settings()
youtube_service = YouTubeService(api_key=settings.youtube_api_key)
