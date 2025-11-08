import React, { useState, useEffect } from 'react';
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
  ArrowUp,
  ArrowDown,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import API_CONFIG from '../../config/api';

const AdvancedDashboard = () => {
  const { token, user } = useAuth();
  const [days, setDays] = useState(30);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [activityData, setActivityData] = useState(null);
  const [topPosts, setTopPosts] = useState([]);
  const [topReels, setTopReels] = useState([]);
  const [error, setError] = useState(null);
  const [collaborationRate, setCollaborationRate] = useState(null);

  // Calculate dynamic collaboration rate based on analytics
  const calculateCollaborationRate = (analyticsData) => {
    if (!analyticsData || !analyticsData.overview) return null;

    const {
      totalPosts = 0,
      totalReels = 0,
      totalViews = 0,
      totalLikes = 0,
      totalComments = 0,
      totalFollowers = 0,
    } = analyticsData.overview;

    // Base rate calculation factors
    const BASE_RATE = 50; // Minimum rate in USD
    const FOLLOWER_MULTIPLIER = 0.05; // $0.05 per follower
    const ENGAGEMENT_MULTIPLIER = 0.02; // $0.02 per engagement (like/comment)
    const VIEW_MULTIPLIER = 0.001; // $0.001 per view
    const CONTENT_QUALITY_BONUS = 100; // Bonus for consistent content creation

    // Calculate engagement rate
    const totalEngagements = totalLikes + totalComments;
    const engagementRate = totalFollowers > 0 ? (totalEngagements / totalFollowers) * 100 : 0;

    // Calculate content consistency score (posts + reels in last 30 days)
    const totalContent = totalPosts + totalReels;
    const contentScore = Math.min(totalContent / 10, 1); // Max score at 10+ content pieces

    // Calculate rate components
    const followerValue = totalFollowers * FOLLOWER_MULTIPLIER;
    const engagementValue = totalEngagements * ENGAGEMENT_MULTIPLIER;
    const viewValue = totalViews * VIEW_MULTIPLIER;
    const contentBonus = contentScore * CONTENT_QUALITY_BONUS;

    // Engagement rate multiplier (higher engagement = higher rate)
    let engagementMultiplier = 1;
    if (engagementRate > 10) engagementMultiplier = 1.5;
    else if (engagementRate > 5) engagementMultiplier = 1.3;
    else if (engagementRate > 3) engagementMultiplier = 1.15;

    // Calculate final rate
    const calculatedRate = (
      BASE_RATE +
      followerValue +
      engagementValue +
      viewValue +
      contentBonus
    ) * engagementMultiplier;

    // Determine tier based on rate
    let tier = 'Emerging';
    let tierColor = 'text-blue-600';
    if (calculatedRate >= 5000) {
      tier = 'Elite';
      tierColor = 'text-purple-600';
    } else if (calculatedRate >= 2000) {
      tier = 'Professional';
      tierColor = 'text-green-600';
    } else if (calculatedRate >= 500) {
      tier = 'Rising Star';
      tierColor = 'text-yellow-600';
    }

    return {
      rate: Math.round(calculatedRate),
      minRate: Math.round(calculatedRate * 0.8), // 20% below
      maxRate: Math.round(calculatedRate * 1.3), // 30% above
      tier,
      tierColor,
      engagementRate: engagementRate.toFixed(2),
      breakdown: {
        base: BASE_RATE,
        followers: Math.round(followerValue),
        engagement: Math.round(engagementValue),
        views: Math.round(viewValue),
        contentBonus: Math.round(contentBonus),
        multiplier: engagementMultiplier.toFixed(2),
      },
    };
  };

  useEffect(() => {
    if (token) {
      fetchAnalytics();
    } else {
      setError('No authentication token found');
      setLoading(false);
    }
  }, [token, days]);

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

      // Calculate collaboration rate
      const rate = calculateCollaborationRate(overviewData);
      setCollaborationRate(rate);
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-black/20 px-4 py-3 rounded-lg shadow-2xl">
          <p className="text-black font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-black/70 text-sm">
              {entry.name}: <span className="text-black font-medium">{entry.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 text-black/60">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center bg-black/5 p-8 rounded-lg border border-black/10">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-black/80 transition-colors"
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
      value: overview.overview?.totalPosts?.toLocaleString() || '0',
      change: '+12.5%',
      trend: 'up',
      icon: FileText,
    },
    {
      label: 'Total Reels',
      value: overview.overview?.totalReels?.toLocaleString() || '0',
      change: '+8.3%',
      trend: 'up',
      icon: Video,
    },
    {
      label: 'Total Views',
      value: overview.overview?.totalViews?.toLocaleString() || '0',
      change: '+23.7%',
      trend: 'up',
      icon: Eye,
    },
    {
      label: 'Total Likes',
      value: overview.overview?.totalLikes?.toLocaleString() || '0',
      change: '+15.2%',
      trend: 'up',
      icon: Heart,
    },
    {
      label: 'Total Comments',
      value: overview.overview?.totalComments?.toLocaleString() || '0',
      change: '+18.9%',
      trend: 'up',
      icon: MessageCircle,
    },
    {
      label: 'Total Followers',
      value: overview.overview?.totalFollowers?.toLocaleString() || '0',
      change: '+7.8%',
      trend: 'up',
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center pt-20">
        {/* Header */}
      <header className="w-full border-b border-black/10 backdrop-blur-xl bg-white/50 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-black/5 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div>
                <h1 className="text-2xl font-light tracking-tight">Analytics</h1>
                <p className="text-black/40 text-sm mt-0.5">Performance Overview</p>
              </div>
        </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 bg-black/5 rounded-full p-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                days === d
                        ? 'bg-black text-white shadow-lg'
                        : 'text-black/60 hover:text-black hover:bg-black/5'
              }`}
            >
                    {d}D
            </button>
          ))}
        </div>
              <div className="w-10 h-10 rounded-full bg-black/10 border border-black/20 flex items-center justify-center">
                <span className="text-sm font-medium">JD</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="w-full max-w-[1400px] mx-auto px-6 py-8">
        {/* Collaboration Rate Card */}
        {collaborationRate && (
          <div className="mb-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 border-2 border-purple-200 rounded-3xl p-8 shadow-xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Brand Collaboration Rate</h2>
                <p className="text-gray-600">Your estimated value for brand partnerships</p>
              </div>
              <div className={`px-4 py-2 rounded-full bg-white border-2 border-purple-200 ${collaborationRate.tierColor} font-bold text-sm`}>
                {collaborationRate.tier}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <p className="text-gray-500 text-sm mb-2">Minimum Rate</p>
                <p className="text-3xl font-bold text-gray-900">${collaborationRate.minRate.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Per collaboration</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl p-6 shadow-lg transform scale-105">
                <p className="text-white/80 text-sm mb-2">Recommended Rate</p>
                <p className="text-4xl font-bold text-white">${collaborationRate.rate.toLocaleString()}</p>
                <p className="text-xs text-white/70 mt-1">Your sweet spot</p>
              </div>
              
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <p className="text-gray-500 text-sm mb-2">Maximum Rate</p>
                <p className="text-3xl font-bold text-gray-900">${collaborationRate.maxRate.toLocaleString()}</p>
                <p className="text-xs text-gray-400 mt-1">Premium brands</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Base Rate</span>
                  <span className="font-semibold text-gray-900">${collaborationRate.breakdown.base}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm text-gray-600">Followers</span>
                  <span className="font-semibold text-blue-900">${collaborationRate.breakdown.followers.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm text-gray-600">Engagement</span>
                  <span className="font-semibold text-green-900">${collaborationRate.breakdown.engagement.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm text-gray-600">Views</span>
                  <span className="font-semibold text-purple-900">${collaborationRate.breakdown.views.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <span className="text-sm text-gray-600">Content Bonus</span>
                  <span className="font-semibold text-yellow-900">${collaborationRate.breakdown.contentBonus.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                  <span className="text-sm text-gray-600">Multiplier</span>
                  <span className="font-semibold text-pink-900">{collaborationRate.breakdown.multiplier}x</span>
                </div>
              </div>
              
              <div className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Engagement Rate</span>
                  <span className="text-lg font-bold text-purple-900">{collaborationRate.engagementRate}%</span>
                </div>
                <div className="mt-2 w-full bg-white rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(parseFloat(collaborationRate.engagementRate) * 10, 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>💡 Pro Tip:</strong> Your rate increases with consistent posting, higher engagement, and growing follower base. 
                  Maintain quality content to reach the next tier!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const isHovered = hoveredCard === `stat-${index}`;
            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredCard(`stat-${index}`)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative bg-black/5 border border-black/10 rounded-2xl p-6 transition-all duration-500 hover:bg-black/10 hover:border-black/20 ${
                  isHovered ? 'scale-[1.02] shadow-2xl shadow-black/5' : ''
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-black/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-black/5 border border-black/10 group-hover:bg-black group-hover:border-black transition-all duration-300">
                      <Icon className={`w-5 h-5 transition-colors duration-300 ${isHovered ? 'text-white' : 'text-black'}`} />
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/5 border border-black/10">
                      {stat.trend === 'up' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-black" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-black/40" />
                      )}
                      <span className="text-xs font-medium text-black">{stat.change}</span>
                  </div>
                  </div>
                  <p className="text-black/50 text-sm font-medium mb-1">{stat.label}</p>
                  <p className="text-3xl font-light tracking-tight">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Activity Chart */}
          <div className="bg-black/5 border border-black/10 rounded-2xl p-6 hover:bg-black/10 hover:border-black/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-black/5 border border-black/10">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium">Content Activity</h2>
                <p className="text-black/40 text-sm">Posts & Reels over time</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={activityData.timeSeries || []}>
                <defs>
                  <linearGradient id="postsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="reelsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#000000" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000015" />
                <XAxis dataKey="date" stroke="#00000040" style={{ fontSize: '12px' }} />
                <YAxis stroke="#00000040" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="posts"
                  stroke="#000000"
                  strokeWidth={2}
                  fill="url(#postsGradient)"
              />
              <Area
                type="monotone"
                dataKey="reels"
                  stroke="#00000080"
                  strokeWidth={2}
                  fill="url(#reelsGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Engagement Chart */}
          <div className="bg-black/5 border border-black/10 rounded-2xl p-6 hover:bg-black/10 hover:border-black/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-black/5 border border-black/10">
                <Heart className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium">Engagement Metrics</h2>
                <p className="text-black/40 text-sm">Likes & Comments breakdown</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
            <BarChart data={activityData.timeSeries || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000015" />
                <XAxis dataKey="date" stroke="#00000040" style={{ fontSize: '12px' }} />
                <YAxis stroke="#00000040" style={{ fontSize: '12px' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="likes" fill="#000000" radius={[8, 8, 0, 0]} />
                <Bar dataKey="comments" fill="#00000050" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          </div>
        </div>

        {/* Followers Growth */}
        <div className="bg-black/5 border border-black/10 rounded-2xl p-6 mb-8 hover:bg-black/10 hover:border-black/20 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-black/5 border border-black/10">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium">Followers Growth</h2>
              <p className="text-black/40 text-sm">Audience expansion timeline</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={activityData.followersGrowth || []}>
              <defs>
                <linearGradient id="followerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#000000" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#000000" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000015" />
              <XAxis dataKey="date" stroke="#00000040" style={{ fontSize: '12px' }} />
              <YAxis stroke="#00000040" style={{ fontSize: '12px' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#000000"
                strokeWidth={3}
                dot={{ fill: '#000000', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                activeDot={{ r: 7, strokeWidth: 3 }}
              />
              <Area dataKey="count" fill="url(#followerGradient)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* Top Posts */}
          <div className="bg-black/5 border border-black/10 rounded-2xl p-6 hover:bg-black/10 hover:border-black/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-black/5 border border-black/10">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium">Top Posts</h2>
                <p className="text-black/40 text-sm">Best performing content</p>
              </div>
            </div>
            <div className="space-y-3">
              {topPosts.length > 0 ? (
                topPosts.slice(0, 5).map((post, index) => (
                  <div
                    key={post._id}
                    className="group border-l-2 border-black/20 pl-4 py-3 hover:border-black hover:bg-black/5 rounded-r-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-black/40">#{index + 1}</span>
                      <span className="text-xs text-black/30">•</span>
                      <span className="text-xs text-black/40">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-black/90 mb-3 leading-relaxed line-clamp-2">
                      {post.content || 'No content'}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-xs text-black/50">
                        <Heart className="w-3.5 h-3.5" />
                        {post.likes?.toLocaleString() || 0}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-black/50">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {post.comments || 0}
                      </span>
                      <span className="ml-auto text-xs font-medium text-black">{post.engagement || 0}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-black/50 text-center py-8">No posts yet</p>
              )}
            </div>
          </div>

          {/* Top Reels */}
          <div className="bg-black/5 border border-black/10 rounded-2xl p-6 hover:bg-black/10 hover:border-black/20 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-black/5 border border-black/10">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium">Top Reels</h2>
                <p className="text-black/40 text-sm">Most engaging videos</p>
              </div>
            </div>
            <div className="space-y-3">
              {topReels.length > 0 ? (
                topReels.slice(0, 5).map((reel, index) => (
                  <div
                    key={reel._id}
                    className="group border-l-2 border-black/20 pl-4 py-3 hover:border-black hover:bg-black/5 rounded-r-lg transition-all duration-300"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-black/40">#{index + 1}</span>
                      <span className="text-xs text-black/30">•</span>
                      <span className="text-xs text-black/40">{new Date(reel.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-black/90 mb-3 leading-relaxed line-clamp-2">
                      {reel.title || 'Untitled Reel'}
                    </p>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-xs text-black/50">
                        <Eye className="w-3.5 h-3.5" />
                        {reel.views?.toLocaleString() || 0}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-black/50">
                        <Heart className="w-3.5 h-3.5" />
                        {reel.likes?.toLocaleString() || 0}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-black/50">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {reel.comments || 0}
                      </span>
                      <span className="ml-auto text-xs font-medium text-black">{Math.round(reel.engagement) || 0}%</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-black/50 text-center py-8">No reels yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-black/5 border border-black/10 rounded-2xl p-6 hover:bg-black/10 hover:border-black/20 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-black/5 border border-black/10">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium">Recent Activity</h2>
              <p className="text-black/40 text-sm">Last 7 days summary</p>
            </div>
            </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'New Posts', value: overview.recent?.posts || 0, icon: FileText },
              { label: 'New Reels', value: overview.recent?.reels || 0, icon: Video },
              { label: 'Likes', value: overview.recent?.likes?.toLocaleString() || '0', icon: Heart },
              { label: 'Comments', value: overview.recent?.comments || 0, icon: MessageCircle },
              { label: 'Followers', value: overview.recent?.followers || 0, icon: Users },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="text-center p-5 bg-black/5 border border-black/10 rounded-xl hover:bg-black hover:text-white transition-all duration-300 group"
                >
                  <div className="flex justify-center mb-3">
                    <Icon className="w-5 h-5 text-black group-hover:text-white transition-colors" />
            </div>
                  <p className="text-2xl font-light mb-1">{item.value}</p>
                  <p className="text-xs text-black/40 group-hover:text-white/60 transition-colors">{item.label}</p>
            </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDashboard;