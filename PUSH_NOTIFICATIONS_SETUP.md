# Push Notifications Setup Guide

## Overview
This application supports push notifications for:
- **New posts** from users you follow
- **Likes** on your posts/reels
- **Comments** on your posts/reels
- **Follows** - when someone follows you
- **Funding** - when someone funds your post

## Backend Setup

### 1. Generate VAPID Keys

VAPID keys are required for web push notifications. Generate them using:

```bash
cd backend
npx web-push generate-vapid-keys
```

This will output:
- Public Key (VAPID_PUBLIC_KEY)
- Private Key (VAPID_PRIVATE_KEY)

### 2. Configure Environment Variables

Add to your `.env` file in the `backend` directory:

```env
VAPID_EMAIL=mailto:your-email@example.com
VAPID_PUBLIC_KEY=your-public-key-here
VAPID_PRIVATE_KEY=your-private-key-here
```

### 3. Install Dependencies

```bash
cd backend
npm install web-push
```

## Frontend Setup

### 1. Service Worker

The service worker (`frontend/public/sw.js`) is already set up and will:
- Handle push notifications
- Show notifications when received
- Handle notification clicks (navigate to relevant pages)

### 2. Automatic Subscription

Push notifications are automatically subscribed when:
- User logs in (via `AuthContext`)
- User grants notification permission
- Service worker is registered

### 3. Manual Subscription (Optional)

Users can also manually subscribe via the Navbar notification button.

## How It Works

### Notification Flow

1. **Event Occurs** (like, comment, follow, post)
2. **Backend Creates Notification** in database
3. **Backend Sends via WebSocket** (real-time for active users)
4. **Backend Sends Push Notification** (for users not currently viewing the app)
5. **Service Worker Receives Push** (even when browser is closed)
6. **Notification Displayed** to user

### Notification Types

#### 1. New Post Notification
- **Trigger**: User you follow posts something
- **Backend**: `backend/src/routes/posts.js` (POST /posts)
- **Notification**: "Username posted something new."

#### 2. Like Notification
- **Trigger**: Someone likes your post/reel
- **Backend**: `backend/src/routes/likes.js` (POST /likes)
- **Notification**: "Username liked your post."

#### 3. Comment Notification
- **Trigger**: Someone comments on your post/reel
- **Backend**: `backend/src/routes/comments.js` (POST /comments)
- **Notification**: "Username commented on your post."

#### 4. Follow Notification
- **Trigger**: Someone follows you
- **Backend**: `backend/src/routes/follow.js` (POST /follow)
- **Notification**: "Username started following you."

#### 5. Funding Notification
- **Trigger**: Someone funds your post
- **Backend**: `backend/src/routes/payments.js` (POST /payments/confirm)
- **Notification**: "Username funded your post with $X.XX."

## Testing

### 1. Test Notification Permission

1. Log in to the application
2. Browser will prompt for notification permission
3. Click "Allow"
4. Check console for "Successfully subscribed to push notifications"

### 2. Test Push Notifications

1. **Test Follow Notification**:
   - User A follows User B
   - User B should receive push notification

2. **Test Like Notification**:
   - User A likes User B's post
   - User B should receive push notification

3. **Test Comment Notification**:
   - User A comments on User B's post
   - User B should receive push notification

4. **Test Post Notification**:
   - User A (followed by User B) creates a post
   - User B should receive push notification

### 3. Verify Service Worker

1. Open browser DevTools
2. Go to Application tab
3. Check Service Workers section
4. Verify service worker is registered and active

## Troubleshooting

### Notifications Not Working?

1. **Check VAPID Keys**:
   - Ensure VAPID keys are set in backend `.env`
   - Keys must match between backend and frontend

2. **Check Service Worker**:
   - Verify service worker is registered
   - Check browser console for errors

3. **Check Notification Permission**:
   - Browser must have notification permission granted
   - Check in browser settings

4. **Check Backend Logs**:
   - Look for push notification errors in backend logs
   - Check if VAPID keys are configured

5. **Check Network**:
   - Push notifications require HTTPS (except localhost)
   - Verify backend is accessible

### Common Issues

#### "Push notifications not configured"
- **Solution**: Set VAPID keys in backend `.env` file

#### "Service Worker registration failed"
- **Solution**: Ensure `sw.js` exists in `frontend/public/` directory

#### "Notification permission denied"
- **Solution**: User must grant notification permission in browser settings

#### "Failed to subscribe to push notifications"
- **Solution**: Check backend `/push/public-key` endpoint is working
- Verify VAPID keys are correct

## Browser Support

Push notifications are supported in:
- Chrome/Edge (desktop & mobile)
- Firefox (desktop & mobile)
- Safari (macOS & iOS 16.4+)
- Opera

## Security Notes

1. **VAPID Keys**: Keep private key secure, never commit to git
2. **HTTPS Required**: Push notifications require HTTPS in production
3. **User Consent**: Always request permission before subscribing
4. **Subscription Management**: Users can unsubscribe at any time

## Additional Resources

- [Web Push API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [web-push library](https://github.com/web-push-libs/web-push)

