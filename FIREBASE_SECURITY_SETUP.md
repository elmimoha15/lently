# 🔐 Firebase Security Setup Guide

This guide helps you set up Firebase Admin credentials securely using environment variables instead of committing JSON files to Git.

## 🚨 Important Security Note

**NEVER commit Firebase service account JSON files to Git!** This exposes your private keys and could compromise your entire Firebase project.

## 🛠️ Setup Instructions

### Step 1: Get Your Firebase Service Account Key

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`lently-saas`)
3. Click the gear icon → **Project Settings**
4. Go to the **Service Accounts** tab
5. Click **Generate New Private Key**
6. Download the JSON file (keep it secure and local only)

### Step 2: Extract Values from JSON

Open the downloaded JSON file and extract these values:

```json
{
  "type": "service_account",
  "project_id": "lently-saas",
  "private_key_id": "YOUR_PRIVATE_KEY_ID_HERE",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@lently-saas.iam.gserviceaccount.com",
  "client_id": "YOUR_CLIENT_ID_HERE",
  ...
}
```

### Step 3: Update Your Environment Variables

#### Option A: Using Individual Environment Variables (Recommended)

Create or update your `lently-backend/.env` file:

```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=lently-saas

# Firebase Configuration - Individual Environment Variables
FIREBASE_PRIVATE_KEY_ID=your_private_key_id_here
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@lently-saas.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your_client_id_here

# IMPORTANT: Private key formatting
# The private key MUST include \n for newlines - DO NOT use actual newlines
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC4Hk1q...\n-----END PRIVATE KEY-----\n"

# Other API keys...
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key
LEMONSQUEEZY_API_KEY=your_lemonsqueezy_api_key
LEMONSQUEEZY_STORE_ID=your_store_id
LEMONSQUEEZY_WEBHOOK_SECRET=your_webhook_secret
RESEND_API_KEY=your_resend_api_key
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=dev
```

**🔥 Critical: Private Key Formatting**

The private key in environment variables must use `\n` for line breaks, not actual newlines:

✅ **Correct:**
```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG...\n-----END PRIVATE KEY-----\n"
```

❌ **Wrong:**
```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG...
-----END PRIVATE KEY-----"
```

#### Option B: Base64 Encoded JSON (Good for deployment platforms)

If your deployment platform handles multiline environment variables poorly, encode the entire JSON as base64:

```bash
# Encode the JSON file to base64
cat your-firebase-service-account.json | base64 -w 0

# Add to .env
FIREBASE_CREDENTIALS_BASE64=ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOi...
```

#### Option C: JSON File Path (Fallback - Development Only)

**⚠️ Only use this for local development. Never commit JSON files to Git!**

```bash
FIREBASE_CREDENTIALS_PATH=./path-to-your-firebase-key.json
```

### Step 4: Test Your Setup

1. **Delete the old JSON file** from your project directory
2. **Restart your backend server**
3. **Check the logs** for successful Firebase initialization:

```bash
cd lently-backend
source venv/bin/activate  # or your virtual environment activation
python main.py
```

Look for:
```
✅ Firebase Admin SDK initialized from environment variables
```

### Step 5: Verify Authentication Works

Test that Firebase authentication is working:

```bash
# Test the health endpoint
curl http://localhost:8000/health

# Test a protected endpoint (should require authentication)
curl http://localhost:8000/api/users/profile
```

## 🚀 Deployment Setup

### Heroku

```bash
# Set each environment variable
heroku config:set GOOGLE_CLOUD_PROJECT=lently-saas
heroku config:set FIREBASE_PRIVATE_KEY_ID=your_private_key_id
heroku config:set FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@lently-saas.iam.gserviceaccount.com
heroku config:set FIREBASE_CLIENT_ID=your_client_id
heroku config:set FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### Railway/Render

Use their dashboard to set environment variables, or use base64 encoding for easier handling.

### Docker

```dockerfile
# In your Dockerfile or docker-compose.yml
ENV FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

## 🔍 Troubleshooting

### Common Issues

1. **"Firebase credentials not configured"**
   - Check that environment variables are set correctly
   - Verify the private key format (use `\n` not actual newlines)

2. **"Invalid private key"**
   - Check for missing `\n` characters in the private key
   - Ensure quotes around the private key value

3. **"Permission denied"**
   - Verify the service account has the correct roles
   - Check that the project ID matches your Firebase project

### Testing Individual Components

```bash
# Test environment variable loading
python -c "from config.settings import settings; print(f'Project: {settings.google_cloud_project}')"

# Test Firebase initialization
python -c "from config.firebase import initialize_firebase; initialize_firebase()"
```

## 🛡️ Security Best Practices

1. **Never commit credentials to Git**
2. **Use different service accounts for different environments**
3. **Regularly rotate your service account keys**
4. **Limit service account permissions to only what's needed**
5. **Monitor service account usage in Firebase Console**

## 📁 File Structure After Setup

```
lently-backend/
├── .env                          # ✅ Contains environment variables
├── .gitignore                    # ✅ Excludes .env and *.json files
├── config/
│   ├── firebase.py              # ✅ Updated to use env vars
│   └── settings.py              # ✅ Updated with new env var fields
└── your-firebase-key.json       # ❌ DELETE THIS FILE
```

---

**🎉 You're Done!** Your Firebase credentials are now securely configured using environment variables.