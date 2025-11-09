<div align="center">

<!-- Logo placeholder - Add your logo here -->
<!-- ![Logo](Logo.png) -->

<img width="500" height="500" alt="noman_logo-removebg-preview" src="https://github.com/user-attachments/assets/e0b1af22-be02-4cd0-a9aa-9539da70bd90" />



# NoMan

**A women's empowerment platform creating meaningful connections, authentic stories, and empowering communities**

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socket.io)](https://socket.io/)
[![Redis](https://img.shields.io/badge/Redis-5.9-DC382D?logo=redis)](https://redis.io/)
[![Stripe](https://img.shields.io/badge/Stripe-19.3-635BFF?logo=stripe)](https://stripe.com/)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Key Features Deep Dive](#-key-features-deep-dive)
- [Implementation](#-implementation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

---

## 🎯 Overview

Hexagon is a comprehensive platform designed to empower women by creating meaningful connections, sharing authentic stories, and building supportive communities. More than just a social feed, Hexagon provides a space for women to grow, learn, and inspire together through educational courses, creative reels, supportive communities, shared challenges, and immersive virtual experiences.

The platform combines modern web technologies with real-time communication features, virtual reality classrooms, and AI-powered content creation tools to create an engaging and empowering experience.

---

## ✨ Features

### 🔐 Authentication & User Management
- **Local Authentication**: Secure email/password registration and login
- **Google OAuth 2.0**: One-click sign-in with Google accounts
- **JWT-based Sessions**: Secure token-based authentication with refresh tokens
- **User Profiles**: Customizable profiles with display names, bio, avatars, and resume uploads
- **Public Profiles**: Shareable profile pages for networking and discovery
- **Role-based Access**: Student and creator roles with different permissions
- **Profile Editing**: Update profile information, preferences, and settings



### 🎥 Content Creation & Social
- **Posts**: Create and share educational and inspirational posts
- **Comments & Likes**: Engage with community content through comments and reactions
- **Follow System**: Follow other users and build your network
- **Reels Studio**: AI-powered educational reel script generation using Google Gemini
- **Reels Feed**: Browse and interact with short-form educational content
- **Reel Interactions**: Like, comment, and share reels
- **Content Discovery**: Discover trending and relevant content
- **Post Funding**: Support creators by funding posts through Stripe integration



### 👥 Communities
- **Community Creation**: Create and manage communities around topics and interests
- **Community Membership**: Join communities and participate in discussions
- **Community Pages**: Dedicated pages for each community with posts and members
- **Community Discovery**: Discover and explore communities based on interests

### 💬 Real-time Communication
- **Random Video Calls**: Connect with random users for video conversations
- **Socket.IO Integration**: Real-time updates for notifications, messages, and events
- **Push Notifications**: Web push notifications for important events and updates
- **Notification Center**: Centralized notification management

### 📊 Analytics & Portfolio
- **Activity Heat Map**: Visualize learning activity over time (GitHub-style)
- **Engagement Metrics**: Track likes, comments, follows, and content creation

### 🗓️ Period Tracking
- **Period Logging**: Track menstrual cycles and symptoms
- **Period History**: View historical period data and patterns
- **Health Insights**: Get insights based on period tracking data

### 💳 Payments & Funding
- **Stripe Integration**: Secure payment processing for post funding
- **Post Funding**: Support creators by funding their posts
- **Payment History**: Track donations and earnings
- **Funding Statistics**: View funding stats for posts



### 🚀 Performance & Optimization
- **Redis Caching**: Course listings and user searches cached in Redis for faster access
- **Optimized Queries**: Database queries optimized for performance
- **Lazy Loading**: Components and routes loaded on demand
- **Image Optimization**: Optimized image handling and delivery

---

## 🛠️ Tech Stack

### Frontend
- **React 19.1.1**: Modern React with latest features
- **Vite**: Fast build tool and dev server
- **Tailwind CSS 4.0**: Utility-first CSS framework
- **React Router DOM 7.9.5**: Client-side routing
- **Socket.IO Client 4.8.1**: Real-time communication
- **Motion**: Animation library for smooth UI transitions
- **Stripe.js**: Payment processing
- **Recharts**: Data visualization and charts
- **Lucide React**: Icon library

### Backend
- **Node.js 18+**: JavaScript runtime
- **Express.js 4.18.2**: Web application framework
- **MongoDB 8.0**: NoSQL database
- **Mongoose 8.0.3**: MongoDB object modeling
- **Socket.IO 4.8.1**: Real-time bidirectional communication
- **Redis 5.9.0**: In-memory data structure store for caching
- **JWT**: JSON Web Tokens for authentication
- **Passport.js**: Authentication middleware
- **bcryptjs**: Password hashing
- **Multer**: File upload handling
- **Stripe 19.3.0**: Payment processing
- **Web Push**: Push notification service
- **Helmet**: Security middleware
- **Express Rate Limit**: Rate limiting middleware
- **CORS**: Cross-origin resource sharing

### AI & External Services
- **Google Gemini API**: AI-powered content generation
- **OpenAI API**: Additional AI capabilities
- **Groq SDK**: Fast AI inference
- **Tavily Core**: Web search and research

### Development Tools
- **Nodemon**: Development server auto-reload
- **PostCSS**: CSS processing


---

## 📁 Project Structure

```
NoMan-hackcbs/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── redis.js           # Redis configuration
│   │   ├── middleware/
│   │   │   ├── auth.js            # Authentication middleware
│   │   ├── models/
│   │   │   ├── User.js            # User model
│   │   │   ├── Post.js            # Post model
│   │   │   ├── Reel.js            # Reel model
│   │   │   ├── Community.js       # Community model
│   │   │   ├── Enrollment.js      # Enrollment model
│   │   │   ├── Comment.js         # Comment model
│   │   │   ├── Like.js            # Like model
│   │   │   ├── Follow.js          # Follow model
│   │   │   ├── Notification.js    # Notification model
│   │   │   ├── Payment.js         # Payment model
│   │   │   ├── Period.js          # Period tracking model
│   │   │   └── ...                # Other models
│   │   ├── routes/
│   │   │   ├── auth.js            # Authentication routes
│   │   │   ├── users.js           # User routes
│   │   │   ├── posts.js           # Post routes
│   │   │   ├── reels.js           # Reel routes
│   │   │   ├── communities.js     # Community routes
│   │   │   ├── payments.js        # Payment routes
│   │   │   ├── analytics.js       # Analytics routes
│   │   │   └── ...                # Other routes
│   │   ├── sockets/
│   │   │   ├── notifications.js   # Notification socket handlers
│   │   │   ├── randomVideo.js     # Random video call socket handlers
│   │   ├── utils/
│   │   │   ├── notificationBroadcaster.js  # Notification utilities
│   │   ├── scripts/
│   │   │   ├── generateVapidKeys.js        # Generate VAPID keys
│   │   │   ├── seedCourses.js              # Seed course data
│   │   │   └── migrateRoles.js             # Role migration script
│   │   └── server.js              # Express server setup
│   ├── uploads/                   # Uploaded files
│   │   └── reels/                 # Reel video uploads
│   ├── package.json
│   └── README.md
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header/            # Landing page header
│   │   │   ├── Navbar/            # Navigation bar
│   │   │   ├── Footer/            # Footer component
│   │   │   ├── pages/             # Page components
│   │   │   │   ├── Login.jsx
│   │   │   │   ├── Signup.jsx
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Profile.jsx
│   │   │   │   ├── Courses.jsx
│   │   │   │   ├── Reels.jsx
│   │   │   │   ├── VR.jsx
│   │   │   │   ├── CommunitiesPage.jsx
│   │   │   │   └── ...            # Other pages
│   │   │   ├── ui/                # UI components
│   │   │   │   ├── CourseCard.jsx
│   │   │   │   ├── PostCard.jsx
│   │   │   │   ├── ReelCardsCarousel.jsx
│   │   │   │   └── ...            # Other UI components
│   │   │   └── ...                # Other components
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx    # Authentication context
│   │   ├── config/
│   │   │   ├── api.js             # API configuration
│   │   ├── i18n/
│   │   │   ├── config.js          # i18n configuration
│   │   │   └── locales/           # Translation files
│   │   │       ├── en.json
│   │   │       ├── hi.json
│   │   │       └── ...            # Other language files
│   │   ├── lib/
│   │   │   ├── utils.js           # Utility functions
│   │   ├── App.jsx                # Main app component
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Global styles
│   ├── public/                    # Static assets
│   ├── package.json
│   ├── vite.config.js             # Vite configuration
│   ├── tailwind.config.js         # Tailwind configuration
│   └── README.md
│
├── README.md                      # This file
├── Logo.png                       # Project logo
└── ...                            # Other documentation files
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **MongoDB**: MongoDB database (local or cloud instance)
- **Redis**: Redis server (optional, for caching)
- **Git**: Version control system

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd NoMan-hackcbs
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

4. **Set up environment variables**
   
   Create a `.env` file in the `backend` directory:
   ```env
   # Database
   MONGO_URL=mongodb://localhost:27017/hexagon
   
   # Authentication
   JWT_SECRET=your_jwt_secret_key
   SESSION_SECRET=your_session_secret_key
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # URLs
   BACKEND_BASE_URL=http://localhost:5003
   FRONTEND_URL=http://localhost:5173
   
   # VAPID Keys for Push Notifications
   VAPID_PUBLIC_KEY=your_vapid_public_key
   VAPID_PRIVATE_KEY=your_vapid_private_key
   VAPID_EMAIL=mailto:your-email@example.com
   
   # Stripe (optional)
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_TEST_SECRET_KEY=your_stripe_test_secret_key
   
   # Redis (optional)
   REDIS_URL=redis://localhost:6379
   
   # AI Services (optional)
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   OPENAI_API_KEY=your_openai_api_key
   GROQ_API_KEY=your_groq_api_key
   TAVILY_API_KEY=your_tavily_api_key
   
   # Server
   PORT=5003
   NODE_ENV=development
   ```

   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:5003
   VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
   ```

5. **Generate VAPID keys** (for push notifications)
   ```bash
   cd backend
   node src/scripts/generateVapidKeys.js
   ```
   Copy the generated keys to your `.env` file.

6. **Start MongoDB and Redis** (if running locally)
   ```bash
   # MongoDB
   mongod
   
   # Redis (if installed)
   redis-server
   ```

7. **Run database migrations** (if needed)
   ```bash
   cd backend
   node src/scripts/migrateRoles.js
   ```

8. **Seed initial data** (optional)
   ```bash
   cd backend
   npm run seed:courses
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```
   The backend will run on `http://localhost:5003`

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. **Access the application**
   - Open your browser and navigate to `http://localhost:5173`
   - Create an account or sign in with Google OAuth

---

## ⚙️ Configuration

### Backend Configuration

#### Database Configuration
- **MongoDB**: Set `MONGO_URL` in `.env` file
- **Redis**: Set `REDIS_URL` in `.env` file (optional)

#### Authentication Configuration
- **JWT Secret**: Generate a secure random string for `JWT_SECRET`
- **Session Secret**: Generate a secure random string for `SESSION_SECRET`
- **Google OAuth**: 
  - Create a project in Google Cloud Console
  - Enable Google+ API
  - Create OAuth 2.0 credentials
  - Add authorized redirect URIs
  - Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

#### Push Notifications
- **VAPID Keys**: Generate using `node src/scripts/generateVapidKeys.js`
- Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_EMAIL` in `.env`

#### Payment Configuration
- **Stripe**: 
  - Create a Stripe account
  - Get API keys from Stripe Dashboard
  - Set `STRIPE_SECRET_KEY` or `STRIPE_TEST_SECRET_KEY` in `.env`
  - Set `VITE_STRIPE_PUBLIC_KEY` in frontend `.env`

#### AI Services Configuration
- **Google Gemini**: Get API key from Google AI Studio
- **OpenAI**: Get API key from OpenAI Platform
- **Groq**: Get API key from Groq Console
- **Tavily**: Get API key from Tavily API

### Frontend Configuration

#### API Configuration
- Update `VITE_API_URL` in `.env` to match your backend URL
- For production, update `DEPLOYED_URL` in `src/config/api.js`

#### Internationalization
- Supported languages are in `src/i18n/locales/`
- Add new languages by creating new JSON files
- Update `src/i18n/config.js` to include new languages

---

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "User Name",
  "role": "student"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Google OAuth
```http
GET /auth/google/url?role=student
```

#### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer <token>
```

### User Endpoints

#### Get Current User
```http
GET /users/me
Authorization: Bearer <token>
```

#### Update User Profile
```http
PUT /users/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "Updated Name",
  "bio": "User bio",
  "avatar": "avatar_url"
}
```

#### Upload Resume
```http
POST /users/upload-resume
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <resume_file>
```

### Course Endpoints

#### Get All Courses
```http
GET /courses
```

#### Get Course by ID
```http
GET /courses/:id
```

#### Create Course
```http
POST /courses
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Course Title",
  "description": "Course Description",
  "category": "Technology",
  "price": 99.99
}
```

#### Enroll in Course
```http
POST /enrollments
Authorization: Bearer <token>
Content-Type: application/json

{
  "courseId": "course_id_here"
}
```

#### Get User Enrollments
```http
GET /enrollments/me
Authorization: Bearer <token>
```

### Post Endpoints

#### Get All Posts
```http
GET /posts
```

#### Create Post
```http
POST /posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Post content",
  "images": ["image_url_1", "image_url_2"]
}
```

#### Like/Unlike Post
```http
POST /posts/:id/like
Authorization: Bearer <token>
```

#### Add Comment
```http
POST /posts/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Comment content"
}
```

### Reel Endpoints

#### Get All Reels
```http
GET /reels
```

#### Create Reel
```http
POST /reels
Authorization: Bearer <token>
Content-Type: multipart/form-data

title: "Reel Title"
description: "Reel Description"
video: <video_file>
```

#### Generate Reel Script (AI)
```http
POST /reels/generate-script
Authorization: Bearer <token>
Content-Type: application/json

{
  "topic": "Topic for reel",
  "duration": 60
}
```

### Community Endpoints

#### Get All Communities
```http
GET /communities
```

#### Create Community
```http
POST /communities
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Community Name",
  "description": "Community Description",
  "category": "Technology"
}
```

#### Join Community
```http
POST /communities/:id/join
Authorization: Bearer <token>
```

### Payment Endpoints

#### Create Payment Intent
```http
POST /payments/create-intent
Authorization: Bearer <token>
Content-Type: application/json

{
  "postId": "post_id_here",
  "amount": 10.00,
  "message": "Support message"
}
```

#### Confirm Payment
```http
POST /payments/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentIntentId": "payment_intent_id",
  "postId": "post_id_here"
}
```

#### Get Funding Stats
```http
GET /payments/post/:postId
```

### VR Endpoints

#### Get VR Room Info
```http
GET /vr
```

#### Get Users in VR Room
```http
GET /vr/users
```

#### Get Classrooms
```http
GET /vr/classrooms
```

### Analytics Endpoints

#### Get User Analytics
```http
GET /analytics/me
Authorization: Bearer <token>
```

#### Get Activity Heatmap
```http
GET /analytics/activity-heatmap
Authorization: Bearer <token>
```

### Socket.IO Events

#### VR Namespace (`/vr`)
- `join-room`: Join a VR room
- `leave-room`: Leave a VR room
- `update-position`: Update avatar position
- `send-message`: Send chat message
- `upload-whiteboard`: Upload whiteboard image

#### Notifications Namespace (`/notifications`)
- `subscribe`: Subscribe to notifications
- `unsubscribe`: Unsubscribe from notifications
- `notification`: Receive notification

#### Random Video Namespace (`/random-video`)
- `join-queue`: Join video call queue
- `leave-queue`: Leave video call queue
- `match-found`: Match found for video call
- `call-ended`: Video call ended

---

## 🔍 Key Features Deep Dive

### VR Classroom Architecture

The VR classroom uses React Three Fiber for 3D rendering and Socket.IO for real-time communication:

- **3D Environment**: Custom-built school with multiple classrooms using Three.js
- **Avatar System**: Each user gets a 3D avatar with position tracking
- **Voice Chat**: Web Audio API for real-time voice communication
- **Whiteboard**: Synchronized image sharing across all users in a room
- **Group Chat**: Text messaging within classrooms
- **Position-based Joining**: Users automatically join/leave meetings based on avatar position
- **Multi-classroom Support**: Independent meetings for each classroom

### AI-Powered Reel Generation

The Reels Studio uses Google Gemini API to generate educational reel scripts:

- **Topic-based Generation**: Input a topic and get a structured script
- **Duration Control**: Specify reel duration (30s, 60s, 90s)
- **Educational Focus**: Scripts are tailored for educational content
- **Multi-language Support**: Generate scripts in different languages

### Real-time Notifications

The platform uses Web Push API and Socket.IO for real-time notifications:

- **Push Notifications**: Browser push notifications for important events
- **Socket.IO Notifications**: Real-time in-app notifications
- **Notification Center**: Centralized notification management
- **Notification Types**: Course updates, new followers, comments, likes, etc.

### Payment & Funding System

Integrated with Stripe for secure payment processing:

- **Post Funding**: Users can fund posts with minimum $0.50
- **Payment Processing**: Secure payment processing via Stripe
- **Payment History**: Track donations and earnings
- **Funding Statistics**: View funding stats for each post

### Period Tracking

Health tracking feature for menstrual cycle:

- **Period Logging**: Log periods and symptoms
- **Period History**: View historical data
- **Health Insights**: Get insights based on tracking data
- **Privacy**: All period data is private and encrypted

### Analytics & Insights

Comprehensive analytics for users:

- **Activity Heatmap**: GitHub-style activity visualization
- **Performance Charts**: Monthly performance tracking
- **Skill Progress**: Track progress across skills
- **Course Analytics**: Completion rates by category
- **Engagement Metrics**: Track likes, comments, follows

### Community System

Community-based features for group interactions:

- **Community Creation**: Create communities around topics
- **Community Membership**: Join and participate in communities
- **Community Pages**: Dedicated pages for each community
- **Community Discovery**: Discover communities based on interests

---

## 🎨 Implementation

<!-- Add implementation images here -->
<!-- 
### Screenshots

#### Landing Page
![Landing Page](screenshots/landing-page.png)

#### Dashboard
![Dashboard](screenshots/dashboard.png)

#### VR Classroom
![VR Classroom](screenshots/vr-classroom.png)

#### Course Page
![Course Page](screenshots/course-page.png)

#### Reels Feed
![Reels Feed](screenshots/reels-feed.png)

#### Community Page
![Community Page](screenshots/community-page.png)
-->

### Implementation Details

<!-- Add implementation details, architecture diagrams, flowcharts, etc. here -->

---

## 🚀 Deployment

### Backend Deployment (Vercel)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy Backend**
   ```bash
   cd backend
   vercel
   ```

3. **Set Environment Variables**
   - Go to Vercel Dashboard
   - Navigate to your project settings
   - Add all environment variables from `.env`

4. **Configure Vercel**
   - Set build command: `npm run vercel-build`
   - Set output directory: `.`
   - Set install command: `npm install`

### Frontend Deployment (Vercel)

1. **Deploy Frontend**
   ```bash
   cd frontend
   vercel
   ```

2. **Set Environment Variables**
   - Add `VITE_API_URL` with your backend URL
   - Add `VITE_STRIPE_PUBLIC_KEY` if using Stripe

3. **Configure Vercel**
   - Set build command: `npm run build`
   - Set output directory: `dist`
   - Set install command: `npm install`

### Database Deployment (MongoDB Atlas)

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free cluster

2. **Configure Database**
   - Create a database user
   - Whitelist IP addresses (or allow all for development)
   - Get connection string

3. **Update Environment Variables**
   - Set `MONGO_URL` with your Atlas connection string

### Redis Deployment (Redis Cloud)

1. **Create Redis Cloud Account**
   - Go to [Redis Cloud](https://redis.com/try-free/)
   - Create a free database

2. **Configure Redis**
   - Get connection URL
   - Update `REDIS_URL` in environment variables

### Environment Variables for Production

Make sure to set all required environment variables in your deployment platform:

- Database URLs
- Authentication secrets
- API keys
- Service URLs
- Stripe keys
- VAPID keys

---

## 🤝 Contributing

We welcome contributions to Hexagon! Here's how you can help:

### How to Contribute

1. **Fork the Repository**
   - Click the "Fork" button on GitHub
   - Clone your forked repository

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments where necessary
   - Update documentation if needed

4. **Test Your Changes**
   - Test locally before submitting
   - Ensure all tests pass
   - Test edge cases

5. **Commit Your Changes**
   ```bash
   git commit -m "Add: Description of your changes"
   ```
   Use conventional commit messages:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for updates to existing features
   - `Remove:` for removing features
   - `Docs:` for documentation changes

6. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to the original repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Describe your changes
   - Submit the pull request

### Code Style Guidelines

- **JavaScript/React**: Follow ESLint configuration
- **Naming**: Use camelCase for variables and functions, PascalCase for components
- **Comments**: Add comments for complex logic
- **Documentation**: Update README and code comments when adding features

### Reporting Issues

If you find a bug or have a suggestion:

1. **Check Existing Issues**: Make sure the issue hasn't been reported
2. **Create an Issue**: 
   - Use a descriptive title
   - Provide detailed description
   - Include steps to reproduce (for bugs)
   - Add screenshots if applicable

### Feature Requests

We welcome feature requests! Please:

1. **Check Existing Requests**: Make sure it hasn't been requested
2. **Create an Issue**: 
   - Use "Feature Request" label
   - Describe the feature clearly
   - Explain the use case
   - Suggest implementation if possible

---

## 📄 License

This project is licensed under the ISC License.

---

## 👥 Team

<!-- Add team members and contributors here -->

---

## 🙏 Acknowledgments

- React community for excellent documentation
- MongoDB for database solutions
- Vercel for deployment platform
- Stripe for payment processing
- Google for AI services
- All contributors and supporters

---

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

<div align="center">

**Made with ❤️ for women's empowerment**

[Documentation](./docs) • [Issues](https://github.com/your-repo/issues) • [Discussions](https://github.com/your-repo/discussions)

</div>
