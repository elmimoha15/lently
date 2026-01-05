#!/bin/bash

# 🔐 Firebase Credential Migration Script
# This script helps you migrate from JSON file to environment variables

echo "🔐 Firebase Security Migration Script"
echo "===================================="
echo ""

# Check if JSON file exists
JSON_FILE="./lently-saas-firebase-adminsdk-fbsvc-8e6283a771.json"
NEW_JSON_FILE=""

if [ -f "$JSON_FILE" ]; then
    echo "⚠️  WARNING: Old Firebase JSON file found: $JSON_FILE"
    echo "   This file should be deleted after migration!"
    echo ""
fi

# Look for any new JSON files
echo "Looking for Firebase service account JSON files..."
for file in ./*firebase*.json; do
    if [ -f "$file" ] && [ "$file" != "$JSON_FILE" ]; then
        NEW_JSON_FILE="$file"
        echo "✅ Found new Firebase JSON file: $file"
        break
    fi
done

if [ -z "$NEW_JSON_FILE" ]; then
    echo "❌ No Firebase service account JSON file found."
    echo ""
    echo "📋 To continue, please:"
    echo "   1. Go to Firebase Console → Project Settings → Service Accounts"
    echo "   2. Generate a new private key"
    echo "   3. Download the JSON file to this directory"
    echo "   4. Run this script again"
    echo ""
    exit 1
fi

echo ""
echo "📝 Extracting credentials from $NEW_JSON_FILE..."

# Extract values from JSON
PROJECT_ID=$(jq -r '.project_id' "$NEW_JSON_FILE")
PRIVATE_KEY_ID=$(jq -r '.private_key_id' "$NEW_JSON_FILE")  
PRIVATE_KEY=$(jq -r '.private_key' "$NEW_JSON_FILE")
CLIENT_EMAIL=$(jq -r '.client_email' "$NEW_JSON_FILE")
CLIENT_ID=$(jq -r '.client_id' "$NEW_JSON_FILE")

echo "✅ Extracted credentials successfully!"
echo ""

# Create .env backup
if [ -f ".env" ]; then
    cp .env .env.backup
    echo "📋 Created backup: .env.backup"
fi

# Update .env file
echo "📝 Updating .env file..."

cat > .env << EOF
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=$PROJECT_ID

# Firebase Configuration - Individual Environment Variables
FIREBASE_PRIVATE_KEY_ID=$PRIVATE_KEY_ID
FIREBASE_CLIENT_EMAIL=$CLIENT_EMAIL
FIREBASE_CLIENT_ID=$CLIENT_ID
# CRITICAL: Private key with \n for newlines
FIREBASE_PRIVATE_KEY="$PRIVATE_KEY"

# API Keys
GEMINI_API_KEY=AIzaSyB-eQ6uceQZh5E-IAaFZZutDZJRzW9bTSk
YOUTUBE_API_KEY=AIzaSyDeabx_nd9yYYx15fIP-uODlOH1hLM9MpI

# Lemonsqueezy Payment Configuration
LEMONSQUEEZY_API_KEY=your-lemonsqueezy-api-key
LEMONSQUEEZY_STORE_ID=your-store-id
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret

# Resend Email Configuration
RESEND_API_KEY=re_Fh88ZKwQ_QGhY5G7fYcsUpiN7arueueCX

# Application Configuration
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=dev
EOF

echo "✅ Updated .env file with new Firebase credentials!"
echo ""

echo "🧪 Testing Firebase initialization..."
cd ..
python3 -c "
import sys
sys.path.append('./lently-backend')
try:
    from lently-backend.config.firebase import initialize_firebase
    initialize_firebase()
    print('✅ Firebase initialization test passed!')
except Exception as e:
    print(f'❌ Firebase initialization test failed: {e}')
    sys.exit(1)
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Firebase credentials are working correctly!"
    echo ""
    echo "🧹 Cleanup recommendations:"
    echo "   1. Delete the old JSON file: rm $JSON_FILE"
    echo "   2. Delete the new JSON file: rm $NEW_JSON_FILE"
    echo "   3. Commit your changes: git add .env .gitignore && git commit -m 'Migrate to environment variables'"
    echo ""
    echo "⚠️  IMPORTANT: The JSON files contain sensitive data!"
    echo "   Make sure to delete them after confirming everything works."
else
    echo "❌ Firebase initialization failed. Please check the credentials manually."
fi

echo ""
echo "📖 For detailed setup instructions, see: FIREBASE_SECURITY_SETUP.md"
echo "🎉 Migration complete!"