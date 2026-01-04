# Plan Selection Integration - Testing Guide

## ✅ What's Been Implemented

### 1. **Increased Plan Limits for Testing**
   - **Starter**: 50 videos/month, 100 AI questions
   - **Pro**: 100 videos/month, 500 AI questions  
   - **Business**: 999 videos/month, 9999 AI questions (virtually unlimited)
   - Plan expiry set to 1 year for all paid plans

### 2. **Backend API**
   - `PUT /api/users/plan` - Update user's subscription plan
   - Returns updated user profile with plan details
   - Located in: `lently-backend/routes/users.py`

### 3. **Frontend Integration**
   - New API function: `updateUserPlan(plan)` in `src/lib/api/users.ts`
   - Updated `ChoosePlan.tsx` to call backend on plan selection
   - Loading states with spinner during plan update
   - Success toast with plan details

### 4. **Plan Display Throughout App**
   - Created `useUserProfile()` hook to fetch user data
   - Created `<PlanBadge>` component to show current plan
   - Updated `DashboardLayout` sidebar to show real plan
   - Plan badge appears in bottom-left user card

## 🧪 Testing Instructions

### Step 1: Start Backend
```bash
cd lently-backend
python3 main.py
```

### Step 2: Start Frontend
```bash
cd frontend
npm run dev
```

### Step 3: Test Flow

1. **Sign Up / Sign In**
   - Go to http://localhost:8080/signup
   - Sign in with Google
   - User is created with FREE plan by default

2. **Choose a Plan (Onboarding)**
   - After sign-up, you'll see the Choose Plan page
   - Select any plan (Pro or Business recommended for testing)
   - Plan will be updated in backend
   - Success toast shows: "Pro plan activated! 🎉"
   - Redirects to First Video page

3. **Verify Plan in Dashboard**
   - Complete onboarding or go directly to `/dashboard`
   - Check bottom-left sidebar user card
   - Should show your selected plan (PRO, BUSINESS, etc.)

4. **Test Video Analysis Limits**
   - Try adding multiple videos
   - With Pro plan: 100 videos/month
   - With Business plan: 999 videos/month (unlimited for testing)
   - Should NOT see "Plan limit reached" error anymore

## 🔍 How to Verify

### Check Current Plan in Browser Console:
```javascript
// After signing in, check your plan
fetch('http://localhost:8000/api/users/profile', {
  headers: {
    'Authorization': 'Bearer ' + await firebase.auth().currentUser.getIdToken()
  }
})
.then(r => r.json())
.then(console.log)
```

### Expected Response:
```json
{
  "userId": "...",
  "email": "your@email.com",
  "displayName": "Your Name",
  "plan": "pro",  // ← Your selected plan
  "planExpiry": "2026-12-28T...",  // ← 1 year from now
  "videosAnalyzed": 0,
  "commentsAnalyzed": 0
}
```

## 📝 What Happens When You Select a Plan

1. **Frontend** (`ChoosePlan.tsx`):
   - Calls `updateUserPlan('pro')`
   - Shows loading spinner
   - Displays success toast

2. **API Call** (`users.ts`):
   - `PUT /api/users/plan`
   - Sends: `{ "plan": "pro" }`
   - Returns updated user profile

3. **Backend** (`user_service.py`):
   - Updates Firestore user document
   - Sets `plan: "pro"`
   - Sets `planExpiry: datetime.now() + 1 year`
   - Returns updated data

4. **Dashboard** (`DashboardLayout.tsx`):
   - `useUserProfile()` hook fetches profile
   - `<PlanBadge>` displays current plan
   - Plan shows in sidebar user card

## 🎯 Recommended Testing Plan

**For Maximum Testing Freedom:**
Choose **BUSINESS** plan:
- ✅ 999 videos/month (unlimited)
- ✅ 9999 AI questions
- ✅ 999 re-syncs
- ✅ Auto-sync enabled
- ✅ All premium features

This gives you effectively unlimited usage for testing!

## 🐛 Common Issues & Solutions

### Issue: "Plan limit reached" error
**Solution**: Make sure you selected a paid plan in onboarding
- Check browser console for plan update logs
- Verify plan in backend: Check Firestore users collection
- Try manually updating: Select plan again from Settings

### Issue: Plan doesn't show in dashboard
**Solution**: Check browser console for errors
- Verify API token is valid
- Check Network tab for failed requests
- Try logging out and back in

### Issue: Can't select paid plans
**Solution**: This is expected for production
- For testing, all plans are immediately activated
- No Stripe payment required
- Just click any plan and it will be set

## 📊 Plan Limits Reference

| Feature | Free | Starter | Pro | Business |
|---------|------|---------|-----|----------|
| Videos/month | 1 | 50 | 100 | 999 |
| AI Questions | 3 | 100 | 500 | 9999 |
| Comments/video | 500 | 5,000 | 10,000 | 50,000 |
| Re-syncs | 0 | 20 | 50 | 999 |
| Auto-sync | ❌ | ❌ | ✅ | ✅ |

## ✨ Next Steps

After testing plan selection:
1. Continue with video analysis testing
2. Test AI question limits
3. Test dashboard analytics
4. Eventually add Stripe billing integration

---

**Files Modified:**
- `lently-backend/utils/constants.py` - Increased limits
- `lently-backend/services/user_service.py` - Added `update_user_plan()`
- `lently-backend/routes/users.py` - Added `PUT /api/users/plan`
- `frontend/src/lib/api/users.ts` - Added `updateUserPlan()`
- `frontend/src/pages/onboarding/ChoosePlan.tsx` - Integrated API
- `frontend/src/hooks/useUserProfile.ts` - Created profile hook
- `frontend/src/components/PlanBadge.tsx` - Created plan display
- `frontend/src/components/DashboardLayout.tsx` - Show real plan

**Status**: ✅ READY FOR TESTING
