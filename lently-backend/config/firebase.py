import firebase_admin
from firebase_admin import credentials, firestore, auth
from config.settings import settings
import os


# Initialize Firebase Admin SDK
def initialize_firebase():
    """
    Initialize Firebase Admin SDK with service account credentials.
    This should be called once when the application starts.
    """
    if not firebase_admin._apps:
        # Check if credentials file exists
        if os.path.exists(settings.firebase_credentials_path):
            cred = credentials.Certificate(settings.firebase_credentials_path)
            # Initialize with storage bucket
            firebase_admin.initialize_app(cred, {
                'storageBucket': 'lently-saas.appspot.com'
            })
            print("✅ Firebase Admin SDK initialized successfully")
        else:
            print(f"⚠️  Warning: Firebase credentials file not found at {settings.firebase_credentials_path}")
            print("   Firebase functionality will not work until credentials are provided.")
            # Initialize without credentials for development
            firebase_admin.initialize_app()


# Initialize Firebase on module import
initialize_firebase()

# Firestore client - will be initialized lazily
_db_instance = None


def get_db():
    """
    Get or create Firestore client instance.
    This is a lazy initialization to avoid errors when credentials are missing.
    """
    global _db_instance
    if _db_instance is None:
        try:
            _db_instance = firestore.client()
        except Exception as e:
            print(f"⚠️  Warning: Could not initialize Firestore client: {e}")
            print("   Make sure Firebase credentials are properly configured.")
            raise
    return _db_instance


def verify_token(token: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded token data.
    
    Args:
        token: Firebase ID token string
        
    Returns:
        dict: Decoded token containing user information including 'uid'
        
    Raises:
        Exception: If token is invalid or expired
    """
    try:
        # Verify the ID token
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except auth.InvalidIdTokenError:
        raise Exception("Invalid ID token")
    except auth.ExpiredIdTokenError:
        raise Exception("Token has expired")
    except auth.RevokedIdTokenError:
        raise Exception("Token has been revoked")
    except Exception as e:
        raise Exception(f"Token verification failed: {str(e)}")


def get_current_user_from_token(token: str) -> dict:
    """
    Verify Firebase token and fetch user data from Firestore.
    
    Args:
        token: Firebase ID token string
        
    Returns:
        dict: User data from Firestore with user_id included
        
    Raises:
        Exception: If token is invalid or user not found
    """
    # Verify the token first
    decoded_token = verify_token(token)
    user_id = decoded_token.get('uid')
    
    if not user_id:
        raise Exception("User ID not found in token")
    
    # Fetch user data from Firestore
    db = get_db()
    user_ref = db.collection('users').document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        # User doesn't exist in Firestore yet, return basic info from token
        display_name = decoded_token.get('name')
        return {
            'userId': user_id,
            'email': decoded_token.get('email'),
            'name': display_name,  # For routes that use 'name'
            'displayName': display_name,  # For consistency with Firestore
            'plan': 'free',
            'planExpiry': None,
            'videosAnalyzed': 0,
            'commentsAnalyzed': 0,
            'createdAt': None
        }
    
    # Return user data from Firestore
    user_data = user_doc.to_dict()
    user_data['userId'] = user_id  # Ensure userId is included
    
    return user_data
