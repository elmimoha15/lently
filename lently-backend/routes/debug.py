from fastapi import APIRouter, Request

router = APIRouter(prefix="/api/debug", tags=["Debug"])


@router.get("/headers")
async def get_headers(request: Request):
    """Return request headers (temporary debug endpoint)."""
    # Return headers as a normal dict for easy inspection
    return {k: v for k, v in request.headers.items()}


@router.get("/test-rate-limit")
async def test_rate_limit(request: Request):
    """
    Test endpoint for rate limiting.
    Limited to 3 requests per minute.
    """
    return {
        "success": True,
        "message": "Rate limit test successful",
        "info": "This endpoint is limited to 3 requests per minute"
    }

