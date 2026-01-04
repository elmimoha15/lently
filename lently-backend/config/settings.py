from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Uses pydantic-settings for validation and type checking.
    """
    
    # Google Cloud Configuration
    google_cloud_project: str
    
    # Firebase Configuration
    firebase_credentials_path: str
    
    # API Keys
    gemini_api_key: str
    youtube_api_key: str
    
    # YouTube OAuth Configuration (for posting replies)
    youtube_client_id: Optional[str] = None
    youtube_client_secret: Optional[str] = None
    youtube_redirect_uri: Optional[str] = None
    
    # Lemonsqueezy Payment Configuration
    lemonsqueezy_api_key: str
    lemonsqueezy_store_id: str
    lemonsqueezy_webhook_secret: str
    
    # Resend Email Configuration
    resend_api_key: str
    
    # Application Configuration
    frontend_url: str
    environment: str = "dev"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )


# Create a global settings instance
settings = Settings()
