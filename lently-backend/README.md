# Lenlty Backend API

AI-powered YouTube comment analysis SaaS backend built with FastAPI.

## Features

- 🚀 FastAPI web framework with automatic OpenAPI documentation
- 📊 Swagger UI and ReDoc for interactive API testing
- 🔐 Firebase authentication integration
- 🤖 AI-powered comment analysis with Google Gemini
- 💳 Payment processing with Lemonsqueezy
- 📧 Email notifications with Resend
- 🔄 Automatic comment syncing
- 📈 Analytics and insights

## Project Structure

```
lently-backend/
├── main.py                 # FastAPI application entry point
├── requirements.txt        # Python dependencies
├── .env                   # Environment variables (not in git)
├── config/
│   ├── __init__.py
│   └── settings.py        # Settings management with pydantic
└── README.md             # This file
```

## Setup Instructions

### Prerequisites

- Python 3.11 or higher
- pip package manager

### 1. Clone the Repository

```bash
cd lently-backend
```

### 2. Create Virtual Environment

**Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` in your terminal prompt.

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Edit the `.env` file and add your actual API keys and configuration:

```env
GOOGLE_CLOUD_PROJECT=your-project-id
FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json
GEMINI_API_KEY=your-gemini-api-key
YOUTUBE_API_KEY=your-youtube-api-key
LEMONSQUEEZY_API_KEY=your-lemonsqueezy-api-key
LEMONSQUEEZY_STORE_ID=your-store-id
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret
RESEND_API_KEY=your-resend-api-key
FRONTEND_URL=http://localhost:3000
ENVIRONMENT=dev
```

### 5. Run the Application

```bash
uvicorn main:app --reload
```

The API will be available at:
- **API Root:** http://localhost:8000
- **Swagger UI (Interactive Docs):** http://localhost:8000/docs
- **ReDoc (Alternative Docs):** http://localhost:8000/redoc

## Testing the API

### Using Swagger UI (Recommended)

1. Open http://localhost:8000/docs in your browser
2. You'll see an organized interface with all API endpoints
3. Click on any endpoint to expand it
4. Click "Try it out" to test the endpoint interactively
5. Fill in parameters and click "Execute"
6. View the response below

### Using curl

**Test root endpoint:**
```bash
curl http://localhost:8000/
```

**Test health check:**
```bash
curl http://localhost:8000/health
```

## API Documentation

The API is organized into the following sections:

- **Authentication** - User authentication and authorization
- **Videos** - Video management and analysis
- **Comments** - Comment browsing and filtering
- **AI Chat** - AI-powered chat and question answering
- **Alerts** - Alert management and notifications
- **AI Replies** - AI-generated reply suggestions
- **Analytics** - Analytics and insights (Business plan)
- **Users** - User profile and settings
- **Subscriptions** - Subscription and payment management
- **Webhooks** - Webhook endpoints for integrations
- **Cron** - Scheduled tasks and background jobs

## Development

### Running in Development Mode

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The `--reload` flag enables auto-reload on code changes.

### Project Status

✅ **Step 1 Complete:** Initial FastAPI Setup
- Project structure created
- Dependencies configured
- Settings management implemented
- Swagger UI enabled
- CORS middleware configured
- Root and health check endpoints working

## Next Steps

- Step 2: Firebase Integration
- Step 3: YouTube API Service
- Step 4: Gemini AI Analysis Service
- And more...

## Support

For issues or questions, please refer to the main project documentation.

---

Built with ❤️ using FastAPI
