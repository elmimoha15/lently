"""
AI Reply Service
Service for generating and managing professional AI replies to common questions.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
import uuid
from config.firebase import get_db
from services.gemini_service import gemini_service
from collections import defaultdict
import re


class AIReplyService:
    """Service for AI-generated reply management"""
    
    def __init__(self):
        self.db = get_db()
    
    async def generate_reply(
        self, 
        user_id: str, 
        question: str, 
        video_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Generate professional, brand-safe reply using Gemini AI.
        
        Args:
            user_id: User ID
            question: Question to answer
            video_context: Optional context (channelName, videoTitle)
            
        Returns:
            Generated reply text
        """
        try:
            # Build context for prompt
            context_parts = []
            if video_context:
                if video_context.get('channelName'):
                    context_parts.append(f"Channel: {video_context['channelName']}")
                if video_context.get('videoTitle'):
                    context_parts.append(f"Video: {video_context['videoTitle']}")
            
            context_str = "\n".join(context_parts) if context_parts else ""
            
            # Create prompt for professional reply
            prompt = f"""You are a helpful content creator responding to a viewer's question.

Question: "{question}"
{context_str}

Generate a professional, friendly, and helpful reply. Follow these guidelines:
- Be warm and appreciative of the question
- Keep response concise (max 200 tokens)
- Use a helpful, friendly tone
- Be brand-safe and appropriate
- If you don't have specific information, give a general helpful response
- Don't make specific product recommendations unless contextually obvious

Reply:"""
            
            # Call Gemini API
            response = gemini_service.generate_content(
                prompt=prompt,
                max_tokens=200,
                temperature=0.7  # More creative for conversational tone
            )
            
            reply_text = response.strip()
            return reply_text
            
        except Exception as e:
            print(f"Error generating reply: {str(e)}")
            raise Exception(f"Failed to generate reply: {str(e)}")
    
    async def save_reply(
        self, 
        user_id: str, 
        question: str, 
        reply_text: str, 
        video_ids: Optional[List[str]] = None
    ) -> str:
        """
        Save reply to Firestore. Updates if question already exists.
        
        Args:
            user_id: User ID
            question: Question text
            reply_text: Generated reply
            video_ids: List of video IDs where question appeared
            
        Returns:
            Reply ID
        """
        try:
            if video_ids is None:
                video_ids = []
            
            # Normalize question for matching
            normalized_question = question.lower().strip()
            
            # Check if reply for similar question exists
            existing_query = self.db.collection('ai_replies') \
                .where('userId', '==', user_id) \
                .stream()
            
            for doc in existing_query:
                existing_reply = doc.to_dict()
                if existing_reply['question'].lower().strip() == normalized_question:
                    # Update existing reply
                    doc_ref = self.db.collection('ai_replies').document(doc.id)
                    
                    # Merge video IDs (avoid duplicates)
                    existing_video_ids = set(existing_reply.get('videoIds', []))
                    new_video_ids = list(existing_video_ids.union(set(video_ids)))
                    
                    doc_ref.update({
                        'timesAsked': existing_reply.get('timesAsked', 1) + 1,
                        'videoIds': new_video_ids,
                        'replyText': reply_text  # Update with latest generated text
                    })
                    
                    return doc.id
            
            # Create new reply
            reply_id = str(uuid.uuid4())
            reply_data = {
                'replyId': reply_id,
                'userId': user_id,
                'question': question,
                'replyText': reply_text,
                'timesAsked': 1,
                'videoIds': video_ids,
                'useCount': 0,
                'lastUsedAt': None,
                'createdAt': datetime.utcnow().isoformat()
            }
            
            self.db.collection('ai_replies').document(reply_id).set(reply_data)
            print(f"Created AI reply: {reply_id} for question: {question[:50]}...")
            
            return reply_id
            
        except Exception as e:
            print(f"Error saving reply: {str(e)}")
            raise Exception(f"Failed to save reply: {str(e)}")
    
    def get_user_replies(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Fetch all saved replies for user, sorted by useCount.
        
        Args:
            user_id: User ID
            
        Returns:
            List of replies
        """
        try:
            query = self.db.collection('ai_replies') \
                .where('userId', '==', user_id) \
                .order_by('useCount', direction='DESCENDING') \
                .stream()
            
            replies = []
            for doc in query:
                reply_data = doc.to_dict()
                reply_data['replyId'] = doc.id
                replies.append(reply_data)
            
            return replies
            
        except Exception as e:
            print(f"Error fetching user replies: {str(e)}")
            return []
    
    def increment_use_count(self, reply_id: str) -> bool:
        """
        Increment use count and update lastUsedAt.
        
        Args:
            reply_id: Reply ID
            
        Returns:
            Success status
        """
        try:
            reply_ref = self.db.collection('ai_replies').document(reply_id)
            reply_doc = reply_ref.get()
            
            if not reply_doc.exists:
                return False
            
            reply_data = reply_doc.to_dict()
            current_count = reply_data.get('useCount', 0)
            
            reply_ref.update({
                'useCount': current_count + 1,
                'lastUsedAt': datetime.utcnow().isoformat()
            })
            
            print(f"Incremented use count for reply {reply_id}: {current_count} -> {current_count + 1}")
            return True
            
        except Exception as e:
            print(f"Error incrementing use count: {str(e)}")
            return False
    
    def extract_common_questions(self, video_id: str) -> List[Dict[str, Any]]:
        """
        Extract and group common questions from video comments.
        
        Args:
            video_id: Video ID
            
        Returns:
            List of common questions with counts
        """
        try:
            # Query comments with category='question'
            query = self.db.collection('comments') \
                .where('videoId', '==', video_id) \
                .where('category', '==', 'question') \
                .stream()
            
            # Group questions by similarity (basic keyword matching)
            question_groups = defaultdict(list)
            
            for doc in query:
                comment = doc.to_dict()
                question_text = comment.get('extractedQuestion') or comment.get('text', '')
                
                if not question_text:
                    continue
                
                # Normalize question
                normalized = self._normalize_question(question_text)
                
                # Try to find similar question group
                found_group = False
                for key in question_groups.keys():
                    if self._are_similar_questions(normalized, key):
                        question_groups[key].append({
                            'text': question_text,
                            'commentId': doc.id
                        })
                        found_group = True
                        break
                
                if not found_group:
                    question_groups[normalized] = [{
                        'text': question_text,
                        'commentId': doc.id
                    }]
            
            # Convert to list and sort by frequency
            common_questions = []
            for normalized_key, questions in question_groups.items():
                if len(questions) > 0:
                    # Use the most common phrasing as the representative question
                    representative = max(questions, key=lambda q: len(q['text']))
                    
                    common_questions.append({
                        'question': representative['text'],
                        'count': len(questions),
                        'commentIds': [q['commentId'] for q in questions[:3]]  # Sample of 3
                    })
            
            # Sort by count and return top 10
            common_questions.sort(key=lambda x: x['count'], reverse=True)
            return common_questions[:10]
            
        except Exception as e:
            print(f"Error extracting common questions: {str(e)}")
            return []
    
    def _normalize_question(self, question: str) -> str:
        """Normalize question for comparison"""
        # Convert to lowercase
        q = question.lower()
        # Remove punctuation
        q = re.sub(r'[^\w\s]', '', q)
        # Remove extra whitespace
        q = ' '.join(q.split())
        return q
    
    def _are_similar_questions(self, q1: str, q2: str) -> bool:
        """Check if two questions are similar based on keywords"""
        words1 = set(q1.split())
        words2 = set(q2.split())
        
        # Remove common stop words
        stop_words = {'what', 'how', 'when', 'where', 'why', 'who', 'which', 'is', 'are', 
                      'do', 'does', 'did', 'can', 'could', 'would', 'should', 'the', 'a', 
                      'an', 'you', 'your', 'i', 'my'}
        words1 = words1 - stop_words
        words2 = words2 - stop_words
        
        if not words1 or not words2:
            return False
        
        # Calculate Jaccard similarity
        intersection = len(words1.intersection(words2))
        union = len(words1.union(words2))
        
        similarity = intersection / union if union > 0 else 0
        
        # Consider similar if > 50% overlap
        return similarity > 0.5


# Singleton instance
ai_reply_service = AIReplyService()
