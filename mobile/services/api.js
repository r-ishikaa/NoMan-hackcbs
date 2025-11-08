import API_CONFIG from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper to get auth token
const getToken = async () => {
  try {
    return await AsyncStorage.getItem('hexagon_token');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

// API service functions
export const api = {
  // Auth endpoints
  login: async (email, password) => {
    const response = await fetch(API_CONFIG.getApiUrl('/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Login failed');
    }
    return data;
  },

  signup: async (email, password, username, role = 'user') => {
    const response = await fetch(API_CONFIG.getApiUrl('/auth/signup'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, username, role }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Signup failed');
    }
    return data;
  },

  // User endpoints
  getMe: async () => {
    const token = await getToken();
    const response = await fetch(API_CONFIG.getApiUrl('/users/me'), {
      headers: API_CONFIG.getAuthHeaders(token),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    return response.json();
  },

  updateProfile: async (profileData) => {
    const token = await getToken();
    const response = await fetch(API_CONFIG.getApiUrl('/users/me'), {
      method: 'PUT',
      headers: API_CONFIG.getAuthHeaders(token),
      body: JSON.stringify(profileData),
    });
    if (!response.ok) {
      throw new Error('Failed to update profile');
    }
    return response.json();
  },

  // Course endpoints
  getCourses: async () => {
    const response = await fetch(API_CONFIG.getApiUrl('/courses'));
    if (!response.ok) {
      throw new Error('Failed to fetch courses');
    }
    return response.json();
  },

  getCourse: async (courseId) => {
    const response = await fetch(API_CONFIG.getApiUrl(`/courses/${courseId}`));
    if (!response.ok) {
      throw new Error('Failed to fetch course');
    }
    return response.json();
  },

  enrollInCourse: async (courseId) => {
    const token = await getToken();
    const response = await fetch(API_CONFIG.getApiUrl('/enrollments'), {
      method: 'POST',
      headers: API_CONFIG.getAuthHeaders(token),
      body: JSON.stringify({ courseId }),
    });
    if (!response.ok) {
      throw new Error('Failed to enroll in course');
    }
    return response.json();
  },

  getMyEnrollments: async () => {
    const token = await getToken();
    const response = await fetch(API_CONFIG.getApiUrl('/enrollments/me'), {
      headers: API_CONFIG.getAuthHeaders(token),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch enrollments');
    }
    return response.json();
  },

  // Post endpoints
  getPosts: async (accountId = null) => {
    const url = accountId 
      ? API_CONFIG.getApiUrl(`/posts?accountId=${encodeURIComponent(accountId)}`)
      : API_CONFIG.getApiUrl('/posts');
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch posts');
    }
    return response.json();
  },

  createPost: async (content, images = []) => {
    const token = await getToken();
    const response = await fetch(API_CONFIG.getApiUrl('/posts'), {
      method: 'POST',
      headers: API_CONFIG.getAuthHeaders(token),
      body: JSON.stringify({ content, images }),
    });
    if (!response.ok) {
      throw new Error('Failed to create post');
    }
    return response.json();
  },

  likePost: async (postId) => {
    const token = await getToken();
    const response = await fetch(API_CONFIG.getApiUrl(`/posts/${postId}/like`), {
      method: 'POST',
      headers: API_CONFIG.getAuthHeaders(token),
    });
    if (!response.ok) {
      throw new Error('Failed to like post');
    }
    return response.json();
  },

  // Reel endpoints
  getReels: async () => {
    const token = await getToken();
    const response = await fetch(API_CONFIG.getApiUrl('/reels'), {
      headers: API_CONFIG.getAuthHeaders(token),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch reels');
    }
    const data = await response.json();
    return Array.isArray(data.reels) ? data.reels : [];
  },

  // Profile endpoints
  getProfile: async (accountId) => {
    const response = await fetch(API_CONFIG.getApiUrl(`/profiles?accountId=${encodeURIComponent(accountId)}`));
    if (!response.ok) {
      throw new Error('Failed to fetch profile');
    }
    const data = await response.json();
    return Array.isArray(data) ? data[0] : data;
  },

  // Follow endpoints
  followUser: async (followingId) => {
    const token = await getToken();
    const response = await fetch(API_CONFIG.getApiUrl('/follow'), {
      method: 'POST',
      headers: API_CONFIG.getAuthHeaders(token),
      body: JSON.stringify({ followingId }),
    });
    if (!response.ok) {
      throw new Error('Failed to follow user');
    }
    return response.json();
  },

  unfollowUser: async (followingId) => {
    const token = await getToken();
    const response = await fetch(API_CONFIG.getApiUrl('/follow'), {
      method: 'DELETE',
      headers: API_CONFIG.getAuthHeaders(token),
      body: JSON.stringify({ followingId }),
    });
    if (!response.ok) {
      throw new Error('Failed to unfollow user');
    }
    return response.json();
  },

  getFollowStats: async (accountId) => {
    const response = await fetch(API_CONFIG.getApiUrl(`/follow/stats?accountId=${encodeURIComponent(accountId)}`));
    if (!response.ok) {
      throw new Error('Failed to fetch follow stats');
    }
    return response.json();
  },

  // Community endpoints
  getCommunities: async () => {
    const response = await fetch(API_CONFIG.getApiUrl('/api/communities'));
    if (!response.ok) {
      throw new Error('Failed to fetch communities');
    }
    return response.json();
  },

  getJoinedCommunities: async () => {
    const token = await getToken();
    const response = await fetch(API_CONFIG.getApiUrl('/api/communities/me/joined'), {
      headers: API_CONFIG.getAuthHeaders(token),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch joined communities');
    }
    return response.json();
  },
};

export default api;

