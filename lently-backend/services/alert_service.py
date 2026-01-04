"""
Alert Service
Automatic alert detection for comment spikes, sentiment drops, toxic comments, and viral comments.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import uuid
from config.firebase import get_db
from models.alert import AlertType, Severity


class AlertService:
    """Service for automatic alert detection and management"""
    
    def __init__(self):
        self.db = get_db()
    
    async def check_comment_spike(self, video_id: str, user_id: str) -> Optional[str]:
        """
        Checks for comment spike (5x or more than normal rate).
        
        Args:
            video_id: YouTube video ID
            user_id: User ID
            
        Returns:
            Alert ID if spike detected, None otherwise
        """
        try:
            # Get video document
            video_ref = self.db.collection('videos').document(video_id)
            video_doc = video_ref.get()
            
            if not video_doc.exists:
                return None
            
            video_data = video_doc.to_dict()
            
            # Get comments from last 7 days
            seven_days_ago = datetime.utcnow() - timedelta(days=7)
            comments_query = self.db.collection('comments') \
                .where('videoId', '==', video_id) \
                .where('publishedAt', '>=', seven_days_ago.isoformat()) \
                .stream()
            
            comments_by_hour = {}
            for comment_doc in comments_query:
                comment = comment_doc.to_dict()
                published_at = datetime.fromisoformat(comment['publishedAt'].replace('Z', '+00:00'))
                hour_key = published_at.replace(minute=0, second=0, microsecond=0)
                
                if hour_key not in comments_by_hour:
                    comments_by_hour[hour_key] = 0
                comments_by_hour[hour_key] += 1
            
            if len(comments_by_hour) < 2:
                return None  # Not enough data
            
            # Calculate normal rate (average comments per hour, excluding last hour)
            one_hour_ago = datetime.utcnow() - timedelta(hours=1)
            normal_hours = [count for hour, count in comments_by_hour.items() if hour < one_hour_ago]
            
            if not normal_hours:
                return None
            
            normal_rate = sum(normal_hours) / len(normal_hours)
            
            # Get current rate (last hour)
            current_hour = datetime.utcnow().replace(minute=0, second=0, microsecond=0)
            current_rate = comments_by_hour.get(current_hour, 0)
            
            # Check if spike detected
            if normal_rate > 0:
                multiplier = current_rate / normal_rate
                
                if multiplier >= 5:
                    # Determine severity
                    severity = Severity.CRITICAL if multiplier >= 10 else Severity.HIGH
                    
                    # Create alert
                    alert_data = {
                        'normalRate': round(normal_rate, 2),
                        'currentRate': current_rate,
                        'multiplier': round(multiplier, 2)
                    }
                    
                    title = "Comment Spike Detected"
                    message = f"Your video is receiving {multiplier:.1f}x more comments than usual ({current_rate} comments/hour vs {normal_rate:.1f} average)"
                    
                    return await self.create_alert(
                        user_id=user_id,
                        video_id=video_id,
                        alert_type=AlertType.COMMENT_SPIKE.value,
                        severity=severity.value,
                        title=title,
                        message=message,
                        data=alert_data
                    )
            
            return None
            
        except Exception as e:
            print(f"Error checking comment spike: {str(e)}")
            return None
    
    async def check_sentiment_drop(self, video_id: str, user_id: str) -> Optional[str]:
        """
        Checks for sentiment drop (30% or more).
        
        Args:
            video_id: YouTube video ID
            user_id: User ID
            
        Returns:
            Alert ID if drop detected, None otherwise
        """
        try:
            # Get comments from yesterday and today
            today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            yesterday = today - timedelta(days=1)
            
            # Get yesterday's comments
            yesterday_query = self.db.collection('comments') \
                .where('videoId', '==', video_id) \
                .where('publishedAt', '>=', yesterday.isoformat()) \
                .where('publishedAt', '<', today.isoformat()) \
                .stream()
            
            yesterday_sentiments = []
            for comment_doc in yesterday_query:
                comment = comment_doc.to_dict()
                if 'sentimentScore' in comment:
                    yesterday_sentiments.append(comment['sentimentScore'])
            
            # Get today's comments
            today_query = self.db.collection('comments') \
                .where('videoId', '==', video_id) \
                .where('publishedAt', '>=', today.isoformat()) \
                .stream()
            
            today_sentiments = []
            for comment_doc in today_query:
                comment = comment_doc.to_dict()
                if 'sentimentScore' in comment:
                    today_sentiments.append(comment['sentimentScore'])
            
            # Need sufficient data
            if len(yesterday_sentiments) < 5 or len(today_sentiments) < 5:
                return None
            
            # Calculate averages
            previous_sentiment = sum(yesterday_sentiments) / len(yesterday_sentiments)
            current_sentiment = sum(today_sentiments) / len(today_sentiments)
            
            # Calculate drop percentage
            if previous_sentiment > 0:
                drop_percentage = ((previous_sentiment - current_sentiment) / abs(previous_sentiment)) * 100
                
                if drop_percentage >= 30:
                    # Determine severity
                    severity = Severity.HIGH if drop_percentage >= 50 else Severity.MEDIUM
                    
                    # Create alert
                    alert_data = {
                        'previousSentiment': round(previous_sentiment, 3),
                        'currentSentiment': round(current_sentiment, 3),
                        'dropPercentage': round(drop_percentage, 1)
                    }
                    
                    title = "Sentiment Drop Detected"
                    message = f"Comment sentiment has dropped by {drop_percentage:.1f}% (from {previous_sentiment:.2f} to {current_sentiment:.2f})"
                    
                    return await self.create_alert(
                        user_id=user_id,
                        video_id=video_id,
                        alert_type=AlertType.SENTIMENT_DROP.value,
                        severity=severity.value,
                        title=title,
                        message=message,
                        data=alert_data
                    )
            
            return None
            
        except Exception as e:
            print(f"Error checking sentiment drop: {str(e)}")
            return None
    
    async def check_toxic_comments(self, video_id: str, user_id: str) -> Optional[str]:
        """
        Checks for toxic comments (3+ with toxicity > 0.7 in last 24 hours).
        
        Args:
            video_id: YouTube video ID
            user_id: User ID
            
        Returns:
            Alert ID if toxic comments detected, None otherwise
        """
        try:
            # Get comments from last 24 hours
            twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
            
            comments_query = self.db.collection('comments') \
                .where('videoId', '==', video_id) \
                .where('publishedAt', '>=', twenty_four_hours_ago.isoformat()) \
                .stream()
            
            toxic_comments = []
            for comment_doc in comments_query:
                comment = comment_doc.to_dict()
                toxicity_score = comment.get('toxicityScore', 0)
                
                if toxicity_score > 0.7:
                    toxic_comments.append({
                        'commentId': comment_doc.id,
                        'text': comment.get('text', '')[:100],  # First 100 chars
                        'toxicityScore': toxicity_score,
                        'author': comment.get('author', 'Unknown')
                    })
            
            # Check if threshold met
            if len(toxic_comments) >= 3:
                # Create alert
                alert_data = {
                    'toxicCount': len(toxic_comments),
                    'toxicComments': toxic_comments[:3]  # Sample of 3
                }
                
                title = "Toxic Comments Detected"
                message = f"{len(toxic_comments)} toxic comments detected in the last 24 hours"
                
                return await self.create_alert(
                    user_id=user_id,
                    video_id=video_id,
                    alert_type=AlertType.TOXIC_DETECTED.value,
                    severity=Severity.HIGH.value,
                    title=title,
                    message=message,
                    data=alert_data
                )
            
            return None
            
        except Exception as e:
            print(f"Error checking toxic comments: {str(e)}")
            return None
    
    async def check_viral_comment(self, video_id: str, user_id: str, comment: Dict[str, Any]) -> Optional[str]:
        """
        Checks if a comment is viral (500+ likes or 10x video average).
        
        Args:
            video_id: YouTube video ID
            user_id: User ID
            comment: Comment data
            
        Returns:
            Alert ID if viral, None otherwise
        """
        try:
            like_count = comment.get('likeCount', 0)
            
            # Check absolute threshold
            if like_count >= 500:
                is_viral = True
            else:
                # Check relative threshold (10x average)
                comments_query = self.db.collection('comments') \
                    .where('videoId', '==', video_id) \
                    .limit(100) \
                    .stream()
                
                like_counts = []
                for comment_doc in comments_query:
                    c = comment_doc.to_dict()
                    like_counts.append(c.get('likeCount', 0))
                
                if like_counts:
                    avg_likes = sum(like_counts) / len(like_counts)
                    is_viral = like_count >= (avg_likes * 10)
                else:
                    is_viral = False
            
            if is_viral:
                # Create alert
                alert_data = {
                    'commentText': comment.get('text', '')[:200],  # First 200 chars
                    'likeCount': like_count,
                    'author': comment.get('author', 'Unknown')
                }
                
                title = "Viral Comment Detected"
                message = f"A comment with {like_count} likes is going viral on your video"
                
                return await self.create_alert(
                    user_id=user_id,
                    video_id=video_id,
                    alert_type=AlertType.VIRAL_COMMENT.value,
                    severity=Severity.MEDIUM.value,
                    title=title,
                    message=message,
                    data=alert_data,
                    comment_id=comment.get('youtubeCommentId')
                )
            
            return None
            
        except Exception as e:
            print(f"Error checking viral comment: {str(e)}")
            return None
    
    async def create_alert(
        self, 
        user_id: str, 
        video_id: str, 
        alert_type: str, 
        severity: str, 
        title: str, 
        message: str, 
        data: Optional[Dict[str, Any]] = None,
        comment_id: Optional[str] = None
    ) -> Optional[str]:
        """
        Creates an alert in Firestore (checks for duplicates first).
        
        Args:
            user_id: User ID
            video_id: Video ID
            alert_type: Type of alert
            severity: Severity level
            title: Alert title
            message: Alert message
            data: Additional metadata
            comment_id: Optional comment ID
            
        Returns:
            Alert ID if created, None if duplicate exists
        """
        try:
            # Check for duplicate (same type and video in last 24 hours)
            twenty_four_hours_ago = datetime.utcnow() - timedelta(hours=24)
            
            existing_query = self.db.collection('alerts') \
                .where('userId', '==', user_id) \
                .where('videoId', '==', video_id) \
                .where('type', '==', alert_type) \
                .where('createdAt', '>=', twenty_four_hours_ago.isoformat()) \
                .limit(1) \
                .stream()
            
            if any(existing_query):
                print(f"Duplicate alert detected, skipping: {alert_type} for video {video_id}")
                return None
            
            # Create alert
            alert_id = str(uuid.uuid4())
            alert_data = {
                'alertId': alert_id,
                'userId': user_id,
                'videoId': video_id,
                'commentId': comment_id,
                'type': alert_type,
                'severity': severity,
                'title': title,
                'message': message,
                'data': data,
                'isRead': False,
                'createdAt': datetime.utcnow().isoformat(),
                'readAt': None
            }
            
            self.db.collection('alerts').document(alert_id).set(alert_data)
            
            # TODO: Send email notification if severity is HIGH or CRITICAL
            # This would integrate with email_service.py when implemented
            if severity in [Severity.HIGH.value, Severity.CRITICAL.value]:
                print(f"TODO: Send email notification for {severity} alert: {title}")
            
            print(f"Created alert: {alert_id} - {title}")
            return alert_id
            
        except Exception as e:
            print(f"Error creating alert: {str(e)}")
            return None
    
    async def run_alert_checks(self, video_id: str, user_id: str) -> Dict[str, Any]:
        """
        Runs all alert checks for a video.
        
        Args:
            video_id: YouTube video ID
            user_id: User ID
            
        Returns:
            Dictionary with alert IDs created
        """
        results = {
            'comment_spike': None,
            'sentiment_drop': None,
            'toxic_comments': None
        }
        
        try:
            # Run all checks
            results['comment_spike'] = await self.check_comment_spike(video_id, user_id)
            results['sentiment_drop'] = await self.check_sentiment_drop(video_id, user_id)
            results['toxic_comments'] = await self.check_toxic_comments(video_id, user_id)
            
            print(f"Alert checks completed for video {video_id}: {results}")
            
        except Exception as e:
            print(f"Error running alert checks: {str(e)}")
        
        return results


# Singleton instance
alert_service = AlertService()
