# How to Switch to Creator Account

There are **3 easy ways** to switch your account to a Creator account:

## Method 1: Using the Role Switcher UI (Easiest) ⭐

1. **Log in** to your account
2. Go to your **Profile** page (`/profile`)
3. Look for the **Role Switcher** button (purple badge showing your current role) near the "Edit Profile" button
4. Click on it to open the dropdown
5. Select **"Creator"** from the options
6. Your role will be updated immediately!

**Visual Guide:**
```
Profile Page
├── Your Profile Header
│   ├── [Role: user] ← Click this button
│   ├── Edit Profile
│   └── Dashboard
│
└── Role Switcher Dropdown (opens when clicked)
    ├── 👤 Normal User
    ├── ✨ Creator ← Select this
    └── 🏢 Enterprise
```

## Method 2: Using Browser Console (Quick)

1. **Log in** to your account
2. Open **Browser Developer Tools** (F12 or Right-click → Inspect)
3. Go to the **Console** tab
4. Copy and paste this code:

```javascript
const token = localStorage.getItem('hexagon_token') || localStorage.getItem('token');
fetch('http://localhost:5003/users/me/role', {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ role: 'creator' })
})
.then(res => res.json())
.then(data => {
  console.log('Success!', data);
  alert('Role updated to Creator! Please refresh the page.');
  window.location.reload();
})
.catch(err => console.error('Error:', err));
```

5. Press **Enter** to execute
6. Refresh the page

**Note:** If your backend is not on `localhost:5003`, change the URL accordingly.

## Method 3: Using API Client (Postman/Thunder Client)

1. **Get your authentication token:**
   - Log in to the app
   - Open Browser DevTools → Application/Storage → Local Storage
   - Copy the value of `hexagon_token`

2. **Make a PUT request:**
   - **URL:** `http://localhost:5003/users/me/role`
   - **Method:** `PUT`
   - **Headers:**
     ```
     Authorization: Bearer YOUR_TOKEN_HERE
     Content-Type: application/json
     ```
   - **Body (JSON):**
     ```json
     {
       "role": "creator"
     }
     ```

3. **Send the request**
4. Refresh your app

## Available Roles

- **`user`** - Normal User (default)
- **`creator`** - Content Creator (gives access to Activity Center)
- **`enterprise`** - Enterprise/Business Account

## After Switching to Creator

Once you're a Creator, you'll have access to:

✅ **Activity Center** (`/activity`)
   - View analytics and statistics
   - See views, likes, comments, followers
   - Track engagement over time
   - View top performing posts and reels
   - Monitor followers growth

✅ **All standard features:**
   - Create posts
   - Upload reels
   - Follow users
   - Comment and like

## Troubleshooting

### "Failed to switch role"
- Make sure you're logged in
- Check that your token is valid
- Try logging out and back in

### "Role switcher not showing"
- Make sure you're viewing your own profile (not someone else's)
- Check that you're logged in
- Refresh the page

### "Activity Center not accessible"
- Make sure your role is set to `creator`
- Try logging out and back in
- Check the browser console for errors

## Quick Test

To verify your role was changed:

1. Check the Role Switcher button - it should show "Creator"
2. Try accessing `/activity` - you should see the Activity Center
3. Check your profile - you should see creator-specific features

## Need Help?

If you're still having issues:
1. Check the browser console for errors
2. Verify your backend is running
3. Make sure you're using the correct API endpoint
4. Try the browser console method (Method 2) as it shows detailed error messages

