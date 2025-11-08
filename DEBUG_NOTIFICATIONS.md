# Debugging Notification Issues

## Checklist for Follow Notifications Not Working

### 1. Check Backend Logs

When someone follows you, you should see logs like:

```
[Follow Notification] User <followerId> (<username>) followed user <yourId>
[Follow Notification] Created notification in database: <notificationId>
[Follow Notification] Sent WebSocket notification to user <yourId>
[Push Notification] Sending to X subscription(s) for user <yourId>
```

### 2. Check VAPID Keys

**Backend**:

- Check if VAPID keys are set in `.env` file
- Look for warning: `⚠️  VAPID keys not set. Web push notifications will not work.`
- If missing, generate keys: `node backend/src/scripts/generateVapidKeys.js`

### 3. Check Push Subscription

**Frontend Browser Console**:

1. Open DevTools (F12)
2. Go to Application tab → Service Workers
3. Check if service worker is registered and active
4. Check if you're subscribed:

```javascript
navigator.serviceWorker.ready.then((reg) => {
  reg.pushManager.getSubscription().then((sub) => {
    console.log("Subscription:", sub);
  });
});
```

### 4. Check Notification Permission

**Browser Console**:

```javascript
console.log("Notification permission:", Notification.permission);
```

Should be `"granted"`. If not:

- Click on the lock icon in address bar
- Allow notifications
- Or go to browser settings → Site settings → Notifications

### 5. Check Database

**Check if notification was created**:

```javascript
// In backend, check MongoDB
db.notifications
  .find({ recipientId: "yourUserId", type: "follow" })
  .sort({ createdAt: -1 })
  .limit(1);
```

**Check if you're subscribed to push**:

```javascript
// In backend, check MongoDB
db.pushsubscriptions.find({ userId: "yourUserId" });
```

### 6. Test Notification Manually

**Backend API** (for testing):

```bash
# Get your user ID from profile
# Then test push notification
curl -X POST http://localhost:5003/push/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "body": "Test notification"}'
```

### 7. Common Issues

#### Issue: "VAPID keys not configured"

**Solution**: Generate and add VAPID keys to `.env` file

#### Issue: "No subscriptions found"

**Solution**:

1. Make sure you're logged in
2. Check browser console for subscription errors
3. Try logging out and back in to re-subscribe

#### Issue: "Service worker not registered"

**Solution**:

1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check if `sw.js` exists in `frontend/public/`

#### Issue: "Notification permission denied"

**Solution**:

1. Go to browser settings
2. Site settings → Notifications
3. Allow notifications for your site

#### Issue: Notifications work in browser but not as push

**Solution**:

- This is expected! Browser notifications work as fallback
- Push notifications require:
  - VAPID keys configured
  - User subscribed to push
  - Service worker active
  - HTTPS (except localhost)

### 8. Enable Debug Logging

**Backend**: Check console logs for:

- `[Follow Notification]` - Follow notifications
- `[Push Notification]` - Push notification sending
- `[Post Notification]` - Post notifications
- `[Like Notification]` - Like notifications
- `[Comment Notification]` - Comment notifications

**Frontend**: Check browser console for:

- `[Notifications]` - WebSocket notifications
- `Successfully subscribed to push notifications` - Push subscription
- `Service Worker registered` - Service worker registration

### 9. Test Flow

1. **User A follows User B**
2. **Backend should**:
   - Create notification in database
   - Send via WebSocket (if User B is online)
   - Send push notification (if User B is subscribed)
3. **User B should receive**:
   - Real-time notification via WebSocket (if online)
   - Push notification (even if browser closed)
   - Browser notification (fallback)

### 10. Quick Fixes

**Reset everything**:

1. Clear browser cache and storage
2. Log out and log back in
3. Grant notification permission
4. Wait for auto-subscription (check console)

**Check subscription status**:

```javascript
// In browser console
navigator.serviceWorker.ready.then(async (reg) => {
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    console.log("Subscribed:", sub.endpoint);
  } else {
    console.log("Not subscribed");
  }
});
```

## Still Not Working?

1. Check backend logs for errors
2. Check browser console for errors
3. Verify VAPID keys are correct
4. Verify service worker is active
5. Check if notification was created in database
6. Check if user has push subscription in database
