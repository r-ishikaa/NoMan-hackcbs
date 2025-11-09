# Auth0 Integration Setup Guide

## ✅ What's Been Integrated

Auth0 has been successfully integrated into your HackOmania project **alongside** your existing authentication systems (JWT + Google OAuth). Users can now choose between:

1. **Email/Password** (your existing system)
2. **Google OAuth** (your existing system)  
3. **Auth0** (new - supports multiple providers)

## 🚀 Setup Instructions

### Step 1: Create Auth0 Account & Application

1. Go to [https://auth0.com](https://auth0.com) and create a free account
2. Create a new **Single Page Application**
3. Note your **Domain** and **Client ID**

### Step 2: Configure Auth0 Application

In your Auth0 Dashboard → Applications → Your App → Settings:

**Allowed Callback URLs:**
```
http://localhost:5173/auth/auth0/callback
```

**Allowed Logout URLs:**
```
http://localhost:5173
```

**Allowed Web Origins:**
```
http://localhost:5173
```

**Allowed Origins (CORS):**
```
http://localhost:5173
```

### Step 3: Configure Environment Variables

Create or update `.env` file in `Noman/frontend/`:

```env
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=  # Optional - leave empty for now
```

**Replace:**
- `your-domain.auth0.com` with your Auth0 domain
- `your-client-id` with your Auth0 client ID

### Step 4: Restart Development Server

```bash
cd /Users/darshan/Documents/Desktop/Hexagon/HackOmania/Noman/frontend
npm run dev
```

## 🎯 How It Works

### Frontend Flow:
1. User clicks "Continue with Auth0" button on login page
2. Redirected to Auth0 login (supports Google, GitHub, email, etc.)
3. After Auth0 authentication, redirected to `/auth/auth0/callback`
4. Frontend exchanges Auth0 token for your backend JWT token
5. User is logged in with your existing auth system

### Backend Flow:
1. Receives Auth0 user data (email, name, picture, sub)
2. Checks if user exists by `auth0Sub` or `email`
3. Links Auth0 account to existing user OR creates new user
4. Returns your standard JWT token
5. User can now use all your existing features

## 📁 Files Modified/Created

### Frontend:
- ✅ `src/main.jsx` - Wrapped with Auth0Provider
- ✅ `src/components/Auth0LoginButton.jsx` - Auth0 login button
- ✅ `src/components/pages/Auth0Callback.jsx` - Handles Auth0 callback
- ✅ `src/components/pages/Login.jsx` - Added Auth0 button
- ✅ `src/App.jsx` - Added Auth0 callback route
- ✅ `.env.auth0` - Template for Auth0 config

### Backend:
- ✅ `src/routes/auth.js` - Added `/auth0/exchange` endpoint
- ✅ `src/models/User.js` - Added `auth0Sub` field

## 🔒 Security Features

- Auth0 tokens are exchanged for your backend JWT tokens
- Existing users can link their Auth0 account
- Auth0Sub is unique and indexed for fast lookups
- Supports multiple auth providers without conflicts

## 🎨 UI Features

- Beautiful purple gradient Auth0 button
- Loading states
- Error handling with user-friendly messages
- Seamless integration with existing auth UI

## 🧪 Testing

1. **Without Auth0 configured**: App works normally with existing auth
2. **With Auth0 configured**: Auth0 button appears on login page
3. **Auth0 login**: Creates/links user account automatically

## 🔧 Troubleshooting

### Auth0 button not showing:
- Check `.env` file has correct values
- Restart dev server after adding `.env`
- Values must not be placeholder text

### Callback errors:
- Verify callback URL in Auth0 Dashboard matches exactly
- Check browser console for detailed errors
- Ensure backend is running on port 5003

### Token exchange fails:
- Check backend logs for errors
- Verify `/auth0/exchange` endpoint is accessible
- Ensure Auth0 returns email and sub fields

## 🎉 Benefits

- **Multiple Auth Options**: Users choose their preferred method
- **Social Login**: Auth0 supports 30+ providers
- **Enterprise Ready**: Add SAML, LDAP, etc. through Auth0
- **Existing Users**: Can link Auth0 to current accounts
- **Zero Disruption**: All existing auth continues to work

## 📚 Next Steps

1. Configure Auth0 social connections (Google, GitHub, etc.)
2. Customize Auth0 login page with your branding
3. Add MFA (Multi-Factor Authentication) through Auth0
4. Monitor auth analytics in Auth0 Dashboard

---

**Need Help?** Check Auth0 docs: https://auth0.com/docs/quickstart/spa/react
