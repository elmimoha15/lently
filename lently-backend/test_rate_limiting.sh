#!/bin/bash

# Rate Limiting Test Script
# Tests the rate limiting implementation

echo "========================================"
echo "Rate Limiting Test Script"
echo "========================================"
echo ""

# Check if server is running
echo "Checking if server is running..."
if ! curl -s http://localhost:8000/docs > /dev/null; then
    echo "❌ Error: Backend server is not running"
    echo "Start the server with: uvicorn main:app --reload"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Test 1: Debug endpoint (3 requests/minute)
echo "========================================"
echo "Test 1: Debug Endpoint (3 requests/minute)"
echo "========================================"
echo ""

for i in {1..4}; do
    echo "Request $i:"
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:8000/api/debug/test-rate-limit)
    http_code=$(echo "$response" | grep HTTP_CODE | cut -d: -f2)
    body=$(echo "$response" | grep -v HTTP_CODE)
    
    echo "Status: $http_code"
    echo "Response: $body"
    
    if [ "$i" -le 3 ]; then
        if [ "$http_code" = "200" ]; then
            echo "✅ Request $i succeeded (expected)"
        else
            echo "❌ Request $i failed (unexpected)"
        fi
    else
        if [ "$http_code" = "429" ]; then
            echo "✅ Request $i rate limited (expected)"
        else
            echo "❌ Request $i not rate limited (unexpected)"
        fi
    fi
    
    echo ""
    sleep 0.5
done

# Test 2: Check rate limit headers
echo "========================================"
echo "Test 2: Rate Limit Headers"
echo "========================================"
echo ""

echo "Making request and checking headers..."
headers=$(curl -s -i http://localhost:8000/api/debug/test-rate-limit | grep -i "x-ratelimit")

if [ -n "$headers" ]; then
    echo "✅ Rate limit headers found:"
    echo "$headers"
else
    echo "❌ No rate limit headers found"
fi

echo ""
echo "========================================"
echo "Tests Complete"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Wait 60 seconds for rate limit to reset"
echo "2. Test other endpoints (auth, videos, AI chat, comments)"
echo "3. Verify rate limits work correctly"
echo ""
echo "For manual testing:"
echo "  curl http://localhost:8000/api/debug/test-rate-limit"
echo "  curl -i http://localhost:8000/api/debug/test-rate-limit  # with headers"
echo ""
