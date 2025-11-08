# React Native Mobile App Setup Guide

## Quick Start

1. **Install Dependencies**
   ```bash
   cd mobile
   npm install
   ```

2. **Configure Backend URL**
   - Open `mobile/config/api.js`
   - Update `BASE_URL`:
     - For emulator/simulator: `http://localhost:5003`
     - For physical device: `http://YOUR_IP_ADDRESS:5003` (e.g., `http://192.168.1.100:5003`)

3. **Run the App**
   ```bash
   # Android
   npm run android
   
   # iOS (macOS only)
   npm run ios
   ```

## Backend Configuration

Make sure your backend CORS settings allow requests from your mobile app. Update `backend/src/server.js`:

```javascript
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  // Add mobile app origins if needed
];

// For mobile apps, you might need to allow all origins or use a wildcard
// In development, this is usually fine
```

## Physical Device Testing

### Finding Your IP Address

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Windows:**
```bash
ipconfig
```

Look for your local network IP (usually starts with 192.168.x.x or 10.x.x.x).

### Update API Config

In `mobile/config/api.js`, change:
```javascript
BASE_URL: "http://YOUR_IP_ADDRESS:5003"
```

### Android

1. Make sure your device and computer are on the same WiFi network
2. Enable USB debugging on your Android device
3. Run: `npm run android`

### iOS

1. Make sure your device and Mac are on the same WiFi network
2. Open the project in Xcode: `cd ios && open Hexagon.xcworkspace`
3. Select your device and run

## Project Structure

```
mobile/
├── App.js                    # Main app component
├── index.js                  # Entry point
├── config/
│   └── api.js               # API configuration
├── contexts/
│   └── AuthContext.jsx      # Authentication state
├── navigation/
│   └── AppNavigator.js      # Navigation setup
├── screens/                 # All screen components
│   ├── LoginScreen.js
│   ├── SignupScreen.js
│   ├── DashboardScreen.js
│   ├── CoursesScreen.js
│   ├── CourseDetailScreen.js
│   ├── ProfileScreen.js
│   ├── ProfileEditScreen.js
│   ├── ReelsScreen.js
│   ├── CommunitiesScreen.js
│   └── DiscoverScreen.js
└── services/
    └── api.js               # API service functions
```

## Features

- ✅ Authentication (Login/Signup)
- ✅ Dashboard with course progress
- ✅ Course browsing and enrollment
- ✅ Profile management
- ✅ Reels browsing
- ✅ Communities
- ✅ Discover feed

## Troubleshooting

### Metro Bundler Issues
```bash
npm start -- --reset-cache
```

### Android Build Issues
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### iOS Build Issues
1. Open Xcode
2. Product → Clean Build Folder
3. Run again

### Connection Issues
- Ensure backend is running
- Check backend URL in `config/api.js`
- Verify device/emulator can reach backend (try opening URL in browser)
- Check firewall settings

### Authentication Issues
- Clear app data and reinstall
- Check token storage in AsyncStorage
- Verify backend authentication endpoints

## Development Notes

- Uses React Navigation for navigation
- AsyncStorage for token persistence (instead of localStorage)
- Same API endpoints as web app
- JWT authentication flow

## Next Steps

1. Test on physical device
2. Add image upload functionality
3. Implement push notifications
4. Add offline support
5. Optimize performance

