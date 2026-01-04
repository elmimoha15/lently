from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from config.firebase import get_current_user_from_token

# HTTPBearer security scheme for extracting Bearer tokens from Authorization header
# auto_error=False means we handle auth errors manually with custom messages
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    Dependency to authenticate requests using Firebase ID tokens.
    
    Extracts the Bearer token from the Authorization header, verifies it with Firebase,
    and returns the user data from Firestore.
    
    Args:
        credentials: HTTPAuthorizationCredentials extracted by HTTPBearer
        
    Returns:
        dict: User data from Firestore containing userId, email, plan, etc.
        
    Raises:
        HTTPException: 401 if token is missing, invalid, or expired
    """
    # Check if Authorization header was provided
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header. Please provide a valid Bearer token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Extract the token (credentials.credentials contains the actual token value)
    token = credentials.credentials
    
    # Verify token with Firebase and get user data
    try:
        user_data = get_current_user_from_token(token)
        return user_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )

