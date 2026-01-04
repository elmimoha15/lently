"""
Custom Exception Classes
Define custom exceptions for better error handling and reporting.
"""

from fastapi import HTTPException


class QuotaExceededException(HTTPException):
    """Raised when user exceeds their plan quota"""
    def __init__(self, plan: str, feature: str):
        detail = f"Quota exceeded. Upgrade to {plan} for more {feature}."
        super().__init__(status_code=403, detail=detail)


class VideoNotFoundException(HTTPException):
    """Raised when video is not found"""
    def __init__(self, video_id: str = None):
        detail = f"Video not found" + (f": {video_id}" if video_id else "")
        super().__init__(status_code=404, detail=detail)


class UnauthorizedException(HTTPException):
    """Raised when user is not authorized"""
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(status_code=401, detail=message)


class InvalidInputException(HTTPException):
    """Raised when input validation fails"""
    def __init__(self, message: str = "Invalid input"):
        super().__init__(status_code=400, detail=message)


class CommentsFetchException(Exception):
    """Raised when fetching comments from YouTube fails"""
    pass


class AnalysisException(Exception):
    """Raised when AI analysis fails"""
    pass


class SyncJobException(Exception):
    """Raised when sync job processing fails"""
    pass


class PaymentException(Exception):
    """Raised when payment processing fails"""
    pass
