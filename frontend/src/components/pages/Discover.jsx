import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import API_CONFIG from '../../config/api';
import PostCard from '../PostCard';
import { Compass, Users, RefreshCw, Sparkles, TrendingUp } from 'lucide-react';

function authHeaders() {
  const token =
    localStorage.getItem('hexagon_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt') ||
    '';
  
  if (!token) {
    return {};
  }
  
  return { Authorization: `Bearer ${token}` };
}

const Discover = () => {
  const { user, token, loading: authLoading, isAuthenticated } = useAuth();
  const [followingPosts, setFollowingPosts] = useState([]);
  const [recommendedPosts, setRecommendedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState({}); // Cache for author profiles
  const [followingCount, setFollowingCount] = useState(0);
  const [error, setError] = useState(null);

  // Get token from localStorage as fallback
  const getToken = () => {
    return token || 
           localStorage.getItem('hexagon_token') ||
           localStorage.getItem('token') ||
           localStorage.getItem('jwt');
  };

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return;
    }

    const currentToken = getToken();
    if (currentToken && (isAuthenticated() || user)) {
      fetchFollowingCount();
      fetchFollowingFeed();
      fetchRecommendedPosts();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, authLoading, isAuthenticated]);

  const fetchFollowingFeed = async () => {
    const currentToken = getToken();
    if (!currentToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = authHeaders();
      const response = await fetch(
        API_CONFIG.getApiUrl('/posts/following'),
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else {
          setError(errorData.error || 'Failed to fetch posts');
        }
        return;
      }

      const postsData = await response.json();
      setFollowingPosts(Array.isArray(postsData) ? postsData : []);

      // Fetch profiles for all unique authors
      await fetchProfilesForPosts(postsData);
    } catch (err) {
      console.error('Discover feed error:', err);
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedPosts = async () => {
    const currentToken = getToken();
    if (!currentToken) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const headers = authHeaders();
      const response = await fetch(
        API_CONFIG.getApiUrl('/posts/recommended?limit=30'),
        {
          headers: {
            ...headers,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        if (response.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else {
          setError(errorData.error || 'Failed to fetch recommendations');
        }
        return;
      }

      const postsData = await response.json();
      setRecommendedPosts(Array.isArray(postsData) ? postsData : []);

      // Fetch profiles for all unique authors
      await fetchProfilesForPosts(postsData);
    } catch (err) {
      console.error('Recommended posts error:', err);
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfilesForPosts = async (postsData) => {
      const uniqueAccountIds = [
        ...new Set(postsData.map((p) => p.accountId)),
      ];

      const profilePromises = uniqueAccountIds.map(async (accountId) => {
        try {
          const profileRes = await fetch(
            API_CONFIG.getApiUrl(`/profiles?accountId=${encodeURIComponent(accountId)}`)
          );
          if (profileRes.ok) {
            const profileArr = await profileRes.json();
            return { accountId, profile: profileArr[0] || null };
          }
        } catch (err) {
          console.error(`Failed to fetch profile for ${accountId}:`, err);
        }
        return { accountId, profile: null };
      });

      const profileResults = await Promise.all(profilePromises);
      const profileMap = {};
      profileResults.forEach(({ accountId, profile }) => {
        profileMap[accountId] = profile;
      });
    setProfiles(prev => ({ ...prev, ...profileMap }));
  };

  const fetchFollowingCount = async () => {
    const currentToken = getToken();
    if (!currentToken) return;

    try {
      const meRes = await fetch(API_CONFIG.getApiUrl('/users/me'), {
        headers: authHeaders(),
      });
      if (meRes.ok) {
        const me = await meRes.json();
        const accountId = me?._id || me?.id;
        if (accountId) {
          const statsRes = await fetch(
            API_CONFIG.getApiUrl(`/follow/stats?accountId=${encodeURIComponent(accountId)}`)
          );
          if (statsRes.ok) {
            const stats = await statsRes.json();
            setFollowingCount(stats.following || 0);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch following count:', err);
    }
  };

  const handleRefresh = () => {
    fetchFollowingFeed();
    fetchRecommendedPosts();
  };

  // Wait for auth to load
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Check authentication - use multiple methods
  const currentToken = getToken();
  const isAuth = isAuthenticated() || (currentToken && user);

  if (!isAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md mx-auto">
          <Compass className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Discover Feed
          </h2>
          <p className="text-gray-600 mb-6">
            Please log in to see posts from people you follow and discover new content
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  // Combine following and recommended posts
  const allPosts = [...followingPosts, ...recommendedPosts];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-16 pb-8 px-4 flex justify-center">
      {/* Centered Container */}
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="mb-6 bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Compass className="w-8 h-8 text-violet-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Discover</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Posts from people you follow and recommended content
                </p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
              title="Refresh feed"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>
                Following <span className="font-semibold text-gray-900">{followingCount}</span> people
              </span>
            </div>
            <div>
              <span className="font-semibold text-gray-900">{followingPosts.length}</span> following posts
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              <span>
                <span className="font-semibold text-gray-900">{recommendedPosts.length}</span> recommended
              </span>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-red-600 mb-3">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && allPosts.length === 0 && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading posts...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && allPosts.length === 0 && !error && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No posts yet
            </h2>
            <p className="text-gray-600 mb-6">
              {followingCount === 0
                ? "Start following people to see their posts here!"
                : "The people you follow haven't posted anything yet."}
            </p>
            {followingCount === 0 ? (
              <Link
                to="/profile"
                className="inline-block px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium"
              >
                Discover People
              </Link>
            ) : (
              <button
                onClick={handleRefresh}
                className="px-6 py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-700 font-medium"
              >
                Refresh Feed
              </button>
            )}
          </div>
        )}

        {/* Posts Feed */}
        {!loading && allPosts.length > 0 && (
          <div className="space-y-4 flex flex-col items-center">
            {allPosts.map((post) => {
              const profile = profiles[post.accountId] || {};
              // Convert image paths to full URLs
              const formattedPost = {
                ...post,
                timestamp: new Date(post.createdAt).toLocaleString(),
                images: (post.images || []).map((imgPath) => {
                  // If already a full URL, return as is
                  if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
                    return imgPath;
                  }
                  // Otherwise, convert relative path to full URL
                  return API_CONFIG.getApiUrl(imgPath);
                }),
              };
              return (
                <div key={post.id || post._id} className="w-full max-w-2xl">
                  <PostCard
                    post={formattedPost}
                    authorName={profile.displayName || profile.accountId}
                    authorUsername={profile.accountId}
                    authorAvatarUrl={profile.avatarUrl}
                    authorAccountId={post.accountId}
                    viewerAccountId={user?._id || user?.id}
                    canDelete={false}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Load More Info */}
        {allPosts.length > 0 && allPosts.length >= 100 && (
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Showing latest {allPosts.length} posts
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discover;
