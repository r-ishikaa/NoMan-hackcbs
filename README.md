

<div align="center">

**A comprehensive learning platform with immersive VR classrooms, interactive challenges, and social features**

[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?logo=mongodb)](https://www.mongodb.com/)
[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socket.io)](https://socket.io/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Key Features Deep Dive](#key-features-deep-dive)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

HackOMania is a modern, full-stack educational platform that combines traditional learning management with cutting-edge virtual reality experiences. The platform enables students to learn through courses, participate in challenges, interact in 3D VR classrooms, create and share educational content, and track their learning progress with comprehensive analytics.

---

## ✨ Features

### 🔐 Authentication & User Management
- **Local Authentication**: Secure email/password registration and login
- **Google OAuth 2.0**: One-click sign-in with Google accounts
- **JWT-based Sessions**: Secure token-based authentication
- **User Profiles**: Customizable profiles with display names, bio, and avatars
- **Public Profiles**: Shareable profile pages for networking

### 📚 Learning Management
- **Course System**: Create, browse, and enroll in courses
- **Course Details**: Rich course pages with descriptions, reviews, and progress tracking
- **Enrollments**: Track course enrollment status and progress
- **Course Reviews**: Rate and review courses with ratings
- **Assignments**: Submit and manage course assignments
- **Learning Dashboard**: Personalized dashboard with progress tracking

### 🎮 Challenges & Competitions
- **Challenge Types**: Hackathons, Quizzes, Events, and Bounties
- **Interactive Quizzes**: Real-time MCQ quizzes with instant feedback
- **Challenge Details**: Detailed pages for each challenge type
- **Search & Filter**: Find challenges by type, title, or organizer

### 🎥 Content Creation & Social
- **Posts**: Create and share educational posts
- **Comments & Likes**: Engage with community content
- **Follow System**: Follow other users and build your network
- **Reels Studio**: AI-powered educational reel script generation
- **Reels Feed**: Browse and interact with short-form educational content
- **Reel Interactions**: Like and comment on reels

### 🌐 Virtual Reality Classroom
- **3D School Environment**: Navigate through a virtual school with multiple classrooms
- **Real-time Voice Chat**: Communicate with peers using Web Audio API
- **Interactive Whiteboard**: Upload and share images on synchronized whiteboards
- **Group Chat**: Text-based messaging within classrooms
- **Avatar System**: 3D avatars with arrow key movement controls
- **Position-based Joining**: Automatically join classroom meetings when entering rooms
- **Multi-classroom Support**: Independent meetings for each classroom

### 📊 Analytics & Portfolio
- **Activity Heat Map**: Visualize learning activity over time (GitHub-style)
- **Skill Progress Tracking**: Monitor progress across different skills
- **Monthly Performance Charts**: Track performance trends over time
- **Course Category Analytics**: View completion rates by category
- **Quiz Performance**: Track quiz scores and improvements
- **Learning Timeline**: Visual journey of your learning milestones

### Performance improvements
- **Course listings**: served from Redis (faster than MongoDB)
- **User searches**: cached results reduce database queries
- **Cache invalidation**: automatic on data changes
- **Fallback**: if Redis is unavailable, queries go directly to MongoDB

### 🔔 Notifications & Communication
- **Real-time Notifications**: Socket.IO-based instant notifications
- **Push Notifications**: Web Push API for browser notifications
- **Notification Center**: Centralized notification management

### 🌍 Internationalization
- **Multi-language Support**: 13+ languages including:
  - English, Hindi, Bengali, Gujarati
  - Spanish, French, German, Chinese, Japanese
  - Kannada, Malayalam, Marathi, Tamil, Telugu
- **Language Detection**: Automatic language detection
- **Language Switcher**: Easy language switching in UI

---

## 🛠 Tech Stack

### Frontend
- **React 19.1.1**: UI framework
- **Vite**: Build tool and dev server
- **React Router 7**: Client-side routing
- **Tailwind CSS 4.0**: Utility-first styling
- **React Three Fiber**: 3D graphics for VR classroom
- **Three.js**: 3D library
- **Socket.IO Client**: Real-time communication
- **i18next**: Internationalization
- **Lucide React**: Icon library
- **Motion**: Animation library

### Backend
- **Node.js 18+**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database with Mongoose ODM
- **Socket.IO**: WebSocket server for real-time features
- **JWT**: Authentication tokens
- **Passport.js**: Authentication middleware (Local & Google OAuth)
- **Bcryptjs**: Password hashing
- **Multer**: File upload handling
- **Web Push**: Push notification service
- **Google Generative AI**: AI-powered content generation (Gemini)
- **Helmet**: Security headers
- **Express Rate Limit**: API rate limiting
- **CORS**: Cross-origin resource sharing

---

## 📁 Project Structure

```
HackOMania/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── pages/          # Page components
│   │   │   │   ├── VR.jsx      # VR Classroom
│   │   │   │   ├── dashboard.jsx
│   │   │   │   ├── courses.jsx
│   │   │   │   ├── challenges.jsx
│   │   │   │   ├── quiz.jsx
│   │   │   │   └── ...
│   │   │   ├── ui/             # Reusable UI components
│   │   │   └── ...
│   │   ├── config/
│   │   │   └── api.js          # API configuration
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── hooks/
│   │   │   └── useNotificationsSocket.js
│   │   ├── i18n/               # Internationalization
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── routes/             # API routes
│   │   │   ├── auth.js
│   │   │   ├── courses.js
│   │   │   ├── vr.js           # VR Socket.IO namespace
│   │   │   ├── reels.js
│   │   │   └── ...
│   │   ├── models/             # MongoDB models
│   │   │   ├── User.js
│   │   │   ├── Course.js
│   │   │   ├── Post.js
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   ├── sockets/
│   │   │   └── notifications.js
│   │   ├── scripts/
│   │   │   └── seedCourses.js
│   │   └── server.js           # Main server file
│   ├── package.json
│   └── env.example
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **MongoDB** (local or cloud instance)
- **Google OAuth Credentials** (for Google login)
- **Google AI API Key** (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HackOMania
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Configure environment variables**
   
   Backend: Copy `backend/env.example` to `backend/.env` and fill in your values:
   ```bash
   cd ../backend
   cp env.example .env
   ```

   Frontend: Update `frontend/src/config/api.js` with your backend URL.

5. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   ```

6. **Start the backend server**
   ```bash
   cd backend
   npm run dev  # Development mode with nodemon
   # or
   npm start    # Production mode
   ```

7. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```

8. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5003

---

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# MongoDB
MONGO_URL=mongodb://localhost:27017/hexagon

# Authentication
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google AI (Gemini)
GOOGLE_AI_API_KEY=your-google-ai-api-key
GEMINI_API_KEY=your-gemini-api-key

# Web Push (VAPID)
VAPID_EMAIL=mailto:admin@example.com
VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key

# Server Configuration
PORT=5003
NODE_ENV=development
BACKEND_BASE_URL=http://localhost:5003
FRONTEND_URL=http://localhost:5173
```

### Frontend Configuration

Update `frontend/src/config/api.js`:
```javascript
const API_CONFIG = {
  getApiUrl: (path) => {
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5003';
    return `${baseUrl}${path}`;
  }
};
```

---

## 📡 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### User Endpoints
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user

### Course Endpoints
- `GET /api/courses` - List all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create course (authenticated)
- `POST /api/enrollments` - Enroll in course
- `GET /api/enrollments/me` - Get user enrollments

### Post Endpoints
- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comments` - Add comment

### VR Classroom Endpoints
- `GET /api/vr` - Get VR room info
- `GET /api/vr/users` - Get users in VR room
- `GET /api/vr/classrooms` - List available classrooms

### Socket.IO Namespaces
- `/vr` - VR classroom real-time events
- `/notifications` - Real-time notifications

---

## 🔍 Key Features Deep Dive

### VR Classroom Architecture

The VR classroom uses React Three Fiber for 3D rendering and Socket.IO for real-time communication:

- **3D Environment**: Custom-built school with multiple classrooms
- **Avatar System**: Each user gets a 3D avatar with position tracking
- **Voice Chat**: Web Audio API for real-time voice communication
- **Whiteboard**: Synchronized image sharing across all users
- **Group Chat**: Text messaging within classrooms
- **Position-based Joining**: Users automatically join/leave meetings based on avatar position

### Challenge System

The platform supports four types of challenges:
- **Hackathons**: Timed coding competitions
- **Quizzes**: Interactive MCQ assessments with instant feedback
- **Events**: Learning events and workshops
- **Bounties**: Bug fixes and feature implementation tasks

### Reels Studio

AI-powered content creation:
- Uses Google Gemini API to generate educational reel scripts
- Creates 4 variations of 30-second educational content
- Supports image generation (optional)

### Dashboard Analytics

Comprehensive learning analytics including:
- Activity heat map (GitHub-style contribution graph)
- Skill progress bars
- Monthly performance charts
- Course category completion rates
- Quiz performance tracking
- Learning timeline visualization

---

## 🚢 Deployment

### Backend Deployment

1. Set environment variables in your hosting platform
2. Ensure MongoDB connection string is configured
3. Build and start:
   ```bash
   npm start
   ```

### Frontend Deployment

1. Build for production:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy the `dist/` folder to your hosting service (Vercel, Netlify, etc.)

3. Update API configuration for production backend URL

### Environment-Specific Notes

- Update CORS settings in `backend/src/server.js` for production domains
- Configure Socket.IO CORS for production
- Set secure cookie flags in production
- Use HTTPS for Web Push notifications

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow ESLint configuration
- Write meaningful commit messages
- Test features before submitting PRs
- Update documentation for new features

---

## 📝 License

This project is licensed under the ISC License.

---

## 📧 Contact & Support

For questions, issues, or contributions, please open an issue on the repository.

---

<div align="center">

**Built with ❤️ by the HackOMania Team**

[Report Bug](https://github.com/your-repo/issues) · [Request Feature](https://github.com/your-repo/issues) · [Documentation](#)

</div>

