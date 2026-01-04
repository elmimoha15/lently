"""
Plan limits and pricing constants
"""

# Plan limits for each subscription tier
PLAN_LIMITS = {
    'free': {
        'videosPerMonth': 1,
        'commentsPerVideo': 500,
        'totalComments': 500,
        'aiQuestionsPerMonth': 3,
        'reSyncsPerMonth': 0,
        'autoSync': False
    },
    'starter': {
        'videosPerMonth': 50,  # Increased for testing
        'commentsPerVideo': 5000,
        'totalComments': 10000,
        'aiQuestionsPerMonth': 100,  # Increased for testing
        'reSyncsPerMonth': 20,
        'autoSync': False
    },
    'pro': {
        'videosPerMonth': 100,  # Increased for testing
        'commentsPerVideo': 10000,
        'totalComments': 20000,
        'aiQuestionsPerMonth': 500,  # Increased for testing
        'reSyncsPerMonth': 50,
        'autoSync': True
    },
    'business': {
        'videosPerMonth': 999,  # Virtually unlimited for testing
        'commentsPerVideo': 50000,
        'totalComments': 100000,
        'aiQuestionsPerMonth': 9999,  # Virtually unlimited for testing
        'reSyncsPerMonth': 999,
        'autoSync': True
    }
}

# Plan pricing in USD
PLAN_PRICING = {
    'free': 0,
    'starter': {
        'monthly': 12,      # $12 USD
        'annual': 115       # 20% discount
    },
    'pro': {
        'monthly': 27,      # $27 USD
        'annual': 259       # 20% discount
    },
    'business': {
        'monthly': 58,      # $58 USD
        'annual': 557       # 20% discount
    }
}
