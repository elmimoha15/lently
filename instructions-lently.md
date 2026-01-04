# Lenlty Backend - Python FastAPI Build Guide

**Build this step-by-step. Complete each step fully before moving to the next.**

---

## **STEP 1: Initial FastAPI Setup**

Create a Python FastAPI project with this structure:

```
lenlty-backend/
├── main.py
├── requirements.txt
├── .env
├── config/
│   ├── __init__.py
│   └── settings.py
└── README.md
```

**What to do:**
1. Create all folders and files listed above
2. **Create Python virtual environment:**
   - Open terminal in project root
   - Run: `python3 -m venv venv` (or `python -m venv venv` on Windows)
   - Activate it:
     * Linux/Mac: `source venv/bin/activate`
     * Windows: `venv\Scripts\activate`
   - You should see `(venv)` in your terminal prompt
3. In `requirements.txt`, add: fastapi, uvicorn[standard], python-dotenv, pydantic, pydantic-settings, httpx
4. In `.env`, add placeholder environment variables for:
   - GOOGLE_CLOUD_PROJECT
   - FIREBASE_CREDENTIALS_PATH
   - GEMINI_API_KEY
   - LEMONSQUEEZY_API_KEY
   - LEMONSQUEEZY_STORE_ID
   - LEMONSQUEEZY_WEBHOOK_SECRET
   - RESEND_API_KEY
   - FRONTEND_URL
   - ENVIRONMENT (dev/prod)
5. In `config/settings.py`, create a Settings class using pydantic-settings to load all environment variables with validation
6. In `main.py`, create a basic FastAPI app with:
   - **Enable Swagger UI** with custom configuration:
     * Title: "Lenlty API"
     * Description: "AI-powered YouTube comment analysis SaaS"
     * Version: "1.0.0"
     * Set `docs_url="/docs"` (Swagger UI)
     * Set `redoc_url="/redoc"` (ReDoc alternative)
     * Add API tags for organization: ["Authentication", "Videos", "Comments", "AI Chat", "Alerts", "AI Replies", "Analytics", "Users", "Subscriptions", "Webhooks", "Cron"]
   - CORS middleware enabled (allow credentials, allow all origins for dev)
   - Root endpoint "/" returning {"message": "Lenlty API is running", "docs": "/docs", "version": "1.0.0"}
   - Health check endpoint "/health" returning {"status": "healthy", "timestamp": current_time}

**How to test:**
- Make sure virtual environment is activated (you see `(venv)` in terminal)
- Run `pip install -r requirements.txt`
- Run `uvicorn main:app --reload`
- Visit `http://localhost:8000` - should see welcome message with links
- **Visit `http://localhost:8000/docs`** - should see **beautiful Swagger UI interface** with:
  * Organized API sections by tags
  * Interactive "Try it out" buttons for each endpoint
  * Request/response examples
  * Schema definitions
- Visit `http://localhost:8000/redoc` - alternative documentation view

**✅ Confirm this works before Step 2**

---

## **STEP 2: Firebase Integration**

Add Firebase Admin SDK for authentication and Firestore database.

**What to do:**
1. Add `firebase-admin` to requirements.txt
2. Download Firebase service account key JSON from Firebase Console and save it in project root
3. Create `config/firebase.py` that:
   - Initializes Firebase Admin SDK with credentials from FIREBASE_CREDENTIALS_PATH
   - Creates a Firestore client (db)
   - Has function `verify_token(token)` that verifies Firebase ID tokens and returns decoded token with user_id
   - Has function `get_current_user_from_token(token)` that verifies token and fetches user data from Firestore `/users/{userId}`

4. Create `middleware/auth.py` that:
   - Defines async function `get_current_user(authorization: str = Header(None))` that:
     - Extracts token from "Bearer {token}" format
     - Calls verify_token() to validate
     - Fetches user from Firestore
     - Raises 401 HTTPException if invalid
     - Returns user dict

5. Create `models/user.py` with Pydantic models:
   - `UserProfile`: userId, email, displayName, plan (free/starter/pro/business), planExpiry, videosAnalyzed, commentsAnalyzed, createdAt

6. Create `routes/auth.py`:
   - GET endpoint `/api/auth/me` that uses get_current_user dependency and returns user profile
   - **Add Swagger documentation**:
     * Tag: "Authentication"
     * Summary: "Get current user profile"
     * Description: "Returns the authenticated user's profile information"
     * Response examples for 200 (success) and 401 (unauthorized)

7. Register auth router in `main.py` with tag "Authentication"

**How to test:**
- Get a Firebase ID token from your frontend
- **Open Swagger UI**: `http://localhost:8000/docs`
- Find "Authentication" section
- Click on `GET /api/auth/me`
- Click "Try it out"
- Add Authorization header: `Bearer <your_token>`
- Click "Execute"
- Should see user profile response below
- Alternatively: Call from terminal: `curl -H "Authorization: Bearer <token>" http://localhost:8000/api/auth/me`

**✅ Confirm authentication works before Step 3**

---

## **STEP 3: YouTube API Service**

Create service to fetch video metadata and comments from YouTube.

**What to do:**
1. Add `google-api-python-client` to requirements.txt
2. Add `YOUTUBE_API_KEY` to .env and settings.py
3. Create `services/youtube_service.py` with class `YouTubeService`:
   - Initialize with YouTube API key from settings
   - Method `extract_video_id(url: str)` that:
     - Extracts video ID from various YouTube URL formats (youtube.com/watch?v=, youtu.be/, etc.)
     - Returns video_id string
     - Raises ValueError if invalid URL
   
   - Method `get_video_metadata(video_id: str)` that:
     - Uses YouTube Data API videos.list endpoint
     - Requests parts: snippet, statistics
     - Returns dict with: title, description, thumbnailUrl, channelName, viewCount, likeCount, commentCount, publishedAt, duration
     - Caches result in memory or Firestore for 1 hour
     - On error, returns None
   
   - Method `get_comments(video_id: str, page_token=None, max_results=100, published_after=None)` that:
     - Uses commentThreads.list endpoint
     - Supports pagination with pageToken
     - Supports filtering by publishedAfter for incremental sync
     - Returns dict with: comments (list), nextPageToken
     - Each comment has: id, author, authorChannelId, text, likeCount, replyCount, publishedAt
     - Handles "comments disabled" error gracefully
   
   - Method `get_all_comments(video_id: str, published_after=None)` that:
     - Loops through all pages using pagination
     - Collects all comments into single list
     - Returns complete list of comments

4. Create `models/video.py` with:
   - `VideoMetadata`: youtubeVideoId, title, description, thumbnailUrl, channelName, viewCount, likeCount, commentCount, publishedAt
   - `Comment`: youtubeCommentId, author, authorChannelId, text, likeCount, replyCount, publishedAt

5. Create `routes/videos.py`:
   - POST endpoint `/api/videos/validate` that:
     - Uses auth middleware
     - Accepts body: {"youtubeUrl": "..."}
     - Extracts video ID
     - Fetches metadata
     - Returns VideoMetadata
     - Returns 404 if video not found

6. Register videos router in main.py

**How to test:**
- Call `POST /api/videos/validate` with a YouTube URL
- Should return video metadata (title, views, comment count, etc.)
- Try invalid URL - should return 400 error

**✅ Confirm YouTube API works before Step 4**

---

## **STEP 4: Gemini AI Analysis Service**

Create service to analyze comments using Google Gemini AI.

**What to do:**
1. Add `google-generativeai` to requirements.txt
2. Create `services/gemini_service.py` with class `GeminiService`:
   - Initialize with Gemini API key from settings
   - Configure to use model: "gemini-1.5-flash"
   - Method `analyze_comments_batch(comments: list, batch_size=50)` that:
     - Processes comments in batches (50 per API call)
     - For each batch, creates prompt asking AI to analyze and return JSON array
     - For each comment return:
       * category: question|praise|complaint|spam|suggestion|neutral
       * sentimentScore: -1.0 to 1.0
       * sentimentLabel: positive|neutral|negative
       * toxicityScore: 0.0 to 1.0
       * extractedQuestion: string (if category is question)
     - Uses temperature=0.3 for consistent results
     - Parses JSON response (strip markdown formatting)
     - Validates each response matches input order
     - Returns list of analysis results
     - On error, logs and returns partial results with error flag
   
   - Method `answer_question(question: str, relevant_comments: list, conversation_history=None)` that:
     - Takes user question about their comments
     - Takes filtered/relevant comments only (not all 10,000!)
     - Takes last 3 conversation turns for context (sliding window)
     - Creates prompt asking AI to answer question based on comments
     - Limits response to 300 tokens
     - Returns dict with: answer, confidence, relatedCommentIds
     - Tracks token usage and cost

3. Create `models/analysis.py` with:
   - `CommentAnalysis`: category, sentimentScore, sentimentLabel, toxicityScore, extractedQuestion
   - `AnalysisRequest`: comments (list of comment objects)
   - `AnalysisResponse`: analyses (list), tokensUsed, cost, success, error

4. Create `routes/analysis.py`:
   - POST endpoint `/api/analysis/analyze-batch` that:
     - Uses auth middleware
     - Accepts AnalysisRequest
     - Calls gemini_service.analyze_comments_batch()
     - Returns AnalysisResponse

5. Register analysis router in main.py

**How to test:**
- Fetch some YouTube comments (from Step 3)
- Call `POST /api/analysis/analyze-batch` with the comments
- Should return analysis for each comment (category, sentiment, toxicity)

**✅ Confirm AI analysis works before Step 5**

---

## **STEP 5: Video Analysis Workflow**

Create the main workflow: validate → fetch comments → analyze → store results.

**What to do:**
1. Create `models/sync_job.py` with:
   - `SyncJob`: jobId, userId, videoId, status (queued|processing|completed|failed), progress (0-100), totalComments, processedComments, error, createdAt, completedAt
   - `AnalyzeVideoRequest`: youtubeUrl
   - `AnalyzeVideoResponse`: jobId, videoId, estimatedTime

2. Create `services/sync_service.py` with class `SyncService`:
   - Method `create_sync_job(user_id, youtube_url)` that:
     - Generates unique jobId
     - Extracts video ID from URL
     - Fetches video metadata
     - Creates video document in Firestore `/videos/{videoId}`:
       - userId, youtubeVideoId, title, description, thumbnailUrl, viewCount, commentCount, syncStatus='queued', syncProgress=0, createdAt
     - Creates job document in Firestore `/sync_jobs/{jobId}`:
       - userId, videoId, status='queued', progress=0, createdAt
     - Returns jobId and videoId
   
   - Method `update_job_progress(job_id, progress, status, processed_comments)` that:
     - Updates job document with new progress and status
   
   - Method `process_sync_job(job_id)` that:
     - Gets job from Firestore
     - Updates status to 'processing', progress to 10
     - Fetches all comments from YouTube (with pagination)
     - Updates progress to 50
     - Stores raw comments in Firestore `/comments/{commentId}`:
       - videoId, userId, youtubeCommentId, author, text, likeCount, publishedAt, analyzed=false
     - Analyzes comments in batches with Gemini
     - Updates each comment with analysis results
     - Updates progress to 95
     - Calculates aggregate stats (total by category, avg sentiment)
     - Updates video document with stats
     - Updates job status to 'completed', progress to 100
     - On error, updates job status to 'failed' with error message

3. Create `routes/videos.py` (continue from Step 3):
   - POST endpoint `/api/videos/analyze` that:
     - Uses auth middleware
     - Checks user plan limits (free: 1 video, starter: 5, pro: 20, business: 100)
     - Accepts AnalyzeVideoRequest
     - Calls sync_service.create_sync_job()
     - Queues background task to process_sync_job()
     - Returns AnalyzeVideoResponse with jobId immediately
   
   - GET endpoint `/api/sync-jobs/{job_id}` that:
     - Uses auth middleware
     - Fetches job from Firestore
     - Verifies job.userId matches current user (else 403)
     - Returns SyncJob status
   
   - GET endpoint `/api/videos` that:
     - Uses auth middleware
     - Lists user's analyzed videos from Firestore
     - Returns list with basic info (title, sentiment, comment count, sync status)
   
   - GET endpoint `/api/videos/{video_id}` that:
     - Uses auth middleware
     - Verifies video.userId matches current user
     - Returns complete video data with stats

**How to test:**
- Call `POST /api/videos/analyze` with a YouTube URL
- Should return jobId immediately
- Poll `GET /api/sync-jobs/{jobId}` every 3 seconds
- Should see progress: 0 → 10 → 50 → 95 → 100
- Final status should be 'completed'
- Call `GET /api/videos/{videoId}` - should return analyzed video with stats

**✅ Confirm end-to-end video analysis works before Step 6**

---

## **STEP 6: Comments Endpoints**

Create endpoints to browse and filter analyzed comments.

**What to do:**
1. Create `models/comment.py` with:
   - `Comment`: id, videoId, youtubeCommentId, author, text, likeCount, publishedAt, category, sentimentScore, sentimentLabel, toxicityScore, extractedQuestion
   - `CommentFilters`: category, sentiment, minToxicity, search, sortBy, order
   - `CommentsListResponse`: comments (list), total, page, limit, hasMore

2. Create `routes/comments.py`:
   - GET endpoint `/api/videos/{video_id}/comments` that:
     - Uses auth middleware
     - Verifies user owns video
     - Query params: limit (default 20, max 100), offset, category, sentiment, minToxicity, search, sortBy, order
     - Queries Firestore `/comments` with filters applied
     - Returns CommentsListResponse with paginated results
   
   - GET endpoint `/api/comments/{comment_id}` that:
     - Uses auth middleware
     - Fetches single comment
     - Verifies user owns parent video
     - Returns Comment

3. Register comments router in main.py

**How to test:**
- Get comments for an analyzed video: `GET /api/videos/{videoId}/comments`
- Filter by category: `GET /api/videos/{videoId}/comments?category=question`
- Search comments: `GET /api/videos/{videoId}/comments?search=camera`
- Should return filtered and paginated results

**✅ Confirm comment browsing works before Step 7**

---

## **STEP 7: Ask AI Feature**

Create AI chat interface where users can ask questions about their comments.

**What to do:**
1. Create `models/ai_chat.py` with:
   - `AskAIRequest`: videoId, question, conversationId (optional)
   - `AskAIResponse`: answer, confidence, relatedCommentIds, remainingQuestions, cached
   - `ConversationTurn`: role (user|assistant), content, timestamp

2. Create `services/ai_chat_service.py` with class `AIChatService`:
   - Method `classify_question_intent(question: str)` that:
     - Uses Gemini to quickly classify question
     - Returns: "complaints"|"questions"|"praise"|"suggestions"|"specific_topic"|"general"
     - This helps filter relevant comments (context pruning!)
   
   - Method `get_relevant_comments(video_id: str, question_intent: str, question: str, limit=100)` that:
     - Based on intent, filters comments from Firestore:
       - "complaints" → only category='complaint'
       - "questions" → only category='question'
       - "specific_topic" → text search for keywords
       - "general" → sample from all categories
     - Returns max 100 relevant comments (not all 10,000!)
     - Saves 98% on token costs!
   
   - Method `get_conversation_history(user_id: str, video_id: str, limit=3)` that:
     - Fetches last 3 conversation turns from Firestore
     - Returns list of ConversationTurn
   
   - Method `answer_question(user_id, video_id, question, conversation_id)` that:
     - Classifies question intent
     - Gets relevant comments (context pruning)
     - Gets conversation history (sliding window)
     - Calls gemini_service.answer_question()
     - Saves conversation turn to Firestore `/conversations/{conversationId}/turns`
     - Returns answer with metadata

3. Create `services/cache_service.py` with:
   - Method `get_cached_answer(video_id: str, question: str)` that:
     - Checks Firestore `/answer_cache/{videoId}` for pre-generated answers
     - Common questions cached when video analysis completes:
       - "What are people complaining about?"
       - "What questions are people asking?"
       - "What do people love most?"
       - "What content should I make next?"
       - "Show me toxic comments"
     - Returns cached answer if exists, else None
   
   - Method `cache_answer(video_id: str, question: str, answer: str)` that:
     - Stores answer in cache for future use

4. Create `middleware/check_ai_quota.py`:
   - Function `check_ai_question_quota(user: dict = Depends(get_current_user))` that:
     - Gets user's plan limits (free: 3, starter: 20, pro: 100, business: 500 questions/month)
     - Checks user's aiQuestionsUsed this month
     - If exceeded, raises 403 HTTPException with "Upgrade to {plan}" message
     - Returns user if quota available

5. Create `routes/ai_chat.py`:
   - POST endpoint `/api/ai/chat` that:
     - Uses auth middleware and check_ai_question_quota
     - Accepts AskAIRequest
     - Verifies user owns video
     - Checks cache first (80% hit rate!)
     - If cached, returns immediately with cached=true (FREE!)
     - Else calls ai_chat_service.answer_question()
     - Increments user's aiQuestionsUsed counter
     - Returns AskAIResponse
   
   - GET endpoint `/api/ai/suggestions` that:
     - Returns list of suggested questions user can ask
     - Returns: ["What are people complaining about?", "What questions...", etc.]

6. Register ai_chat router in main.py

**How to test:**
- Ask common question: "What are people complaining about?"
  - Should return cached answer instantly (no AI call, free!)
- Ask novel question: "What do people think about the audio?"
  - Should analyze relevant comments and return answer
  - Check token usage is low (only 50-100 comments sent, not 10,000)
- Free user asks 4th question → 403 error with upgrade message

**✅ Confirm Ask AI feature works before Step 8**

---

## **STEP 8: User Management & Plan Limits**

Create user profile management and enforce tier-based limits.

**What to do:**
1. Create `models/user.py` (extend from Step 2) with:
   - `PlanLimits`: videosPerMonth, commentsPerVideo, totalComments, aiQuestionsPerMonth, reSyncsPerMonth, autoSync
   - `UserUsage`: videosAnalyzed, commentsAnalyzed, aiQuestionsUsed, reSyncsUsed, resetDate

2. Create `utils/constants.py` with:
   - PLAN_LIMITS dict defining limits for each tier:
     ```python
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
             'videosPerMonth': 5,
             'commentsPerVideo': 2500,
             'totalComments': 2500,
             'aiQuestionsPerMonth': 20,
             'reSyncsPerMonth': 5,
             'autoSync': False
         },
         'pro': {
             'videosPerMonth': 20,
             'commentsPerVideo': 10000,
             'totalComments': 10000,
             'aiQuestionsPerMonth': 100,
             'reSyncsPerMonth': 20,
             'autoSync': True
         },
         'business': {
             'videosPerMonth': 100,
             'commentsPerVideo': 50000,
             'totalComments': 50000,
             'aiQuestionsPerMonth': 500,
             'reSyncsPerMonth': 100,
             'autoSync': True
         }
     }
     
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
     ```

3. Create `services/user_service.py` with class `UserService`:
   - Method `get_or_create_user(user_id: str, email: str)` that:
     - Tries to get user from Firestore `/users/{userId}`
     - If doesn't exist, creates with: email, plan='free', planExpiry=None, usage counters=0, createdAt
     - Returns user profile
   
   - Method `check_plan_limit(user_id: str, limit_type: str)` that:
     - Gets user and their plan limits
     - Checks specific limit (videosPerMonth, aiQuestionsPerMonth, etc.)
     - Checks if resetDate has passed (monthly reset)
     - Returns True if within limit, False if exceeded
   
   - Method `increment_usage(user_id: str, usage_type: str)` that:
     - Increments specific usage counter in Firestore
   
   - Method `reset_monthly_usage(user_id: str)` that:
     - Resets all usage counters to 0
     - Updates resetDate to first day of next month

4. Create `routes/users.py`:
   - POST endpoint `/api/users/init` that:
     - Uses auth middleware
     - Gets user email from Firebase token
     - Calls user_service.get_or_create_user()
     - Returns user profile
   
   - GET endpoint `/api/users/profile` that:
     - Uses auth middleware
     - Returns current user profile with usage stats
   
   - GET endpoint `/api/users/limits` that:
     - Uses auth middleware
     - Returns plan limits and current usage
     - Shows remaining quota for each feature

5. Update `/api/videos/analyze` to check videosPerMonth limit before processing
6. Update `/api/ai/chat` to check aiQuestionsPerMonth limit (already done in Step 7)

7. Register users router in main.py

**How to test:**
- Call `POST /api/users/init` - creates user with free plan
- Call `GET /api/users/limits` - shows 1 video, 3 AI questions available
- Analyze 1 video - success
- Try 2nd video - 403 error "Upgrade to Starter for 5 videos/month"
- Ask 3 AI questions - success
- Try 4th question - 403 error with upgrade message

**✅ Confirm plan limits work before Step 9**

---

## **STEP 9: Lemonsqueezy Payment Integration**

Create subscription endpoints and webhook handler for Lemonsqueezy payments.

**What to do:**
1. Create `services/payment_service.py` with class `PaymentService`:
   - Initialize with Lemonsqueezy API keys from settings
   - Method `create_payment_link(user_id: str, plan: str, billing_cycle: str)` that:
     - Calculates amount based on plan and billing cycle:
       - starter: $12/month or $115/year (20% discount)
       - pro: $27/month or $259/year (20% discount)
       - business: $58/month or $557/year (20% discount)
     - Calls Lemonsqueezy API to create checkout session
     - Stores pending payment in Firestore `/payments/{paymentId}`:
       - userId, plan, amount, billingCycle, status='pending', createdAt
     - Returns checkout URL and order ID
   
   - Method `verify_payment(order_id: str)` that:
     - Calls Lemonsqueezy API to verify order
     - Returns payment status and details
   
   - Method `activate_subscription(user_id: str, plan: str, billing_cycle: str)` that:
     - Updates user in Firestore: plan={plan}, planExpiry=date in 30/365 days
     - Resets usage counters to 0
     - Sends confirmation email (optional)
   
   - Method `cancel_subscription(user_id: str)` that:
     - Marks subscription as cancelled
     - User keeps access until planExpiry
     - Updates user: subscriptionCancelled=true

2. Create `routes/webhooks.py`:
   - POST endpoint `/api/webhooks/lemonsqueezy` (NO auth required):
     - Verifies webhook signature using Lemonsqueezy webhook secret
     - If invalid signature, returns 401
     - Parses event type from payload
     - If event is "order_created" or "subscription_payment_success":
       - Extracts order_id and customer email
       - Finds user by email in Firestore
       - Verifies payment with payment_service.verify_payment()
       - If verified, calls payment_service.activate_subscription()
       - Updates payment status to 'completed'
     - If event is "subscription_cancelled":
       - Finds user by customer email
       - Calls payment_service.cancel_subscription()
     - Logs event to Firestore `/webhook_logs`
     - Returns 200 immediately (don't block webhook)

3. Create `routes/subscriptions.py`:
   - GET endpoint `/api/subscriptions/plans` (public, no auth):
     - Returns list of available plans with features and pricing
   
   - POST endpoint `/api/subscriptions/create` that:
     - Uses auth middleware
     - Accepts: plan, billingCycle
     - Validates plan upgrade/downgrade
     - Calls payment_service.create_payment_link()
     - Returns checkout URL
   
   - GET endpoint `/api/subscriptions/status` that:
     - Uses auth middleware
     - Returns current subscription status (plan, expiry, cancelled)
   
   - POST endpoint `/api/subscriptions/cancel` that:
     - Uses auth middleware
     - Calls payment_service.cancel_subscription()
     - Returns confirmation

4. Register webhooks and subscriptions routers in main.py

**How to test:**
- Get available plans: `GET /api/subscriptions/plans`
- Create subscription: `POST /api/subscriptions/create` with plan="pro"
- Should return Lemonsqueezy checkout URL
- Complete payment on Lemonsqueezy checkout page
- Webhook should trigger and upgrade user to Pro
- Verify: `GET /api/users/profile` - plan should be "pro"
- Use Lemonsqueezy webhook testing tool to send test events

**✅ Confirm payment integration works before Step 10**

---

## **STEP 10: Email Notifications**

Add email service using Resend for transactional emails.

**What to do:**
1. Add `resend` to requirements.txt
2. Create `services/email_service.py` with class `EmailService`:
   - Initialize with Resend API key from settings
   - Method `send_email(to: str, subject: str, html: str)` that:
     - Calls Resend API to send email
     - From: "Lenlty <noreply@lenlty.io>"
     - Logs sent email to Firestore `/email_logs`
     - On error, logs to error logs
   
   - Method `send_analysis_complete(user_email: str, video_title: str, video_id: str)` that:
     - Sends "Your video analysis is complete!" email
     - Includes: video title, total comments, link to dashboard
     - Uses HTML template
   
   - Method `send_welcome_email(user_email: str, user_name: str)` that:
     - Sends welcome email to new users
     - Explains features, provides getting started guide
   
   - Method `send_quota_exceeded(user_email: str, limit_type: str, plan: str)` that:
     - Sends "You've reached your limit" email
     - Explains which limit was hit
     - Includes upgrade CTA with link to pricing
   
   - Method `send_subscription_activated(user_email: str, plan: str, expiry_date: str)` that:
     - Sends "Welcome to {plan}!" email
     - Lists new features unlocked
     - Includes billing info

3. Update sync_service.py:
   - After successful video analysis, call email_service.send_analysis_complete()

4. Update user_service.py:
   - After creating new user, call email_service.send_welcome_email()

5. Update payment_service.py:
   - After activating subscription, call email_service.send_subscription_activated()

**How to test:**
- Analyze a video - should receive "Analysis complete" email
- Hit a quota limit - should receive "Quota exceeded" email
- Upgrade plan - should receive "Welcome to Pro" email
- Check inbox for all emails

**✅ Confirm email notifications work before Step 11**

---

## **STEP 11: Alerts System**

Create automatic alert detection for comment spikes, sentiment drops, toxic comments, and viral comments.

**What to do:**
1. Create `models/alert.py` with:
   - `Alert`: alertId, userId, videoId, type, severity, title, message, data (dict), isRead, readAt, createdAt
   - `AlertType` enum: COMMENT_SPIKE, SENTIMENT_DROP, TOXIC_DETECTED, VIRAL_COMMENT
   - `Severity` enum: LOW, MEDIUM, HIGH, CRITICAL

2. Create `services/alert_service.py` with class `AlertService`:
   - Method `check_comment_spike(video_id: str, user_id: str)` that:
     - Gets video's normal comment rate (avg comments per hour in last 7 days)
     - Gets current comment rate (last 1 hour)
     - If current rate is 5x or more than normal, creates alert
     - Alert data: normalRate, currentRate, multiplier
     - Severity: HIGH if 5-10x, CRITICAL if 10x+
   
   - Method `check_sentiment_drop(video_id: str, user_id: str)` that:
     - Gets yesterday's average sentiment
     - Gets today's average sentiment
     - If dropped by 30% or more, creates alert
     - Alert data: previousSentiment, currentSentiment, dropPercentage
     - Severity: MEDIUM if 30-50%, HIGH if 50%+
   
   - Method `check_toxic_comments(video_id: str, user_id: str)` that:
     - Counts comments with toxicityScore > 0.7 in last 24 hours
     - If 3+ toxic comments detected, creates alert
     - Alert data: toxicCount, toxicComments (sample of 3)
     - Severity: HIGH
   
   - Method `check_viral_comment(video_id: str, user_id: str, comment: dict)` that:
     - Checks if new comment has 500+ likes (or 10x video average)
     - Creates alert if viral
     - Alert data: commentText, likeCount, author
     - Severity: MEDIUM
   
   - Method `create_alert(user_id: str, video_id: str, alert_type: str, severity: str, title: str, message: str, data: dict)` that:
     - Checks if similar alert already exists (don't duplicate)
     - Creates alert document in Firestore `/alerts/{alertId}`
     - Sends email notification if severity is HIGH or CRITICAL
     - Returns alertId
   
   - Method `run_alert_checks(video_id: str, user_id: str)` that:
     - Runs all alert checks
     - Called after video analysis completes
     - Called after incremental sync completes

3. Create `routes/alerts.py`:
   - GET endpoint `/api/alerts` that:
     - Uses auth middleware
     - Query params: limit, offset, type, severity, isRead
     - Returns paginated list of user's alerts
   
   - PUT endpoint `/api/alerts/{alert_id}/read` that:
     - Uses auth middleware
     - Verifies alert belongs to user
     - Marks alert as read
     - Updates readAt timestamp
   
   - POST endpoint `/api/alerts/mark-all-read` that:
     - Uses auth middleware
     - Marks all unread alerts as read
     - Returns count of updated alerts
   
   - DELETE endpoint `/api/alerts/{alert_id}` that:
     - Uses auth middleware
     - Verifies alert belongs to user
     - Deletes alert

4. Update `services/sync_service.py`:
   - In `process_sync_job()`, after analysis completes, call `alert_service.run_alert_checks()`
   - In `incremental_sync()`, after sync completes, call `alert_service.run_alert_checks()`

5. Register alerts router in main.py

**How to test:**
- Analyze video with recent comment spike → Alert created
- Analyze video with sentiment drop → Alert created
- Analyze video with 3+ toxic comments → Alert created
- Analyze video with viral comment (500+ likes) → Alert created
- Call `GET /api/alerts` → See all alerts
- Mark alert as read → isRead becomes true
- Verify email sent for HIGH/CRITICAL alerts

**✅ Confirm alerts system works before Step 12**

---

## **STEP 12: AI Replies Feature**

Create feature to generate and save professional replies to common questions.

**What to do:**
1. Create `models/ai_reply.py` with:
   - `AIReply`: replyId, userId, question, replyText, timesAsked, videoIds (where question appeared), useCount, lastUsedAt, createdAt
   - `GenerateReplyRequest`: question, videoContext (optional: channelName, videoTitle)
   - `AIReplyResponse`: replyId, question, replyText, timesAsked

2. Create `services/ai_reply_service.py` with class `AIReplyService`:
   - Method `generate_reply(user_id: str, question: str, video_context: dict)` that:
     - Uses Gemini to generate professional, brand-safe reply
     - Prompt includes: question, channel name, video title, tone (helpful, friendly)
     - Max 200 tokens
     - Returns generated reply text
   
   - Method `save_reply(user_id: str, question: str, reply_text: str, video_ids: list)` that:
     - Checks if reply for this question already exists
     - If exists, increments timesAsked counter and adds new videoIds
     - If not, creates new reply document in Firestore `/ai_replies/{replyId}`
     - Returns replyId
   
   - Method `get_user_replies(user_id: str)` that:
     - Fetches all saved replies for user
     - Sorts by useCount (most used first)
     - Returns list of replies
   
   - Method `increment_use_count(reply_id: str)` that:
     - Increments useCount by 1
     - Updates lastUsedAt timestamp
   
   - Method `extract_common_questions(video_id: str)` that:
     - Queries comments where category='question'
     - Groups similar questions together
     - Returns top 10 most asked questions with count

3. Create `routes/ai_replies.py`:
   - GET endpoint `/api/ai-replies` that:
     - Uses auth middleware
     - Returns all user's saved replies
     - Sorted by useCount descending
   
   - POST endpoint `/api/ai-replies/generate` that:
     - Uses auth middleware (Pro+ plan required)
     - Accepts GenerateReplyRequest
     - Calls ai_reply_service.generate_reply()
     - Saves to Firestore
     - Returns AIReplyResponse
   
   - PUT endpoint `/api/ai-replies/{reply_id}` that:
     - Uses auth middleware
     - Accepts updated reply text
     - Updates reply in Firestore
     - Returns updated reply
   
   - DELETE endpoint `/api/ai-replies/{reply_id}` that:
     - Uses auth middleware
     - Verifies reply belongs to user
     - Deletes reply
   
   - POST endpoint `/api/ai-replies/{reply_id}/use` that:
     - Uses auth middleware
     - Calls ai_reply_service.increment_use_count()
     - Returns success
   
   - GET endpoint `/api/videos/{video_id}/common-questions` that:
     - Uses auth middleware
     - Calls ai_reply_service.extract_common_questions()
     - Returns list of most asked questions with counts

4. Update `services/sync_service.py`:
   - In `process_sync_job()`, after analysis completes, call `extract_common_questions()` and auto-generate replies for top 3 questions

5. Register ai_replies router in main.py

**How to test:**
- After analyzing video, check `/api/videos/{videoId}/common-questions` → Should show top questions
- Generate reply: `POST /api/ai-replies/generate` with question → Should return professional reply
- Get all replies: `GET /api/ai-replies` → Should return saved replies
- Edit reply → Should update successfully
- Mark reply as used → useCount should increment
- Free user tries to generate reply → 403 error

**✅ Confirm AI replies feature works before Step 13**

---

## **STEP 13: Error Handling & Logging**

Add comprehensive error handling and logging system.

**What to do:**
1. Create `utils/logger.py` with:
   - Function `log_error(error: Exception, context: dict)` that:
     - Saves to Firestore `/error_logs`:
       - message, stack trace, context (userId, videoId, service, endpoint), timestamp
     - Also prints to console for Cloud Logging
   
   - Function `log_event(event_type: str, data: dict)` that:
     - Saves to Firestore `/event_logs`
     - Track events: user_signup, video_analyzed, subscription_upgraded, etc.

2. Create `middleware/error_handler.py`:
   - Global exception handler that:
     - Catches all unhandled exceptions
     - Logs with logger.log_error()
     - Returns 500 error with generic message (don't expose internals)
     - Includes error_id for support

3. Update all service files:
   - Wrap operations in try-except blocks
   - Call logger.log_error() with context
   - Return user-friendly error messages

4. Create custom exceptions in `utils/exceptions.py`:
   - `QuotaExceededException`: 403, "Quota exceeded, upgrade to {plan}"
   - `VideoNotFoundException`: 404, "Video not found"
   - `UnauthorizedException`: 401, "Unauthorized"
   - `InvalidInputException`: 400, "Invalid input"

5. Register error handler middleware in main.py

**How to test:**
- Cause an intentional error (e.g., invalid YouTube URL)
- Check Firestore `/error_logs` - error should be logged
- Check response - should be user-friendly, not raw stack trace

**✅ Confirm error handling works before Step 14**

---

## **STEP 14: Rate Limiting**

Add rate limiting to prevent abuse.

**What to do:**
1. Add `slowapi` to requirements.txt
2. Create `middleware/rate_limiter.py`:
   - Configure SlowAPI rate limiter
   - Different limits for different endpoints:
     - Auth endpoints: 10 requests/minute per IP
     - Video analysis: 5 requests/hour per user
     - Ask AI: 20 requests/minute per user
     - Comments: 60 requests/minute per user
     - General: 100 requests/minute per user

3. Apply rate limiting to routes:
   - Add `@limiter.limit("10/minute")` decorator to auth endpoints
   - Add `@limiter.limit("5/hour")` to `/api/videos/analyze`
   - Add `@limiter.limit("20/minute")` to `/api/ai/chat`
   - Add `@limiter.limit("60/minute")` to comment endpoints

4. Handle rate limit exceeded:
   - Return 429 status code
   - Include Retry-After header
   - Clear error message: "Rate limit exceeded. Try again in X seconds."

5. Register rate limiter in main.py

**How to test:**
- Make rapid requests to an endpoint
- Should get 429 error after hitting limit
- Wait for cooldown period
- Should work again

**✅ Confirm rate limiting works before Step 15**

---

## **STEP 15: Auto-Sync Scheduling (Pro+ Feature)**

Implement automatic periodic syncing for Pro and Business users.

**What to do:**
1. Create `services/scheduler_service.py` with class `SchedulerService`:
   - Method `schedule_auto_syncs()` that:
     - Queries all users where plan='pro' OR plan='business'
     - For each user, gets their videos
     - For Pro users: schedules weekly sync (if 7+ days since last sync)
     - For Business users: schedules daily sync (if 1+ day since last sync)
     - Only syncs videos that have new comments (check YouTube API count first)
     - Creates sync jobs for eligible videos
     - Limits: max 5 videos per user per run (prevent overwhelming system)
   
   - Method `should_auto_sync(video: dict, user_plan: str)` that:
     - Checks video.lastSyncedAt
     - Pro: returns True if lastSyncedAt > 7 days ago
     - Business: returns True if lastSyncedAt > 1 day ago
     - Free/Starter: returns False (no auto-sync)
   
   - Method `check_for_new_comments(video_id: str)` that:
     - Quickly calls YouTube API to get current comment count
     - Compares with video.commentCountAnalyzed
     - Returns True if new comments exist, False otherwise
     - Saves API quota by not fetching actual comments

2. Create Cloud Scheduler job (or cron endpoint):
   - Create endpoint `POST /api/cron/auto-sync` (internal only, no public access)
   - Verify request is from Cloud Scheduler (check header)
   - Calls scheduler_service.schedule_auto_syncs()
   - Logs results (how many videos synced)
   - Returns 200

3. Configure Cloud Scheduler:
   - Job name: "lenlty-auto-sync"
   - Schedule: "0 2 * * *" (runs daily at 2 AM UTC)
   - Target: POST /api/cron/auto-sync
   - Timezone: UTC

4. Update user settings to allow enabling/disabling auto-sync:
   - Add field to user document: autoSyncEnabled (default: true for Pro+)
   - Add endpoint `PUT /api/users/settings/auto-sync` to toggle this setting
   - Only schedule auto-syncs if autoSyncEnabled=true

5. Add `middleware/verify_cron.py`:
   - Function that verifies request is from Cloud Scheduler
   - Checks X-Cloudscheduler header
   - Raises 403 if not from Cloud Scheduler

6. Register cron endpoint in main.py (with cron middleware)

**How to test:**
- Upgrade user to Pro plan
- Analyze video, wait 8 days (or manually update lastSyncedAt to 8 days ago)
- Manually trigger cron: `POST /api/cron/auto-sync`
- Verify incremental sync job created for video
- Check job completes successfully
- Verify Free/Starter users are NOT auto-synced
- Business user: sync should trigger after 1 day

**✅ Confirm auto-sync scheduling works before Step 16**

---

## **STEP 16: Subscription Downgrade Handler**

Add automatic downgrade for expired/cancelled subscriptions.

**What to do:**
1. Update `services/payment_service.py`:
   - Method `downgrade_expired_subscriptions()` that:
     - Queries all users where planExpiry < today AND plan != 'free'
     - For each user:
       - Updates user: plan='free', planExpiry=null
       - Resets limits to Free tier (maxCredits=2, etc.)
       - Resets usage counters to 0
       - Logs downgrade event
       - Sends "Your subscription has expired" email
     - Returns count of users downgraded
   
   - Method `handle_credit_rollover(user_id: str, old_plan: str, new_plan: str)` that:
     - Gets user's current usage stats
     - Calculates remaining credits: maxCredits - creditsUsed
     - If upgrading (starter→pro, pro→business):
       - Adds remaining credits to new plan's limits
       - Example: Starter user has 3 unused videos, upgrades to Pro
       - New limit: 20 (Pro) + 3 (unused) = 23 videos
     - If downgrading: unused credits are lost (no rollover down)
     - Updates user's maxCredits with adjusted amount

2. Update `activate_subscription()` method in payment_service.py:
   - Before activating new plan, call `handle_credit_rollover()`
   - This ensures unused credits carry over on upgrades

3. Create Cloud Scheduler job for downgrade checks:
   - Endpoint `POST /api/cron/check-expired-subscriptions` (internal only)
   - Verifies request from Cloud Scheduler
   - Calls payment_service.downgrade_expired_subscriptions()
   - Logs results
   - Returns 200

4. Configure Cloud Scheduler:
   - Job name: "lenlty-check-expired-subscriptions"
   - Schedule: "0 1 * * *" (runs daily at 1 AM UTC, before auto-sync)
   - Target: POST /api/cron/check-expired-subscriptions

5. Update Lemonsqueezy webhook handler:
   - Add handler for "subscription_cancelled" event
   - Don't immediately downgrade (user paid until expiry)
   - Update user: subscriptionCancelled=true, cancelledAt=now
   - Send "Subscription cancelled" email
   - Explain: "You have access until {planExpiry date}"
   - The cron job will downgrade on expiry date

6. Register cron endpoint in main.py

**How to test:**
- Set user's planExpiry to yesterday
- Manually trigger cron: `POST /api/cron/check-expired-subscriptions`
- Verify user downgraded to Free plan
- Verify email sent
- Test credit rollover:
   - Starter user with 3 unused videos upgrades to Pro
   - Should have 23 videos (20 + 3)
- Test cancellation:
   - Simulate webhook: subscription.cancelled
   - User should keep access until planExpiry
   - After expiry, cron job downgrades to Free

**✅ Confirm subscription management works before Step 17**

---

## **STEP 17: Analytics Dashboard (Business Only)**

Create analytics endpoints to track engagement trends and comment patterns over time.

**What to do:**
1. Create `models/analytics.py` with:
   - `VideoAnalytics`: videoId, date, totalComments, newComments, avgSentiment, categoryBreakdown, topQuestions, engagementScore
   - `AnalyticsSummary`: totalVideos, totalComments, avgSentiment, sentimentTrend (last 30 days), categoryDistribution, topVideos, weekOverWeekGrowth
   - `SentimentTrend`: date, avgSentiment, commentCount

2. Create `services/analytics_service.py` with class `AnalyticsService`:
   - Method `calculate_video_analytics(video_id: str)` that:
     - Gets all comments for video
     - Calculates daily metrics:
       - Comments per day
       - Average sentiment per day
       - Category breakdown per day
     - Stores in Firestore `/video_analytics/{videoId}/{date}`
     - Called after video analysis completes
   
   - Method `get_user_analytics_summary(user_id: str)` that:
     - Aggregates data from all user's videos
     - Calculates:
       - Total videos analyzed
       - Total comments analyzed
       - Overall average sentiment
       - Sentiment trend (last 30 days) - array of {date, avgSentiment}
       - Category distribution across all videos
       - Top 5 videos by engagement (sentiment * comment count)
       - Week-over-week growth (% change from last week)
     - Caches result in Firestore `/analytics_cache/{userId}` for 1 hour
     - Returns AnalyticsSummary
   
   - Method `get_video_analytics_timeline(video_id: str, days: int)` that:
     - Fetches daily analytics for video
     - Returns timeline data for charts:
       - Comment growth over time
       - Sentiment changes over time
       - Category trends
   
   - Method `get_cached_analytics(user_id: str)` that:
     - Checks cache timestamp
     - Returns cached data if < 1 hour old
     - Returns None if stale or doesn't exist

3. Create `middleware/check_business_feature.py`:
   - Function that checks if user has Business plan
   - Raises 403 with "Upgrade to Business for Analytics" if not

4. Create `routes/analytics.py`:
   - GET endpoint `/api/analytics/summary` that:
     - Uses auth middleware and check_business_feature
     - Checks cache first
     - If cache miss, calls analytics_service.get_user_analytics_summary()
     - Caches result
     - Returns AnalyticsSummary
   
   - GET endpoint `/api/analytics/videos/{video_id}/timeline` that:
     - Uses auth middleware and check_business_feature
     - Query param: days (default 30, max 90)
     - Verifies user owns video
     - Calls analytics_service.get_video_analytics_timeline()
     - Returns timeline data for frontend charts
   
   - GET endpoint `/api/analytics/sentiment-trend` that:
     - Uses auth middleware and check_business_feature
     - Returns sentiment trend across all videos (last 30 days)
     - Data format: [{date: "2024-12-01", sentiment: 0.45}, ...]
   
   - GET endpoint `/api/analytics/category-breakdown` that:
     - Uses auth middleware and check_business_feature
     - Returns category distribution across all videos
     - Format: {questions: 245, praise: 567, complaints: 123, ...}

5. Update `services/sync_service.py`:
   - After video analysis completes, call `analytics_service.calculate_video_analytics()`

6. Register analytics router in main.py

**How to test:**
- Free/Pro user tries to access analytics → 403 error
- Business user:
   - Analyze multiple videos
   - Call `GET /api/analytics/summary` → Returns aggregated stats
   - Call `GET /api/analytics/videos/{videoId}/timeline` → Returns daily data
   - Second call within 1 hour → Returns cached data (faster)
   - Call `GET /api/analytics/sentiment-trend` → Returns 30-day trend
- Verify all calculations are accurate
- Verify caching works (check Firestore timestamps)

**✅ Confirm analytics dashboard works before Step 18**

---

## **STEP 17: Incremental Sync Feature**

Add ability to re-sync videos to fetch only new comments (cost optimization!).

**What to do:**
1. Update `services/sync_service.py`:
   - Method `incremental_sync(video_id: str, user_id: str)` that:
     - Gets video from Firestore
     - Gets video.lastSyncedAt timestamp
     - Calls youtube_service.get_all_comments() with publishedAfter=lastSyncedAt
     - Only fetches comments newer than last sync!
     - If no new comments, returns early (saves money!)
     - Analyzes only new comments with Gemini
     - Updates video stats (incremental, don't recalculate all)
     - Updates video.lastSyncedAt to now
     - Returns: newCommentsCount, totalCommentsNow, cost

2. Create `middleware/check_resync_quota.py`:
   - Function that checks user's reSyncsUsed against plan limit
   - If exceeded, raises 403 with upgrade message

3. Update `routes/videos.py`:
   - POST endpoint `/api/videos/{video_id}/sync` that:
     - Uses auth middleware and check_resync_quota
     - Verifies user owns video
     - Checks if video already syncing (prevent duplicates)
     - Calls sync_service.incremental_sync()
     - Increments user's reSyncsUsed counter
     - Returns: newCommentsCount, status

**How to test:**
- Analyze video with 500 comments
- Wait (or manually add comments to video)
- Call `POST /api/videos/{videoId}/sync`
- Should only analyze new comments (not all 500 again!)
- Verify cost is much lower (only new comments analyzed)
- Free user tries to re-sync → 403 "Upgrade to Starter for 5 re-syncs/month"

**✅ Confirm incremental sync works before Step 19**

---

## **STEP 19: Pre-Generated Answer Caching**

When video analysis completes, pre-generate answers to common questions (80% cache hit rate!).

**What to do:**
1. Update `services/sync_service.py`:
   - After video analysis completes in process_sync_job(), add step:
     - Call `generate_common_answers(video_id)`
   
   - Method `generate_common_answers(video_id: str)` that:
     - Defines 5 common questions:
       1. "What are people complaining about?"
       2. "What questions are people asking?"
       3. "What do people love most?"
       4. "What content should I make next?"
       5. "Show me toxic comments"
     - For each question:
       - Gets relevant comments
       - Calls gemini_service.answer_question()
       - Stores answer in video document: preGeneratedAnswers[question] = answer
     - Does this ONCE during analysis (not every time user asks)
     - Costs ~$0.005 but saves 80% of future AI calls!

2. Update `services/ai_chat_service.py`:
   - In answer_question(), check video.preGeneratedAnswers first
   - If question matches (exact or similar), return cached answer
   - Mark response with cached=true
   - This is FREE for user!

**How to test:**
- Analyze a new video
- After completion, check Firestore - video should have preGeneratedAnswers
- Ask common question: "What are people complaining about?"
- Should return instantly (no AI call, free!)
- Response should have cached=true
- Ask novel question - should use AI

**✅ Confirm answer caching works before Step 20**

---

## **STEP 20: Swagger UI Documentation & Testing**

Add comprehensive API documentation to all endpoints and test everything through Swagger UI.

**What to do:**
1. Update ALL route files to include proper Swagger documentation:
   
   **For each endpoint, add:**
   - `tags=["Category"]` - Groups endpoints (Authentication, Videos, Comments, etc.)
   - `summary="Short description"` - Shows in collapsed view
   - `description="Detailed explanation"` - Shows in expanded view
   - `response_model=ResponseSchema` - Defines response structure
   - `responses` - Document different status codes (200, 400, 401, 403, 404, 500)
   
   **Example format for each route:**
   ```python
   @router.get(
       "/api/videos",
       tags=["Videos"],
       summary="List user's analyzed videos",
       description="Returns paginated list of videos analyzed by the authenticated user with filters",
       response_model=VideoListResponse,
       responses={
           200: {"description": "Success - returns list of videos"},
           401: {"description": "Unauthorized - invalid or missing token"},
           500: {"description": "Server error"}
       }
   )
   ```

2. Add request/response examples to Pydantic models:
   - Use `Config` class with `schema_extra` to add examples
   - Shows realistic data in Swagger UI
   - Makes it easier to test
   
   **Example:**
   ```python
   class AnalyzeVideoRequest(BaseModel):
       youtubeUrl: str
       
       class Config:
           schema_extra = {
               "example": {
                   "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
               }
           }
   ```

3. Document authentication requirements:
   - Add security scheme in main.py:
     ```python
     app = FastAPI(
         title="Lenlty API",
         description="AI-powered YouTube comment analysis",
         version="1.0.0",
         # Add this:
         swagger_ui_parameters={
             "defaultModelsExpandDepth": -1,  # Hide schemas by default
             "persistAuthorization": True,    # Remember auth between refreshes
         }
     )
     ```
   - Add "Authorize" button support in Swagger UI
   - Users can enter Firebase token once, applies to all requests

4. Organize endpoints with proper tags:
   - **Authentication**: /api/auth/* endpoints
   - **Videos**: /api/videos/* endpoints
   - **Comments**: /api/videos/{id}/comments, /api/comments/* endpoints
   - **AI Chat**: /api/ai/chat, /api/ai/suggestions
   - **Alerts**: /api/alerts/* endpoints
   - **AI Replies**: /api/ai-replies/* endpoints
   - **Analytics**: /api/analytics/* endpoints (Business only)
   - **Users**: /api/users/* endpoints
   - **Subscriptions**: /api/subscriptions/* endpoints
   - **Webhooks**: /api/webhooks/* endpoints
   - **Cron Jobs**: /api/cron/* endpoints (internal)
   - **Monitoring**: /health, / endpoints

5. Add comprehensive testing checklist in Swagger UI:

   **Test each endpoint through Swagger UI:**
   
   a) **Authentication Flow:**
      - Get Firebase token from frontend
      - Click "Authorize" button in Swagger UI (top right)
      - Enter: `Bearer <your_token>`
      - Click "Authorize" to save
      - Test `GET /api/auth/me` - should return your profile
   
   b) **Video Analysis Flow:**
      - Test `POST /api/videos/validate` with YouTube URL
      - Test `POST /api/videos/analyze` - should return jobId
      - Test `GET /api/sync-jobs/{jobId}` - poll until complete
      - Test `GET /api/videos` - should list your videos
      - Test `GET /api/videos/{videoId}` - should show details
   
   c) **Comments Flow:**
      - Test `GET /api/videos/{videoId}/comments` - list all comments
      - Test with filters: `?category=question`
      - Test with search: `?search=camera`
      - Test pagination: `?limit=10&offset=0`
   
   d) **AI Chat Flow:**
      - Test `GET /api/ai/suggestions` - get suggested questions
      - Test `POST /api/ai/chat` with common question - should use cache
      - Test with novel question - should analyze and respond
      - Verify `remainingQuestions` decreases
   
   e) **Alerts Flow:**
      - Test `GET /api/alerts` - list alerts
      - Test `PUT /api/alerts/{alertId}/read` - mark as read
      - Test `POST /api/alerts/mark-all-read`
      - Test `DELETE /api/alerts/{alertId}`
   
   f) **AI Replies Flow:**
      - Test `GET /api/videos/{videoId}/common-questions`
      - Test `POST /api/ai-replies/generate` with question
      - Test `GET /api/ai-replies` - list saved replies
      - Test `PUT /api/ai-replies/{replyId}` - edit reply
      - Test `POST /api/ai-replies/{replyId}/use` - increment usage
   
   g) **Analytics Flow (Business users only):**
      - Test `GET /api/analytics/summary` - should show stats
      - Test `GET /api/analytics/sentiment-trend`
      - Test `GET /api/analytics/videos/{videoId}/timeline`
      - Test cache: second call should be instant
   
   h) **User Management:**
      - Test `POST /api/users/init` - initialize profile
      - Test `GET /api/users/profile` - get profile
      - Test `GET /api/users/limits` - check quota
   
   i) **Subscription Flow:**
      - Test `GET /api/subscriptions/plans` - list plans
      - Test `POST /api/subscriptions/create` - get payment link
      - Test `GET /api/subscriptions/status`
   
   j) **Error Testing:**
      - Remove Authorization header, try protected endpoint → 401
      - Try invalid YouTube URL → 400
      - Try accessing another user's video → 403
      - Try exceeding quota → 429

6. Add helpful descriptions for common errors:
   - 400: "Invalid request format or parameters"
   - 401: "Authentication required - provide valid Firebase token"
   - 403: "Permission denied - upgrade plan or check ownership"
   - 404: "Resource not found"
   - 429: "Rate limit exceeded or quota reached"
   - 500: "Server error - check logs"

7. Test all endpoints systematically:
   - Go through each tag section in Swagger UI
   - Test success cases
   - Test error cases
   - Verify response formats match schemas
   - Check that examples are helpful

**How to test:**
- Open `http://localhost:8000/docs` - should see organized Swagger UI
- Click "Authorize" button - enter Firebase token
- Expand each section (Authentication, Videos, etc.)
- Click any endpoint → "Try it out" → Fill parameters → "Execute"
- Should see:
  * Request URL
  * Curl command
  * Response body
  * Response headers
  * Status code
- Test at least 2-3 endpoints from each category
- Verify all error codes work (try without auth, invalid data, etc.)
- Check ReDoc view: `http://localhost:8000/redoc` - cleaner alternative

**Benefits of Swagger UI testing:**
- ✅ No need for Postman or curl commands
- ✅ See all endpoints in one place
- ✅ Interactive testing with "Try it out"
- ✅ Automatic request examples
- ✅ See response schemas
- ✅ Test authentication easily
- ✅ Share API docs with frontend team

**✅ Confirm all endpoints work in Swagger UI before Step 21**

---

## **STEP 21: Deployment Preparation**

Prepare backend for production deployment on Google Cloud Run.

**What to do:**
1. Create `Dockerfile`:
   ```dockerfile
   FROM python:3.11-slim
   
   WORKDIR /app
   
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   
   COPY . .
   
   EXPOSE 8080
   
   CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
   ```

2. Create `.dockerignore`:
   ```
   __pycache__
   *.pyc
   .env
   serviceAccountKey.json
   .git
   venv
   .pytest_cache
   ```

3. Create `cloudbuild.yaml`:
   ```yaml
   steps:
     - name: 'gcr.io/cloud-builders/docker'
       args: ['build', '-t', 'gcr.io/$PROJECT_ID/lenlty-backend', '.']
     - name: 'gcr.io/cloud-builders/docker'
       args: ['push', 'gcr.io/$PROJECT_ID/lenlty-backend']
     - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
       entrypoint: gcloud
       args:
         - 'run'
         - 'deploy'
         - 'lenlty-backend'
         - '--image=gcr.io/$PROJECT_ID/lenlty-backend'
         - '--region=us-central1'
         - '--platform=managed'
         - '--allow-unauthenticated'
         - '--min-instances=1'
         - '--max-instances=100'
         - '--memory=512Mi'
   ```

4. Update `main.py` for production:
   - Set CORS origins to specific frontend domain (not "*")
   - Add startup event to verify Firebase connection
   - Add shutdown event for cleanup

5. Create `README.md` with:
   - Setup instructions
   - Environment variables needed
   - Local development guide
   - Deployment steps
   - API documentation link

**How to test:**
- Build Docker image: `docker build -t lenlty-backend .`
- Run locally: `docker run -p 8080:8080 lenlty-backend`
- Test all endpoints still work at `localhost:8080`
- Deploy to Cloud Run (if ready)

**✅ Confirm Docker setup works before Step 22**

---

## **STEP 22: Final Integration Testing**

Test complete end-to-end workflows with all features including alerts, AI replies, analytics, and auto-sync.

**What to do:**
1. Test Free User Flow:
   - Sign up/login → profile created with plan='free'
   - Analyze video with 400 comments → success
   - Check alerts → Should see alerts if patterns detected
   - Try to generate AI reply → 403 "Upgrade to Pro"
   - Try to access analytics → 403 "Upgrade to Business"
   - Try to analyze 2nd video → 403 "Upgrade to Starter"
   - Ask 3 AI questions → success (2 cached, 1 generated)
   - Try 4th AI question → 403 "Upgrade to Starter"
   - Try to re-sync video → 403 "Feature not available on Free plan"
   - Check limits: `GET /api/users/limits` - shows 0 remaining

2. Test Starter User Flow:
   - Simulate Lemonsqueezy webhook (order_created or subscription_payment_success, plan=starter)
   - Verify credit rollover (if had unused credits from Free)
   - Verify user upgraded to Starter
   - Analyze 5 videos → all succeed
   - Check alerts for all videos
   - Try to generate AI replies → 403 still (Pro+ feature)
   - Try 6th video → 403 "Upgrade to Pro"
   - Ask 20 AI questions → all succeed
   - Try 21st question → 403 "Upgrade to Pro"
   - Re-sync video 5 times → all succeed
   - Try 6th re-sync → 403
   - No auto-sync (not available for Starter)

3. Test Pro User Flow:
   - Upgrade to Pro via webhook
   - Verify credit rollover (unused Starter videos carry over)
   - Analyze 20 videos → all succeed
   - Generate AI replies for common questions → success
   - Get saved replies → returns all generated replies
   - Use a saved reply → useCount increments
   - Check alerts across all videos
   - Try to access analytics → 403 "Upgrade to Business"
   - Try 21st video → 403 "Upgrade to Business"
   - Ask 100 AI questions → all succeed
   - Most common questions use cache (free!)
   - Re-sync videos 20 times → all succeed
   - Auto-sync: manually set lastSyncedAt to 8 days ago, trigger cron → video should auto-sync

4. Test Business User Flow:
   - Upgrade to Business
   - Verify credit rollover works
   - Analyze 100 videos → all succeed
   - Generate AI replies → success
   - Access analytics dashboard → success, shows aggregated data
   - Get sentiment trend → returns 30-day chart data
   - Get video timeline analytics → returns daily breakdown
   - Cache test: second analytics call within 1 hour → instant response
   - Ask 500 AI questions → all succeed
   - Re-sync 100 times → all succeed
   - Auto-sync: set lastSyncedAt to 2 days ago, trigger cron → should sync

5. Test Alerts System:
   - Analyze video with comment spike (5x normal) → COMMENT_SPIKE alert created, HIGH severity
   - Analyze video with sentiment drop (40% drop) → SENTIMENT_DROP alert created
   - Analyze video with 5 toxic comments → TOXIC_DETECTED alert created
   - Analyze video with viral comment (1000+ likes) → VIRAL_COMMENT alert created
   - Get alerts: `GET /api/alerts` → returns all alerts
   - Mark alert as read → isRead becomes true
   - Delete alert → alert removed
   - Verify HIGH/CRITICAL alerts sent emails

6. Test AI Replies Feature:
   - After analysis, get common questions: `GET /api/videos/{videoId}/common-questions`
   - Generate reply: `POST /api/ai-replies/generate` → returns professional reply
   - Edit reply → updates successfully
   - Use reply → useCount increments
   - Get all replies sorted by usage → most used appears first
   - Auto-generation: verify top 3 questions get auto-replies after analysis

7. Test Analytics (Business only):
   - Multiple videos analyzed with varied sentiment
   - Get summary: should show accurate totals, averages
   - Get sentiment trend: 30 days of data, shows ups and downs
   - Get category breakdown: accurate percentages
   - Get video timeline: daily comment/sentiment changes
   - Verify cache works (fast second call)

8. Test Auto-Sync:
   - Pro user: video synced 8+ days ago → cron triggers sync
   - Business user: video synced 2+ days ago → cron triggers sync
   - Free/Starter: no auto-sync triggered
   - Only syncs videos with new comments (checks YouTube count first)
   - Disabled videos (autoSyncEnabled=false) → not synced

9. Test Subscription Management:
   - Downgrade test: set planExpiry to yesterday, trigger cron → user downgraded to Free
   - Credit rollover on upgrade: unused credits carry over
   - Cancellation: webhook triggers, user keeps access until expiry
   - After expiry: cron downgrades to Free

10. Test Error Scenarios:
    - Invalid YouTube URL → 400 "Invalid URL format"
    - Video not found → 404 "Video not found"
    - Comments disabled → handled gracefully, no error
    - Gemini API error → job marked failed, user notified
    - YouTube API quota exceeded → error logged, retry later
    - Expired Firebase token → 401 "Unauthorized"
    - Access another user's video → 403 "Forbidden"
    - Access another user's alerts → 403 "Forbidden"

11. Test Cost Optimization:
    - Common AI questions use cache (80% hit rate)
    - Incremental sync only analyzes new comments (saves 90%+)
    - Context pruning sends max 100 comments to AI (not 10,000)
    - Pre-generated answers used when possible
    - Verify token usage is low
    - Auto-sync checks for new comments first (saves API quota)

12. Load Testing:
    - Submit 10 videos simultaneously → all process successfully
    - Submit 50 AI questions simultaneously → all respond within 5 seconds
    - Trigger cron jobs → handle multiple users efficiently
    - No race conditions on quota checking
    - No race conditions on alert creation (no duplicates)

**How to test:**
- Run through all flows manually or with automated tests
- Verify Firestore data is correct
- Check error logs for any issues
- Verify emails are sent
- Check webhook logs
- Verify all alerts created correctly
- Verify analytics calculations accurate
- Verify auto-sync runs on schedule
- Verify credit rollover math is correct

**✅ All tests pass → Backend complete with all features!**

---

## **Final Production Checklist**

Before going live:

- [ ] All environment variables set in Cloud Run
- [ ] Firebase service account key uploaded to Secret Manager
- [ ] Firestore security rules deployed
- [ ] Firestore indexes created for all queries
- [ ] CORS origins set to production frontend domain only
- [ ] Rate limiting configured and tested
- [ ] Lemonsqueezy webhook URL registered in Lemonsqueezy dashboard
- [ ] YouTube API quota sufficient (request increase if needed)
- [ ] Gemini API quota and billing configured
- [ ] Resend domain verified for emails
- [ ] Error logging and monitoring enabled (Cloud Logging)
- [ ] All endpoints tested end-to-end
- [ ] Load testing passed
- [ ] Documentation complete
- [ ] Backup strategy in place (Firestore automatic backups)
- [ ] Security review completed
- [ ] Cost monitoring alerts configured

**Backend is production-ready! 🚀**

---

## **API Endpoints Summary**

### **Authentication**
- `GET /api/auth/me` - Get current user profile

### **Videos**
- `POST /api/videos/validate` - Validate YouTube URL
- `POST /api/videos/analyze` - Start video analysis
- `GET /api/videos` - List user's videos
- `GET /api/videos/{video_id}` - Get video details
- `POST /api/videos/{video_id}/sync` - Re-sync video (fetch new comments)
- `GET /api/videos/{video_id}/common-questions` - Get most asked questions

### **Comments**
- `GET /api/videos/{video_id}/comments` - List comments with filters
- `GET /api/comments/{comment_id}` - Get single comment

### **AI Chat**
- `POST /api/ai/chat` - Ask AI about comments
- `GET /api/ai/suggestions` - Get suggested questions

### **Alerts** ⭐ NEW
- `GET /api/alerts` - List user's alerts
- `PUT /api/alerts/{alert_id}/read` - Mark alert as read
- `POST /api/alerts/mark-all-read` - Mark all alerts as read
- `DELETE /api/alerts/{alert_id}` - Delete alert

### **AI Replies** ⭐ NEW
- `GET /api/ai-replies` - List saved replies
- `POST /api/ai-replies/generate` - Generate new reply (Pro+)
- `PUT /api/ai-replies/{reply_id}` - Edit reply
- `DELETE /api/ai-replies/{reply_id}` - Delete reply
- `POST /api/ai-replies/{reply_id}/use` - Mark reply as used

### **Analytics** ⭐ NEW (Business only)
- `GET /api/analytics/summary` - Get aggregated analytics
- `GET /api/analytics/videos/{video_id}/timeline` - Get video timeline data
- `GET /api/analytics/sentiment-trend` - Get sentiment trend (30 days)
- `GET /api/analytics/category-breakdown` - Get category distribution

### **Users**
- `POST /api/users/init` - Initialize user profile
- `GET /api/users/profile` - Get user profile
- `GET /api/users/limits` - Get plan limits and usage
- `PUT /api/users/settings/auto-sync` - Toggle auto-sync (Pro+)

### **Subscriptions**
- `GET /api/subscriptions/plans` - List available plans
- `POST /api/subscriptions/create` - Create subscription
- `GET /api/subscriptions/status` - Get subscription status
- `POST /api/subscriptions/cancel` - Cancel subscription

### **Webhooks**
- `POST /api/webhooks/lemonsqueezy` - Handle payment webhooks

### **Sync Jobs**
- `GET /api/sync-jobs/{job_id}` - Get job status

### **Cron Jobs** ⭐ NEW (internal only)
- `POST /api/cron/auto-sync` - Trigger auto-sync for Pro+ users
- `POST /api/cron/check-expired-subscriptions` - Check and downgrade expired subs

### **Monitoring**
- `GET /health` - Health check
- `GET /` - API status

---

**Total estimated build time:** 3-4 weeks (22 complete steps)  
**Tech stack:** FastAPI, Firebase, YouTube API, Gemini AI, Flutterwave, Resend, Cloud Scheduler  
**Cost per user:** ~$0.10-0.40/month  
**Profit margin:** 95-98% ✅

**Features included:**
✅ Video analysis with AI categorization  
✅ Sentiment & toxicity detection  
✅ Ask AI chat with smart context pruning  
✅ Alerts system (spikes, sentiment drops, toxic comments)  
✅ AI-generated replies to common questions  
✅ Analytics dashboard (Business tier)  
✅ Auto-sync scheduling (Pro/Business tiers)  
✅ Subscription management with credit rollover  
✅ **Interactive Swagger UI for testing**  
✅ Rate limiting & error handling  
✅ Email notifications  
✅ Plan-based quotas  

**You're ready to build the complete Lenlty backend! 🎯**