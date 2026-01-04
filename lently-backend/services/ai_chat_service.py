"""
AI Chat Service
Handles AI-powered question answering about comments with context pruning.
"""

from config.firebase import get_db
from config.settings import settings
from services.gemini_service import GeminiService
from services.cache_service import CacheService
from typing import Optional, List
import uuid
from google.cloud import firestore


class AIChatService:
    """Service for AI chat and question answering"""
    
    def __init__(self):
        self.db = get_db()
        self.gemini_service = GeminiService(api_key=settings.gemini_api_key)
        self.cache_service = CacheService()
    
    def classify_question_intent(self, question: str) -> str:
        """
        Classify the intent of a user's question to filter relevant comments.
        This is a CRITICAL cost-saving feature - context pruning!
        
        Args:
            question: User's question
            
        Returns:
            Intent category: "complaints", "questions", "praise", "suggestions", 
                           "specific_topic", or "general"
        """
        try:
            prompt = f"""Classify the intent of this question about YouTube comments into ONE of these categories:
- complaints: asking about negative feedback, issues, problems
- questions: asking about viewer questions
- praise: asking about positive feedback, what people loved
- suggestions: asking about content ideas, what to make next
- specific_topic: asking about a specific topic/keyword
- general: general overview question

Question: "{question}"

Respond with ONLY the category name, nothing else."""

            response = self.gemini_service.model.generate_content(prompt)
            intent = response.text.strip().lower()
            
            # Validate the intent
            valid_intents = ["complaints", "questions", "praise", "suggestions", "specific_topic", "general"]
            if intent in valid_intents:
                return intent
            return "general"
            
        except Exception as e:
            print(f"Error classifying question intent: {e}")
            return "general"
    
    def get_relevant_comments(self, video_id: str, question_intent: str, 
                             question: str, limit: int = 100) -> List[dict]:
        """
        Get relevant comments based on question intent (CONTEXT PRUNING!).
        This saves 98% on token costs by only sending relevant comments to AI.
        
        Args:
            video_id: YouTube video ID
            question_intent: Classified intent from classify_question_intent()
            question: Original question (for keyword extraction)
            limit: Maximum comments to return (default 100)
            
        Returns:
            List of relevant comment dictionaries
        """
        try:
            comments = []
            
            # Get all comments for this video (no category filter - it's nested in analysis object)
            query = self.db.collection('comments').where('videoId', '==', video_id)
            results = query.limit(limit * 3).stream()  # Get more than needed, we'll filter client-side
            
            for doc in results:
                comment_data = doc.to_dict()
                comments.append({
                    'id': doc.id,
                    **comment_data
                })
            
            print(f"📥 Fetched {len(comments)} total comments from Firestore")
            
            # Flatten analysis data to top level for easier access
            for comment in comments:
                if 'analysis' in comment and isinstance(comment['analysis'], dict):
                    # Merge analysis fields to top level
                    comment['category'] = comment['analysis'].get('category')
                    comment['sentimentScore'] = comment['analysis'].get('sentimentScore')
                    comment['sentimentLabel'] = comment['analysis'].get('sentimentLabel')
                    comment['toxicityScore'] = comment['analysis'].get('toxicityScore')
            
            # Client-side filtering based on intent
            if question_intent in ["complaints", "questions", "praise", "suggestions"]:
                # Filter by category client-side
                category_map = {
                    "complaints": "complaint",
                    "questions": "question", 
                    "praise": "praise",
                    "suggestions": "suggestion"
                }
                target_category = category_map.get(question_intent)
                filtered_comments = [c for c in comments if c.get('category') == target_category]
                
                # If we have filtered comments, use them; otherwise use all
                if filtered_comments:
                    comments = filtered_comments
                    print(f"📊 Filtered to {len(filtered_comments)} {target_category} comments")
                else:
                    print(f"⚠️  No {target_category} comments found, using all {len(comments)} comments")
            
            # For specific_topic, do keyword filtering
            if question_intent == "specific_topic":
                # Extract potential keywords from question
                keywords = [word.lower() for word in question.split() 
                           if len(word) > 3 and word.lower() not in 
                           ['what', 'when', 'where', 'which', 'about', 'this', 'that', 'these', 'those']]
                
                # Filter comments by keywords
                if keywords:
                    filtered = []
                    for comment in comments:
                        comment_text = comment.get('text', '').lower()
                        if any(keyword in comment_text for keyword in keywords):
                            filtered.append(comment)
                    if filtered:
                        comments = filtered
            
            print(f"✅ Found {len(comments)} relevant comments for intent '{question_intent}'")
            return comments[:limit]  # Ensure we don't exceed limit
            
        except Exception as e:
            print(f"❌ Error getting relevant comments: {e}")
            return []
    
    def get_conversation_history(self, user_id: str, video_id: str, 
                                conversation_id: Optional[str] = None,
                                limit: int = 3) -> List[dict]:
        """
        Get recent conversation history for context (sliding window).
        
        Args:
            user_id: User ID
            video_id: Video ID
            conversation_id: Optional conversation ID
            limit: Number of recent turns to fetch (default 3)
            
        Returns:
            List of conversation turns
        """
        if not conversation_id:
            return []
        
        try:
            turns_ref = (self.db.collection('conversations')
                        .document(conversation_id)
                        .collection('turns')
                        .order_by('timestamp', direction=firestore.Query.DESCENDING)
                        .limit(limit))
            
            turns = []
            for doc in turns_ref.stream():
                turns.append(doc.to_dict())
            
            # Reverse to get chronological order
            return list(reversed(turns))
            
        except Exception as e:
            print(f"Error getting conversation history: {e}")
            return []
    
    def answer_question(self, user_id: str, video_id: str, question: str,
                       conversation_id: Optional[str] = None) -> dict:
        """
        Answer a user's question about their video comments.
        
        Args:
            user_id: User ID
            video_id: Video ID
            question: User's question
            conversation_id: Optional conversation ID for context
            
        Returns:
            Dict with answer, confidence, relatedCommentIds
        """
        try:
            # Generate conversation ID if not provided
            if not conversation_id:
                conversation_id = f"conv_{uuid.uuid4().hex[:16]}"
            
            # Step 1: Classify question intent (for context pruning)
            intent = self.classify_question_intent(question)
            print(f"Question intent: {intent}")
            
            # Step 2: Get relevant comments (only 50-100, not all 10,000!)
            relevant_comments = self.get_relevant_comments(video_id, intent, question, limit=100)
            print(f"Found {len(relevant_comments)} relevant comments")
            
            if not relevant_comments:
                return {
                    'answer': "I couldn't find any relevant comments to answer your question. Try rephrasing or ask a different question.",
                    'confidence': 0.0,
                    'relatedCommentIds': [],
                    'conversationId': conversation_id
                }
            
            # Step 3: Get conversation history (sliding window - last 3 turns)
            history = self.get_conversation_history(user_id, video_id, conversation_id, limit=3)
            
            # Step 4: Call Gemini to answer the question
            result = self.gemini_service.answer_question(question, relevant_comments, history)
            
            # Step 5: Save conversation turn to Firestore
            self._save_conversation_turn(conversation_id, user_id, video_id, question, result['answer'])
            
            return {
                'answer': result['answer'],
                'confidence': result.get('confidence', 0.8),
                'relatedCommentIds': result.get('relatedCommentIds', []),
                'conversationId': conversation_id
            }
            
        except Exception as e:
            print(f"Error answering question: {e}")
            return {
                'answer': "Sorry, I encountered an error while processing your question. Please try again.",
                'confidence': 0.0,
                'relatedCommentIds': [],
                'conversationId': conversation_id
            }
    
    def _save_conversation_turn(self, conversation_id: str, user_id: str, 
                               video_id: str, question: str, answer: str):
        """Save conversation turn to Firestore"""
        try:
            # Save user question
            user_turn_ref = (self.db.collection('conversations')
                           .document(conversation_id)
                           .collection('turns')
                           .document())
            
            user_turn_ref.set({
                'role': 'user',
                'content': question,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'userId': user_id,
                'videoId': video_id
            })
            
            # Save assistant answer
            assistant_turn_ref = (self.db.collection('conversations')
                                .document(conversation_id)
                                .collection('turns')
                                .document())
            
            assistant_turn_ref.set({
                'role': 'assistant',
                'content': answer,
                'timestamp': firestore.SERVER_TIMESTAMP,
                'userId': user_id,
                'videoId': video_id
            })
            
            # Update conversation metadata
            conv_ref = self.db.collection('conversations').document(conversation_id)
            conv_ref.set({
                'userId': user_id,
                'videoId': video_id,
                'lastUpdated': firestore.SERVER_TIMESTAMP
            }, merge=True)
            
        except Exception as e:
            print(f"Error saving conversation turn: {e}")
