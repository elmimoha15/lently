"""
Cache Service
Handles answer caching for common AI questions to save costs.
"""

from config.firebase import get_db
from typing import Optional
import hashlib


class CacheService:
    """Service for caching AI-generated answers"""
    
    def __init__(self):
        self.db = get_db()
    
    def _normalize_question(self, question: str) -> str:
        """Normalize question for cache matching"""
        return question.lower().strip()
    
    def _get_cache_key(self, video_id: str, question: str) -> str:
        """Generate cache key for a video + question combination"""
        normalized = self._normalize_question(question)
        # Use hash to create consistent key
        hash_obj = hashlib.md5(normalized.encode())
        return f"{video_id}_{hash_obj.hexdigest()}"
    
    def get_cached_answer(self, video_id: str, question: str) -> Optional[dict]:
        """
        Check if we have a cached answer for this question.
        
        Args:
            video_id: YouTube video ID
            question: User's question
            
        Returns:
            Cached answer dict if exists, None otherwise
        """
        try:
            cache_key = self._get_cache_key(video_id, question)
            
            # Check answer_cache collection
            cache_ref = self.db.collection('answer_cache').document(video_id)
            cache_doc = cache_ref.get()
            
            if cache_doc.exists:
                cache_data = cache_doc.to_dict()
                
                # Check if this specific question is cached
                if 'answers' in cache_data and cache_key in cache_data['answers']:
                    return cache_data['answers'][cache_key]
            
            return None
            
        except Exception as e:
            print(f"Error getting cached answer: {e}")
            return None
    
    def cache_answer(self, video_id: str, question: str, answer: str, 
                     confidence: Optional[float] = None,
                     related_comment_ids: Optional[list] = None) -> bool:
        """
        Store an answer in the cache.
        
        Args:
            video_id: YouTube video ID
            question: User's question
            answer: AI-generated answer
            confidence: Optional confidence score
            related_comment_ids: Optional list of comment IDs used
            
        Returns:
            True if cached successfully, False otherwise
        """
        try:
            cache_key = self._get_cache_key(video_id, question)
            
            cache_ref = self.db.collection('answer_cache').document(video_id)
            
            # Store the answer
            answer_data = {
                'question': question,
                'answer': answer,
                'confidence': confidence,
                'relatedCommentIds': related_comment_ids or [],
                'cachedAt': firestore.SERVER_TIMESTAMP
            }
            
            # Update or create the cache document
            cache_ref.set({
                'answers': {
                    cache_key: answer_data
                }
            }, merge=True)
            
            return True
            
        except Exception as e:
            print(f"Error caching answer: {e}")
            return False
    
    def get_common_questions(self) -> list:
        """
        Get list of common questions that should be pre-cached.
        
        Returns:
            List of common question strings
        """
        return [
            "What are people complaining about?",
            "What questions are people asking?",
            "What do people love most?",
            "What content should I make next?",
            "Show me toxic comments",
            "What's the overall sentiment?",
            "What are the main topics discussed?",
            "Are there any recurring issues?"
        ]


# Import firestore for SERVER_TIMESTAMP
from google.cloud import firestore
