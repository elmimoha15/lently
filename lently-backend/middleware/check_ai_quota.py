"""
AI Quota Checking Middleware
Enforces AI question limits based on user's subscription plan.
"""

from fastapi import HTTPException, Depends
from config.firebase import get_db
from middleware.auth import get_current_user
from google.cloud import firestore
from typing import Dict


# Plan limits for AI questions per month
PLAN_LIMITS = {
    'free': 3,
    'starter': 20,
    'pro': 100,
    'business': 500
}


async def check_ai_question_quota(current_user: Dict = Depends(get_current_user)):
    """
    Check if user has remaining AI question quota for their plan.
    
    Args:
        current_user: Current authenticated user from get_current_user
        
    Raises:
        HTTPException 403: If quota exceeded
        
    Returns:
        Dict with remaining questions
    """
    user_id = current_user.get('userId')
    plan = current_user.get('plan', 'free')
    
    # Get plan limit
    plan_limit = PLAN_LIMITS.get(plan, 3)  # Default to free plan
    
    # Get user's current usage from Firestore
    db = get_db()
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        # Create user document if it doesn't exist
        user_ref.set({
            'userId': user_id,
            'email': current_user.get('email'),
            'plan': plan,
            'aiQuestionsUsed': 0,
            'createdAt': firestore.SERVER_TIMESTAMP
        })
        questions_used = 0
    else:
        user_data = user_doc.to_dict()
        questions_used = user_data.get('aiQuestionsUsed', 0)
    
    # Check if quota exceeded
    if questions_used >= plan_limit:
        raise HTTPException(
            status_code=403,
            detail={
                'error': 'ai_quota_exceeded',
                'message': f'You have reached your AI question limit ({plan_limit} questions/month for {plan} plan).',
                'questionsUsed': questions_used,
                'planLimit': plan_limit,
                'upgradeMessage': 'Upgrade your plan to ask more questions!' if plan != 'business' else 'Contact support for higher limits.'
            }
        )
    
    # Return remaining quota info
    return {
        'userId': user_id,
        'plan': plan,
        'questionsUsed': questions_used,
        'planLimit': plan_limit,
        'remainingQuestions': plan_limit - questions_used
    }
