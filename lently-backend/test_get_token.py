"""
Development-only script to get a Firebase ID token.
DO NOT use in production!
"""
from config.settings import settings
import requests

# Get your Firebase Web API Key from Firebase Console
# Project Settings > General > Web API Key
FIREBASE_WEB_API_KEY = input("Enter your Firebase Web API Key: ").strip()
EMAIL = "testuser1@lenlty.com"
PASSWORD = input(f"Enter password for {EMAIL}: ").strip()

url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_WEB_API_KEY}"

response = requests.post(url, json={
    "email": EMAIL,
    "password": PASSWORD,
    "returnSecureToken": True
})

if response.status_code == 200:
    data = response.json()
    token = data.get('idToken')
    print("\n" + "="*80)
    print("✅ SUCCESS! Here's your ID token (valid for 1 hour):")
    print("="*80)
    print(f"\n{token}\n")
    print("="*80)
    print("📋 Copy this to Swagger UI:")
    print("="*80)
    print(f"Bearer {token}")
    print("\n" + "="*80)
else:
    print(f"\n❌ Error: {response.json()}")
