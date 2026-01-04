from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from datetime import datetime
from config.settings import settings
from routes import auth, videos, analysis, comments, ai_chat, users, alerts, ai_replies, debug, youtube_oauth, replies, profile
from middleware.error_handler import ErrorHandlerMiddleware
from middleware.rate_limiter import limiter, rate_limit_error_handler
from slowapi.errors import RateLimitExceeded

# Create FastAPI app with custom Swagger UI configuration
app = FastAPI(
    title="Lenlty API",
    description="AI-powered YouTube comment analysis SaaS",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "Authentication", "description": "User authentication and authorization"},
        {"name": "Videos", "description": "Video management and analysis"},
        {"name": "Comments", "description": "Comment browsing and filtering"},
        {"name": "AI Chat", "description": "AI-powered chat and question answering"},
        {"name": "Alerts", "description": "Alert management and notifications"},
        {"name": "AI Replies", "description": "AI-generated reply suggestions"},
        {"name": "Analytics", "description": "Analytics and insights (Business plan)"},
        {"name": "Users", "description": "User profile and settings"},
        {"name": "Subscriptions", "description": "Subscription and payment management"},
        {"name": "Webhooks", "description": "Webhook endpoints for integrations"},
        {"name": "Cron", "description": "Scheduled tasks and background jobs"},
    ],
    swagger_ui_parameters={
        "defaultModelsExpandDepth": -1,  # Hide schemas by default
        "persistAuthorization": True,    # Remember auth between refreshes
    }
)


def custom_openapi():
    """
    Customize OpenAPI schema to add Bearer token authentication.
    This makes Swagger UI show the Authorize button and send the token with requests.
    """
    if app.openapi_schema:
        return app.openapi_schema
    
    # Generate the base OpenAPI schema
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Add security scheme for Bearer token authentication
    openapi_schema.setdefault("components", {})
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter your Firebase ID token here (without 'Bearer ' prefix)"
        }
    }
    
    # Apply security requirement to ALL /api/* paths
    for path, path_item in openapi_schema.get("paths", {}).items():
        if path.startswith("/api/"):
            # Apply to each HTTP method in this path
            for method_name in ["get", "post", "put", "delete", "patch", "options", "head"]:
                if method_name in path_item:
                    path_item[method_name]["security"] = [{"BearerAuth": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema


# Set custom OpenAPI schema generator
app.openapi = custom_openapi

# Add rate limiter state to app
app.state.limiter = limiter

# Add rate limit exceeded error handler
app.add_exception_handler(RateLimitExceeded, rate_limit_error_handler)

# Add global error handler middleware (must be added before CORS)
app.add_middleware(ErrorHandlerMiddleware)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.environment == "dev" else [settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(videos.router)
app.include_router(analysis.router)
app.include_router(comments.router)
app.include_router(ai_chat.router)
app.include_router(users.router)
app.include_router(alerts.router)
app.include_router(ai_replies.router)
app.include_router(youtube_oauth.router)  # YouTube OAuth for reply posting
app.include_router(replies.router)  # Reply posting
app.include_router(profile.router)  # Profile management
app.include_router(debug.router)  # Debug routes for testing error handling


@app.get(
    "/",
    tags=["Monitoring"],
    summary="Root endpoint",
    description="Returns API status and links to documentation"
)
async def root():
    """
    Welcome endpoint that provides basic API information and documentation links.
    """
    return {
        "message": "Lenlty API is running",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get(
    "/health",
    tags=["Monitoring"],
    summary="Health check endpoint",
    description="Returns the health status of the API with current timestamp"
)
async def health_check():
    """
    Health check endpoint for monitoring and uptime verification.
    Returns current server status and timestamp.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat()
    }


# Startup event
@app.on_event("startup")
async def startup_event():
    """
    Initialize services and connections on application startup.
    """
    print(f"🚀 Lenlty API starting up...")
    print(f"📝 Environment: {settings.environment}")
    print(f"📚 API Documentation: http://localhost:8000/docs")
    print(f"📖 ReDoc Documentation: http://localhost:8000/redoc")


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """
    Clean up resources on application shutdown.
    """
    print("👋 Lenlty API shutting down...")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
