import google.generativeai as genai
from typing import List, Dict, Optional, Any
import json
import re
from config.settings import settings


class GeminiService:
    """Service for analyzing comments using Google Gemini AI"""
    
    def __init__(self, api_key: str):
        """
        Initialize Gemini AI service
        
        Args:
            api_key: Google Gemini API key
        """
        genai.configure(api_key=api_key)
        # Use gemini-2.5-flash - latest stable model (fast & cost-effective)
        self.model = genai.GenerativeModel('models/gemini-2.5-flash')
        
    def analyze_comments_batch(self, comments: List[Dict], batch_size: int = 30) -> List[Dict]:
        """
        Analyze comments in batches using Gemini AI
        
        Args:
            comments: List of comment dictionaries with 'text', 'id', etc.
            batch_size: Number of comments per batch (default 30, reduced from 50 to avoid truncation)
            
        Returns:
            List of analysis results for each comment
        """
        all_analyses = []
        error_flag = False
        
        # Process comments in batches
        for i in range(0, len(comments), batch_size):
            batch = comments[i:i + batch_size]
            
            try:
                batch_analyses = self._analyze_single_batch(batch)
                all_analyses.extend(batch_analyses)
            except Exception as e:
                print(f"❌ Error analyzing batch {i//batch_size + 1}: {str(e)}")
                error_flag = True
                # Add placeholder results for failed batch
                for comment in batch:
                    all_analyses.append({
                        "commentId": comment.get("id", ""),
                        "category": "neutral",
                        "sentimentScore": 0.0,
                        "sentimentLabel": "neutral",
                        "toxicityScore": 0.0,
                        "extractedQuestion": None,
                        "error": True
                    })
        
        return all_analyses
    
    def _analyze_single_batch(self, comments: List[Dict]) -> List[Dict]:
        """
        Analyze a single batch of comments
        
        Args:
            comments: List of comment dictionaries
            
        Returns:
            List of analysis results
        """
        # Create numbered list of comments for the prompt
        comments_text = "\n".join([
            f"{idx + 1}. {comment.get('text', '')[:500]}"  # Limit each comment to 500 chars
            for idx, comment in enumerate(comments)
        ])
        
        prompt = f"""Analyze these YouTube comments and return a JSON array with analysis for each comment.
For each comment, provide:
- category: one of [question, praise, complaint, spam, suggestion, neutral]
- sentimentScore: number from -1.0 (very negative) to 1.0 (very positive)
- sentimentLabel: one of [positive, neutral, negative]
- toxicityScore: number from 0.0 (not toxic) to 1.0 (very toxic)
- extractedQuestion: if category is "question", extract the main question being asked (otherwise null)

Comments to analyze:
{comments_text}

Return ONLY a valid JSON array with {len(comments)} objects, one for each comment in order.
Example format:
[
  {{
    "category": "question",
    "sentimentScore": 0.5,
    "sentimentLabel": "positive",
    "toxicityScore": 0.1,
    "extractedQuestion": "How do I fix the audio issue?"
  }},
  ...
]"""

        # Generate response with low temperature for consistency
        # Increase token limit to handle larger batches
        generation_config = genai.types.GenerationConfig(
            temperature=0.3,
            max_output_tokens=16000  # Increased from 8000 to handle larger responses
        )
        
        response = self.model.generate_content(
            prompt,
            generation_config=generation_config
        )
        
        # Parse JSON response
        response_text = response.text.strip()
        
        # Remove markdown code blocks if present
        response_text = re.sub(r'^```json\s*', '', response_text)
        response_text = re.sub(r'^```\s*', '', response_text)
        response_text = re.sub(r'\s*```$', '', response_text)
        
        # Try to fix truncated JSON by finding the last complete object
        if not response_text.endswith(']'):
            # Response was truncated, try to fix it
            last_complete = response_text.rfind('}')
            if last_complete != -1:
                response_text = response_text[:last_complete + 1] + '\n]'
                print(f"⚠️  Warning: Response was truncated, attempted to fix JSON")
        
        try:
            analyses = json.loads(response_text)
        except json.JSONDecodeError as e:
            print(f"❌ JSON parse error: {e}")
            print(f"Response text preview: {response_text[:500]}")
            raise ValueError("Failed to parse Gemini response as JSON")
        
        # Validate response length matches input
        if len(analyses) != len(comments):
            raise ValueError(f"Response length {len(analyses)} doesn't match input length {len(comments)}")
        
        # Add comment IDs to analyses
        for idx, analysis in enumerate(analyses):
            analysis["commentId"] = comments[idx].get("id", "")
            analysis["error"] = False
        
        return analyses
    
    def answer_question(
        self,
        question: str,
        relevant_comments: List[Dict],
        conversation_history: Optional[List[Dict]] = None
    ) -> Dict[str, Any]:
        """
        Answer user's question based on relevant comments
        
        Args:
            question: User's question about their comments
            relevant_comments: Filtered list of relevant comments (not all 10,000!)
            conversation_history: Last 3 conversation turns for context (sliding window)
            
        Returns:
            Dict with: answer, confidence, relatedCommentIds, tokensUsed, cost
        """
        # Limit to last 3 conversation turns for context
        if conversation_history:
            conversation_history = conversation_history[-3:]
        else:
            conversation_history = []
        
        # Build conversation context
        context = ""
        if conversation_history:
            context = "Previous conversation:\n"
            for turn in conversation_history:
                role = turn.get("role", "user")
                content = turn.get("content", "")
                context += f"{role.capitalize()}: {content}\n"
            context += "\n"
        
        # Build comments context (limit to prevent token overflow)
        comments_text = ""
        related_comment_ids = []
        for idx, comment in enumerate(relevant_comments[:100]):  # Max 100 comments
            comment_id = comment.get("id", f"comment_{idx}")
            text = comment.get("text", "")
            author = comment.get("authorName", "Unknown")
            comments_text += f"[{comment_id}] @{author}: {text[:300]}\n"
            related_comment_ids.append(comment_id)
        
        prompt = f"""{context}You are analyzing YouTube comments for a content creator. Answer the user's question by providing SPECIFIC, DETAILED insights from the actual comments provided.

Question: {question}

Comments from viewers:
{comments_text}

IMPORTANT INSTRUCTIONS:
1. Read ALL the comments carefully and extract the ACTUAL information viewers are saying
2. Provide SPECIFIC examples and quotes from the comments
3. Mention viewer names (e.g., "@username said...") to make it personal and credible
4. Summarize patterns and common themes you see across multiple comments
5. Be detailed and comprehensive - don't give generic or incomplete answers
6. If people are asking about something, tell the creator WHAT they're asking
7. If people are complaining, tell the creator WHAT the complaints are about
8. If people are praising, tell the creator WHAT they liked specifically
9. Use emojis, bullet points, and clear structure for better readability
10. Base your answer ONLY on what's actually in the comments - don't make assumptions

FORMAT YOUR RESPONSE LIKE THIS:
- Start with a brief summary (1-2 sentences)
- Use emojis (👍, 😐, 👎, ❓, 💡, 🔥, etc.) to highlight different sections
- Use bullet points (•) for lists
- Quote specific viewers with @username
- End with a key insight or recommendation if applicable

Example format:
Based on the comments, here's what viewers are saying about [topic]:

👍 **Positive Feedback**
• @username mentioned: "quote from comment"
• Many viewers appreciated X
• Common praise: Y

👎 **Concerns/Issues**
• @username said: "quote"
• Several people mentioned Z

💡 **Key Insight:** [actionable recommendation]

Provide a helpful, detailed, well-formatted answer that gives the creator real actionable insights."""

        # Generate response with token limit
        generation_config = genai.types.GenerationConfig(
            temperature=0.7,
            max_output_tokens=500  # Increased from 300 to allow more detailed responses
        )
        
        response = self.model.generate_content(
            prompt,
            generation_config=generation_config
        )
        
        answer = response.text.strip()
        
        # Calculate approximate token usage (rough estimate)
        # Gemini doesn't expose exact token counts in SDK, so we estimate
        input_tokens = len(prompt.split()) * 1.3  # Rough approximation
        output_tokens = len(answer.split()) * 1.3
        total_tokens = int(input_tokens + output_tokens)
        
        # Calculate cost (Gemini 1.5 Flash pricing: ~$0.00001 per 1k tokens)
        cost = (total_tokens / 1000) * 0.00001
        
        # Extract confidence (simplified heuristic)
        confidence = 0.8  # Default confidence
        if len(relevant_comments) < 5:
            confidence = 0.5  # Lower confidence with few comments
        elif "I don't" in answer or "unclear" in answer.lower():
            confidence = 0.6
        
        return {
            "answer": answer,
            "confidence": confidence,
            "relatedCommentIds": related_comment_ids[:10],  # Return top 10 related IDs
            "tokensUsed": total_tokens,
            "cost": round(cost, 6)
        }


# Create a global service instance
gemini_service = GeminiService(api_key=settings.gemini_api_key)
