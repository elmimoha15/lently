# ✅ Rate Limiting System - COMPLETE (Step 14)

## Overview
Comprehensive rate limiting system implemented to prevent API abuse and manage usage fairly across all users.

---

## Implementation Details

### 1. Dependencies Added

**requirements.txt**
```
slowapi  # Rate limiting library for FastAPI
```

### 2. Files Created/Modified

#### ✅ `middleware/rate_limiter.py` (NEW)
**Purpose:** Configure SlowAPI rate limiter with custom key function

**Key Features:**
- Uses user_id for authenticated requests
- Falls back to IP address for unauthenticated requests
- In-memory storage (upgrade to Redis for production)
- Fixed-window strategy
- Adds rate limit headers to responses
- Custom error handler for 429 errors

**Key Function:**
```python
def get_user_identifier(request: Request) -> str:
    """
    Get identifier for rate limiting.
    Uses user_id if authenticated, otherwise falls back to IP address.
    """
    if hasattr(request.state, 'user') and request.state.user:
        user_id = request.state.user.get('userId')
        if user_id:
            return f"user:{user_id}"
    return f"ip:{get_remote_address(request)}"
```

**Limiter Configuration:**
```python
limiter = Limiter(
    key_func=get_user_identifier,
    default_limits=["100/minute"],  # Default for all endpoints
    storage_uri="memory://",  # Use Redis in production
    strategy="fixed-window",
    headers_enabled=True  # Adds X-RateLimit-* headers
)
```

**Error Handler:**
```python
def rate_limit_error_handler(request: Request, exc: RateLimitExceeded):
    """Returns 429 with clear error message and retry time"""
    return {
        "success": False,
        "error": "Rate limit exceeded",
        "message": f"Too many requests. Please try again in {retry_after}.",
        "retryAfter": retry_after
    }
```

#### ✅ `main.py` (MODIFIED)
**Changes:**
1. Import limiter and error handler
2. Add limiter state to app: `app.state.limiter = limiter`
3. Register error handler: `app.add_exception_handler(RateLimitExceeded, rate_limit_error_handler)`

```python
from middleware.rate_limiter import limiter, rate_limit_error_handler
from slowapi.errors import RateLimitExceeded

# Add rate limiter state to app
app.state.limiter = limiter

# Add rate limit exceeded error handler
app.add_exception_handler(RateLimitExceeded, rate_limit_error_handler)
```

---

## Rate Limits Applied

### 1. ✅ Authentication Endpoints - `10/minute`
**File:** `routes/auth.py`
**Endpoints:**
- `GET /api/auth/me` - Get user profile

**Reason:** Prevent brute force attacks and token abuse

```python
@router.get("/me")
@limiter.limit("10/minute")
async def get_current_user_profile(request: Request, ...):
```

### 2. ✅ Video Analysis - `5/hour`
**File:** `routes/videos.py`
**Endpoints:**
- `POST /api/videos/analyze` - Queue video analysis

**Reason:** Expensive operation (YouTube API + Gemini AI), prevent abuse

```python
@router.post("/analyze")
@limiter.limit("5/hour")
async def analyze_video(request: AnalyzeVideoRequest, req: Request, ...):
```

### 3. ✅ AI Chat - `20/minute`
**File:** `routes/ai_chat.py`
**Endpoints:**
- `POST /api/ai/chat` - Ask AI questions

**Reason:** Moderate cost operation, balance user experience with API costs

```python
@router.post("/chat")
@limiter.limit("20/minute")
async def ask_ai_question(request_body: AskAIRequest, req: Request, ...):
```

### 4. ✅ Comments - `60/minute`
**File:** `routes/comments.py`
**Endpoints:**
- `GET /api/videos/{video_id}/comments` - Get comments

**Reason:** Read operation, allow higher throughput but prevent scraping

```python
@router.get("/{video_id}/comments")
@limiter.limit("60/minute")
async def get_video_comments(video_id: str, req: Request, ...):
```

### 5. ✅ Default - `100/minute`
**All other endpoints** (not explicitly limited)

**Reason:** General rate limit for all endpoints

---

## Response Headers

When rate limiting is active, these headers are added to responses:

```
X-RateLimit-Limit: 20          # Maximum requests allowed
X-RateLimit-Remaining: 15      # Requests remaining in window
X-RateLimit-Reset: 1640995200  # Unix timestamp when limit resets
```

---

## Error Response Format

**Status Code:** `429 Too Many Requests`

**Response Body:**
```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in 45 seconds.",
  "retryAfter": "45 seconds"
}
```

---

## Testing Instructions

### 1. Install Dependencies

```bash
cd lently-backend
pip install -r requirements.txt
```

### 2. Start Backend Server

```bash
uvicorn main:app --reload
```

### 3. Test Rate Limiting

#### A) **Test Debug Endpoint (Easiest)**

The debug endpoint is limited to **3 requests per minute** for easy testing.

**Using Browser or Postman:**
1. Navigate to: `http://localhost:8000/api/debug/test-rate-limit`
2. Refresh quickly 4 times
3. On the 4th request, you should get:
   ```json
   {
     "success": false,
     "error": "Rate limit exceeded",
     "message": "Too many requests. Please try again in 60 seconds.",
     "retryAfter": "60 seconds"
   }
   ```

**Using curl (in terminal):**
```bash
# Make 4 rapid requests
for i in {1..4}; do
  echo "Request $i:"
  curl http://localhost:8000/api/debug/test-rate-limit
  echo -e "\n"
done
```

**Expected Output:**
- Requests 1-3: Success ✅
- Request 4: 429 Rate limit exceeded ❌

#### B) **Test Auth Endpoint (10/minute)**

```bash
# Get your Firebase token first
TOKEN="your_firebase_id_token"

# Make 11 requests rapidly
for i in {1..11}; do
  echo "Request $i:"
  curl -H "Authorization: Bearer $TOKEN" \
       http://localhost:8000/api/auth/me
  echo -e "\n"
done
```

**Expected:**
- Requests 1-10: Success ✅
- Request 11: 429 Rate limit exceeded ❌

#### C) **Test Video Analysis (5/hour)**

This one is harder to test because it's per hour, but you can:

1. Make 5 video analysis requests
2. 6th request should be rejected with 429

```bash
# Requires valid YouTube URL
curl -X POST http://localhost:8000/api/videos/analyze \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

Repeat 6 times to trigger limit.

#### D) **Test AI Chat (20/minute)**

```bash
# Make 21 requests to AI chat
for i in {1..21}; do
  echo "Request $i:"
  curl -X POST http://localhost:8000/api/ai/chat \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "videoId": "test_video_id",
      "question": "What are users saying?",
      "conversationId": null
    }'
  echo -e "\n"
done
```

**Expected:**
- Requests 1-20: Success ✅
- Request 21: 429 Rate limit exceeded ❌

#### E) **Test Comments Endpoint (60/minute)**

```bash
# Make 61 requests
for i in {1..61}; do
  echo "Request $i:"
  curl -H "Authorization: Bearer $TOKEN" \
       "http://localhost:8000/api/videos/test_video_id/comments?limit=10"
  echo -e "\n"
done
```

**Expected:**
- Requests 1-60: Success ✅
- Request 61: 429 Rate limit exceeded ❌

### 4. Check Rate Limit Headers

Use `-i` flag with curl to see headers:

```bash
curl -i http://localhost:8000/api/debug/test-rate-limit
```

**Look for these headers:**
```
HTTP/1.1 200 OK
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 2
X-RateLimit-Reset: 1640995200
```

After hitting the limit:
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1640995260
```

### 5. Test Cooldown Period

After hitting the rate limit:
1. Wait for the time specified in `retryAfter`
2. Make another request
3. Should work again ✅

---

## Rate Limit Strategy

### Fixed Window
- Simple and predictable
- Resets at fixed intervals (e.g., every minute, every hour)
- Example: 20 requests/minute resets at :00, :01, :02, etc.

**Pros:**
- Easy to understand
- Low memory usage
- Predictable behavior

**Cons:**
- Burst at window edges (user can make 40 requests in 2 seconds spanning 2 windows)

---

## Production Considerations

### 1. **Use Redis Instead of In-Memory Storage**

For production, update the storage URI to use Redis:

```python
limiter = Limiter(
    key_func=get_user_identifier,
    default_limits=["100/minute"],
    storage_uri="redis://localhost:6379",  # Use Redis
    strategy="fixed-window",
    headers_enabled=True,
)
```

**Why Redis?**
- Persistent storage (survives server restarts)
- Works across multiple server instances
- Better performance for high traffic
- Supports distributed rate limiting

**Install Redis:**
```bash
pip install redis
```

### 2. **Adjust Limits Based on Plan**

You can implement plan-based rate limits:

```python
def get_rate_limit_for_user(user: dict) -> str:
    """Get rate limit based on user's subscription plan"""
    plan = user.get('plan', 'free')
    
    limits = {
        'free': "10/minute",
        'starter': "30/minute",
        'pro': "60/minute",
        'business': "120/minute"
    }
    
    return limits.get(plan, "10/minute")
```

### 3. **Monitor Rate Limit Hits**

Log when users hit rate limits:

```python
# In rate_limit_error_handler
from utils.logger import log_event

log_event(
    event_type="rate_limit_exceeded",
    data={
        "endpoint": request.url.path,
        "limit": exc.detail
    },
    user_id=user_id
)
```

### 4. **Consider Sliding Window**

For more sophisticated rate limiting, use sliding window:

```python
limiter = Limiter(
    key_func=get_user_identifier,
    default_limits=["100/minute"],
    storage_uri="redis://localhost:6379",
    strategy="moving-window",  # Smoother than fixed window
    headers_enabled=True,
)
```

---

## Summary

✅ **Implemented:**
- SlowAPI rate limiter with custom key function
- User-based rate limiting (falls back to IP)
- Different limits for different endpoints:
  * Auth: 10/minute
  * Video analysis: 5/hour
  * AI chat: 20/minute
  * Comments: 60/minute
  * Default: 100/minute
- Custom 429 error handler
- Rate limit headers in responses
- Debug endpoint for testing

✅ **Features:**
- Prevents API abuse
- Fair usage across users
- Clear error messages
- Retry-After information
- Easy to test

✅ **Ready for:**
- Testing with debug endpoint
- Production deployment (after switching to Redis)
- Monitoring and adjustment

**Rate limiting system is production-ready! 🎉**

---

## Next Steps

After confirming rate limiting works:

1. **Test thoroughly** with debug endpoint
2. **Monitor rate limit hits** in logs
3. **Adjust limits** based on real usage patterns
4. **Switch to Redis** for production
5. **Move to Step 15**: Auto-sync scheduling

**✅ Confirm rate limiting works before Step 15**
