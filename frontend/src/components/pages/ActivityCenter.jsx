import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import API_CONFIG from '../../config/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Eye,
  Heart,
  MessageCircle,
  Users,
  FileText,
  Video,
  TrendingUp,
  Calendar,
} from 'lucide-react';

const ActivityCenter = () => {
  const { user, token, role } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [topPosts, setTopPosts] = useState([]);
  const [topReels, setTopReels] = useState([]);
  const [days, setDays] = useState(30);
  const [error, setError] = useState(null);

  // Check if user is creator
  useEffect(() => {
    if (!loading && role !== 'creator' && role !== 'enterprise') {
      navigate('/profile');
    }
  }, [role, loading, navigate]);

  useEffect(() => {
    if (token && (role === 'creator' || role === 'enterprise')) {
      fetchAnalytics();
    }
  }, [token, role, days]);

  const fetchAnalytics = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch all analytics data in parallel
      const [overviewRes, activityRes, postsRes, reelsRes] = await Promise.all([
        fetch(API_CONFIG.getApiUrl(`/analytics/overview?days=${days}`), { headers }),
        fetch(API_CONFIG.getApiUrl(`/analytics/activity?days=${days}`), { headers }),
        fetch(API_CONFIG.getApiUrl('/analytics/posts?limit=10'), { headers }),
        fetch(API_CONFIG.getApiUrl('/analytics/reels?limit=10'), { headers }),
      ]);

      if (!overviewRes.ok || !activityRes.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const [overviewData, activityData, postsData, reelsData] = await Promise.all([
        overviewRes.json(),
        activityRes.json(),
        postsRes.json(),
        reelsRes.json(),
      ]);

      setOverview(overviewData);
      setActivityData(activityData);
      setTopPosts(postsData.posts || []);
      setTopReels(reelsData.reels || []);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!overview || !activityData) {
    return null;
  }

  const stats = [
    {
      label: 'Total Posts',
      value: overview.overview?.totalPosts || 0,
      icon: FileText,
      color: 'bg-blue-500',
    },
    {
      label: 'Total Reels',
      value: overview.overview?.totalReels || 0,
      icon: Video,
      color: 'bg-purple-500',
    },
    {
      label: 'Total Views',
      value: overview.overview?.totalViews?.toLocaleString() || 0,
      icon: Eye,
      color: 'bg-green-500',
    },
    {
      label: 'Total Likes',
      value: overview.overview?.totalLikes?.toLocaleString() || 0,
      icon: Heart,
      color: 'bg-red-500',
    },
    {
      label: 'Total Comments',
      value: overview.overview?.totalComments?.toLocaleString() || 0,
      icon: MessageCircle,
      color: 'bg-yellow-500',
    },
    {
      label: 'Total Followers',
      value: overview.overview?.totalFollowers?.toLocaleString() || 0,
      icon: Users,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Activity Center</h1>
          <p className="text-gray-600">Monitor your content performance and audience engagement</p>
        </div>

        {/* Time Period Selector */}
        <div className="mb-6 flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                days === d
                  ? 'bg-violet-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.color} p-4 rounded-full`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Activity Over Time Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            Activity Over Time
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={activityData.timeSeries || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="posts"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="reels"
                stackId="1"
                stroke="#8b5cf6"
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="likes"
                stackId="2"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="comments"
                stackId="2"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement Chart */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Heart className="w-6 h-6" />
            Engagement Metrics
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData.timeSeries || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="likes" fill="#ef4444" />
              <Bar dataKey="comments" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Followers Growth */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6" />
            Followers Growth
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={activityData.followersGrowth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performing Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Posts */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Top Performing Posts
            </h2>
            <div className="space-y-4">
              {topPosts.length > 0 ? (
                topPosts.slice(0, 5).map((post, index) => (
                  <div
                    key={post._id}
                    className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 rounded"
                  >
                    <p className="text-sm text-gray-600 mb-1">
                      #{index + 1} • {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-gray-900 font-medium mb-2 line-clamp-2">
                      {post.content || 'No content'}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {post.comments}
                      </span>
                      <span className="text-violet-600 font-medium">
                        Engagement: {post.engagement}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No posts yet</p>
              )}
            </div>
          </div>

          {/* Top Reels */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Video className="w-6 h-6" />
              Top Performing Reels
            </h2>
            <div className="space-y-4">
              {topReels.length > 0 ? (
                topReels.slice(0, 5).map((reel, index) => (
                  <div
                    key={reel._id}
                    className="border-l-4 border-purple-500 pl-4 py-2 hover:bg-gray-50 rounded"
                  >
                    <p className="text-sm text-gray-600 mb-1">
                      #{index + 1} • {new Date(reel.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-gray-900 font-medium mb-2 line-clamp-2">
                      {reel.title || 'Untitled Reel'}
                    </p>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {reel.views?.toLocaleString() || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        {reel.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {reel.comments}
                      </span>
                    </div>
                    <p className="text-violet-600 font-medium text-sm mt-1">
                      Engagement: {Math.round(reel.engagement)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">No reels yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-6 h-6" />
            Recent Activity (Last 7 Days)
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {overview.recent?.posts || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">New Posts</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {overview.recent?.reels || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">New Reels</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">
                {overview.recent?.likes || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Likes Received</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">
                {overview.recent?.comments || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">Comments</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <p className="text-2xl font-bold text-indigo-600">
                {overview.recent?.followers || 0}
              </p>
              <p className="text-sm text-gray-600 mt-1">New Followers</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityCenter;

