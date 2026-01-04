"""
User Service
Manages user profiles, plan limits, and usage tracking.
"""

from config.firebase import get_db
from utils.constants import PLAN_LIMITS
from google.cloud import firestore
from datetime import datetime, timedelta
from typing import Optional, Dict


class UserService:
    """Service for user management and plan limit enforcement"""
    
    def __init__(self):
        self.db = get_db()
    
    def user_exists(self, user_id: str) -> bool:
        """
        Check if a user exists in Firestore.
        
        Args:
            user_id: Firebase user ID
            
        Returns:
            True if user exists, False otherwise
        """
        try:
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()
            return user_doc.exists
        except Exception as e:
            print(f"❌ Error checking user existence: {e}")
            return False
    
    def get_user(self, user_id: str) -> Optional[dict]:
        """
        Get user from Firestore without creating.
        
        Args:
            user_id: Firebase user ID
            
        Returns:
            User profile dict or None if doesn't exist
        """
        try:
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                return user_doc.to_dict()
            return None
            
        except Exception as e:
            print(f"❌ Error getting user: {e}")
            return None
    
    def get_or_create_user(self, user_id: str, email: str, display_name: Optional[str] = None) -> dict:
        """
        Get user from Firestore or create if doesn't exist.
        
        Args:
            user_id: Firebase user ID
            email: User email
            display_name: Optional display name
            
        Returns:
            User profile dict
        """
        try:
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if user_doc.exists:
                return user_doc.to_dict()
            
            # Create new user with free plan
            now = datetime.utcnow()
            next_month = (now.replace(day=1) + timedelta(days=32)).replace(day=1)
            
            user_data = {
                'userId': user_id,
                'email': email,
                'displayName': display_name,
                'plan': 'free',
                'planExpiry': None,
                'videosAnalyzed': 0,
                'commentsAnalyzed': 0,
                'aiQuestionsUsed': 0,
                'reSyncsUsed': 0,
                'resetDate': next_month,
                'createdAt': now  # Use actual datetime instead of SERVER_TIMESTAMP
            }
            
            user_ref.set(user_data)
            print(f"✅ Created new user: {email} with Free plan")
            
            return user_data
            
        except Exception as e:
            print(f"❌ Error in get_or_create_user: {e}")
            raise
    
    def check_plan_limit(self, user_id: str, limit_type: str) -> bool:
        """
        Check if user is within their plan limit.
        
        Args:
            user_id: User ID
            limit_type: Type of limit to check (videosPerMonth, aiQuestionsPerMonth, etc.)
            
        Returns:
            True if within limit, False if exceeded
        """
        try:
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                return False
            
            user_data = user_doc.to_dict()
            plan = user_data.get('plan', 'free')
            
            # Check if monthly reset is needed
            reset_date = user_data.get('resetDate')
            if reset_date and isinstance(reset_date, datetime):
                # Make both datetimes timezone-aware for comparison
                now = datetime.utcnow()
                # If reset_date is timezone-aware, make now timezone-aware too
                if reset_date.tzinfo is not None:
                    from datetime import timezone
                    now = now.replace(tzinfo=timezone.utc)
                
                if now >= reset_date:
                    self.reset_monthly_usage(user_id)
                    user_data = user_ref.get().to_dict()  # Refresh data
            
            # Get plan limits
            plan_limits = PLAN_LIMITS.get(plan, PLAN_LIMITS['free'])
            
            # Map limit_type to usage field
            usage_map = {
                'videosPerMonth': 'videosAnalyzed',
                'aiQuestionsPerMonth': 'aiQuestionsUsed',
                'reSyncsPerMonth': 'reSyncsUsed'
            }
            
            usage_field = usage_map.get(limit_type)
            if not usage_field:
                return True  # Unknown limit type, allow by default
            
            current_usage = user_data.get(usage_field, 0)
            max_allowed = plan_limits.get(limit_type, 0)
            
            return current_usage < max_allowed
            
        except Exception as e:
            print(f"❌ Error checking plan limit: {e}")
            return False
    
    def increment_usage(self, user_id: str, usage_type: str) -> None:
        """
        Increment a usage counter for the user.
        
        Args:
            user_id: User ID
            usage_type: Type of usage (videosAnalyzed, aiQuestionsUsed, etc.)
        """
        try:
            user_ref = self.db.collection('users').document(user_id)
            user_ref.update({
                usage_type: firestore.Increment(1)
            })
            print(f"📊 Incremented {usage_type} for user {user_id}")
            
        except Exception as e:
            print(f"❌ Error incrementing usage: {e}")
    
    def reset_monthly_usage(self, user_id: str) -> None:
        """
        Reset monthly usage counters to 0.
        
        Args:
            user_id: User ID
        """
        try:
            now = datetime.utcnow()
            next_month = (now.replace(day=1) + timedelta(days=32)).replace(day=1)
            
            user_ref = self.db.collection('users').document(user_id)
            user_ref.update({
                'videosAnalyzed': 0,
                'commentsAnalyzed': 0,
                'aiQuestionsUsed': 0,
                'reSyncsUsed': 0,
                'resetDate': next_month
            })
            
            print(f"🔄 Reset monthly usage for user {user_id}")
            
        except Exception as e:
            print(f"❌ Error resetting usage: {e}")
    
    def get_user_limits_and_usage(self, user_id: str) -> dict:
        """
        Get user's plan limits and current usage.
        
        Args:
            user_id: User ID
            
        Returns:
            Dict with plan, limits, usage, and remaining quota
        """
        try:
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                raise ValueError("User not found")
            
            user_data = user_doc.to_dict()
            plan = user_data.get('plan', 'free')
            
            # Get plan limits
            limits = PLAN_LIMITS.get(plan, PLAN_LIMITS['free'])
            
            # Get current usage
            usage = {
                'videosAnalyzed': user_data.get('videosAnalyzed', 0),
                'commentsAnalyzed': user_data.get('commentsAnalyzed', 0),
                'aiQuestionsUsed': user_data.get('aiQuestionsUsed', 0),
                'reSyncsUsed': user_data.get('reSyncsUsed', 0),
                'resetDate': user_data.get('resetDate')
            }
            
            # Calculate remaining quota
            remaining = {
                'videos': max(0, limits['videosPerMonth'] - usage['videosAnalyzed']),
                'aiQuestions': max(0, limits['aiQuestionsPerMonth'] - usage['aiQuestionsUsed']),
                'reSyncs': max(0, limits['reSyncsPerMonth'] - usage['reSyncsUsed'])
            }
            
            return {
                'plan': plan,
                'limits': limits,
                'usage': usage,
                'remaining': remaining
            }
            
        except Exception as e:
            print(f"❌ Error getting user limits: {e}")
            raise
    
    def update_user_plan(self, user_id: str, plan: str) -> dict:
        """
        Update user's subscription plan.
        
        Args:
            user_id: User ID
            plan: New plan ('free', 'starter', 'pro', 'business')
            
        Returns:
            Updated user data
        """
        try:
            valid_plans = ['free', 'starter', 'pro', 'business']
            if plan not in valid_plans:
                raise ValueError(f"Invalid plan. Must be one of: {valid_plans}")
            
            user_ref = self.db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                raise ValueError("User not found")
            
            # Calculate plan expiry (1 month from now for paid plans, None for free)
            from datetime import datetime, timedelta, timezone
            plan_expiry = None
            if plan != 'free':
                plan_expiry = datetime.now(timezone.utc) + timedelta(days=365)  # 1 year for testing
            
            # Update plan
            update_data = {
                'plan': plan,
                'planExpiry': plan_expiry
            }
            
            user_ref.update(update_data)
            
            # Get updated user data
            updated_doc = user_ref.get()
            updated_data = updated_doc.to_dict()
            
            print(f"✅ Updated user {user_id} to {plan} plan")
            
            return updated_data
            
        except Exception as e:
            print(f"❌ Error updating user plan: {e}")
            raise


# Global instance
user_service = UserService()
