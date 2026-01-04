"""
Rate Limiter Middleware
Implements rate limiting to prevent abuse and manage API usage.
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from typing import Callable


def get_user_identifier(request: Request) -> str:
    """
    Get identifier for rate limiting.
    Uses user_id if authenticated, otherwise falls back to IP address.
    """
    # Try to get user_id from request state (set by auth middleware)
    if hasattr(request.state, 'user') and request.state.user:
        user_id = request.state.user.get('userId')
        if user_id:
            return f"user:{user_id}"
    
    # Fall back to IP address for unauthenticated requests
    return f"ip:{get_remote_address(request)}"


# Create limiter instance with custom key function
limiter = Limiter(
    key_func=get_user_identifier,
    default_limits=["100/minute"],  # Default limit for all endpoints
    storage_uri="memory://",  # Use in-memory storage (for production, use Redis)
    strategy="fixed-window",  # Fixed window strategy
    headers_enabled=True,  # Add rate limit headers to responses
)


def rate_limit_error_handler(request: Request, exc: RateLimitExceeded):
    """
    Custom error handler for rate limit exceeded.
    Returns 429 status with clear error message and Retry-After header.
    """
    # Extract retry after time from exception
    retry_after = exc.detail.split("in ")[-1] if "in " in exc.detail else "60 seconds"
    
    return {
        "success": False,
        "error": "Rate limit exceeded",
        "message": f"Too many requests. Please try again in {retry_after}.",
        "retryAfter": retry_after
    }
