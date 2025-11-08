# Notification System Documentation

## Overview
The notification system sends real-time notifications via WebSocket and web push notifications for various user activities.

## Notification Types

### 1. **new_post** - New Post Notification
- **Trigger**: When a user you follow creates a new post
- **Recipient**: All followers of the post author
- **Fields**:
  - `type`: "new_post"
  - `relatedPostId`: Post ID
  - `relatedUserId`: Post author ID
  - `relatedReelId`: "" (empty)
- **Routes**: `POST /posts`

### 2. **new_reel** - New Reel Notification
- **Trigger**: When a user you follow uploads a new reel
- **Recipient**: All followers of the reel author
- **Fields**:
  - `type`: "new_reel"
  - `relatedReelId`: Reel ID
  - `relatedUserId`: Reel author ID
  - `relatedPostId`: "" (empty)
- **Routes**: `POST /reels/upload`

### 3. **follow** - Follow Notification
- **Trigger**: When someone follows you
- **Recipient**: The user being followed
- **Fields**:
  - `type`: "follow"
  - `relatedUserId`: Follower ID
  - `relatedPostId`: "" (empty)
  - `relatedReelId`: "" (empty)
- **Routes**: `POST /follow`

### 4. **like** - Like Notification
- **Trigger**: When someone likes your post or reel
- **Recipient**: The owner of the post/reel
- **Fields**:
  - `type`: "like"
  - `relatedPostId`: Post ID (if post like)
  - `relatedReelId`: Reel ID (if reel like)
  - `relatedUserId`: User who liked
- **Routes**: 
  - `POST /likes` (for posts)
  - `POST /reels/:id/like` (for reels)

### 5. **comment** - Comment Notification
- **Trigger**: When someone comments on your post or reel
- **Recipient**: The owner of the post/reel
- **Fields**:
  - `type`: "comment"
  - `relatedPostId`: Post ID (if post comment)
  - `relatedReelId`: Reel ID (if reel comment)
  - `relatedUserId`: User who commented
- **Routes**: `POST /comments`

## Notification Delivery Methods

### 1. **Database Storage**
- All notifications are stored in the `Notification` collection
- Persisted for later retrieval via `GET /notifications/me`

### 2. **WebSocket (Real-time)**
- Notifications are broadcast via WebSocket in real-time
- Uses `broadcastNotification()` function
- Client receives notifications instantly if connected

### 3. **Web Push Notifications**
- Browser push notifications (if user has subscribed)
- Uses VAPID keys for authentication
- Requires user permission and subscription

## Notification Flow

```
User Action → Create Notification → Store in DB → 
  → Broadcast via WebSocket → Send Web Push (if subscribed)
```

## API Endpoints

### Get Notifications
```
GET /notifications/me
```
Returns the current user's notifications (requires authentication)

### Mark as Read
```
PUT /notifications/:id/read
```
Marks a notification as read (requires authentication)

## Implementation Details

### Notification Creation
- Notifications are created asynchronously to avoid blocking the main request
- Errors in notification creation are logged but don't fail the main operation
- Bulk inserts are used for follower notifications (posts/reels)
- Individual inserts with fallback if bulk insert fails

### Notification Broadcasting
- WebSocket notifications use `toObject()` to convert Mongoose documents
- Push notifications include title, body, icon, and data for navigation
- All notifications include user context (username, IDs)

### Error Handling
- All notification errors are caught and logged
- Failures don't affect the main operation
- Individual notification creation retry logic for bulk operations

## Testing Notifications

### Test Scenarios

1. **Post Notification**:
   - User A follows User B
   - User B creates a post
   - User A should receive a "new_post" notification

2. **Reel Notification**:
   - User A follows User B
   - User B uploads a reel
   - User A should receive a "new_reel" notification

3. **Follow Notification**:
   - User A follows User B
   - User B should receive a "follow" notification

4. **Like Notification**:
   - User A likes User B's post/reel
   - User B should receive a "like" notification

5. **Comment Notification**:
   - User A comments on User B's post/reel
   - User B should receive a "comment" notification

### Debugging

Check server logs for notification-related messages:
- `[Post Notification]` - Post notification logs
- `[Reel Notification]` - Reel notification logs
- `[Like Notification]` - Like notification logs
- `[Comment Notification]` - Comment notification logs

## Future Enhancements

- [ ] Notification preferences (opt-out for specific types)
- [ ] Notification grouping (e.g., "5 people liked your post")
- [ ] Email notifications (optional)
- [ ] Notification batching for high-frequency activities
- [ ] Repost/share notifications (if feature added)

