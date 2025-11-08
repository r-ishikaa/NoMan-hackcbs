# Hexagon Mobile App

React Native mobile application for Hexagon platform, connecting to the same backend as the web app.

## Features

- **Authentication**: Login and Signup with email/password
- **Dashboard**: View enrolled courses, communities, and progress
- **Courses**: Browse and enroll in courses
- **Profile**: View and edit your profile
- **Reels**: Browse educational reels
- **Communities**: Explore and join communities
- **Discover**: Discover posts from other users

## Setup

### Prerequisites

- Node.js >= 18
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Install dependencies:
```bash
cd mobile
npm install
```

2. For iOS (macOS only):
```bash
cd ios
pod install
cd ..
```

3. Configure API URL:
   - Open `mobile/config/api.js`
   - Update `BASE_URL` to your backend URL
   - For local development with physical device, use your machine's IP address (e.g., `http://192.168.1.X:5003`)
   - For emulator/simulator, use `http://localhost:5003` (Android) or `http://localhost:5003` (iOS)

### Running the App

#### Android
```bash
npm run android
```

#### iOS (macOS only)
```bash
npm run ios
```

## Project Structure

```
mobile/
├── App.js                 # Main app component
├── index.js              # Entry point
├── config/
│   └── api.js           # API configuration
├── contexts/
│   └── AuthContext.jsx  # Authentication context
├── navigation/
│   └── AppNavigator.js  # Navigation setup
├── screens/
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
    └── api.js           # API service functions
```

## Backend Integration

The app uses the same backend as the web application:
- Backend URL: Configure in `config/api.js`
- Authentication: JWT tokens stored in AsyncStorage
- API endpoints: Same as web app (see backend documentation)

## Development Notes

- The app uses React Navigation for navigation
- AsyncStorage is used instead of localStorage for token storage
- All API calls are handled through the `services/api.js` file
- The app follows the same authentication flow as the web app

## Troubleshooting

### Connection Issues
- Make sure your backend is running
- For physical devices, ensure your device and computer are on the same network
- Update the `BASE_URL` in `config/api.js` with your machine's IP address for physical device testing

### Build Issues
- Clear Metro bundler cache: `npm start -- --reset-cache`
- For Android: Clean build folder: `cd android && ./gradlew clean`
- For iOS: Clean build folder in Xcode

## License

Same as main project

