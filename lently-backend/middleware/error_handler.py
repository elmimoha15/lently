"""
Global Error Handler Middleware
Catches all unhandled exceptions and returns user-friendly errors.
"""

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from utils.logger import log_error
from utils.exceptions import (
    QuotaExceededException,
    VideoNotFoundException,
    UnauthorizedException,
    InvalidInputException
)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Global error handler that catches all unhandled exceptions.
    """
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
            
        except HTTPException as exc:
            # HTTPException is already handled by FastAPI
            # Just log it for tracking
            error_id = log_error(
                error=exc,
                endpoint=str(request.url.path),
                context={
                    "status_code": exc.status_code,
                    "detail": exc.detail
                }
            )
            
            # Return the HTTPException as-is
            raise exc
            
        except Exception as exc:
            # Unhandled exception - log and return generic error
            
            # Extract user_id from request state if available
            user_id = None
            if hasattr(request.state, 'user'):
                user_id = request.state.user.get('userId')
            
            # Log the error
            error_id = log_error(
                error=exc,
                user_id=user_id,
                endpoint=str(request.url.path),
                service="api",
                context={
                    "method": request.method,
                    "url": str(request.url)
                }
            )
            
            # Return generic error (don't expose internals)
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "error": "Internal server error",
                    "message": "An unexpected error occurred. Please try again later.",
                    "error_id": error_id,
                    "support": "If this problem persists, contact support with error ID: " + error_id
                }
            )


def handle_service_error(
    error: Exception,
    service: str,
    user_id: str = None,
    video_id: str = None,
    context: dict = None
) -> dict:
    """
    Handle errors from service layer.
    
    Args:
        error: The exception
        service: Service name
        user_id: User ID if available
        video_id: Video ID if available
        context: Additional context
        
    Returns:
        Error response dict
    """
    error_id = log_error(
        error=error,
        user_id=user_id,
        video_id=video_id,
        service=service,
        context=context
    )
    
    return {
        "success": False,
        "error": type(error).__name__,
        "message": str(error),
        "error_id": error_id
    }
