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
  DollarSign,
  MousePointer,
  Target,
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
  const [heatmapData, setHeatmapData] = useState([]);

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
      const [overviewRes, activityRes, postsRes, reelsRes, heatmapRes] = await Promise.all([
        fetch(API_CONFIG.getApiUrl(`/analytics/overview?days=${days}`), { headers }),
        fetch(API_CONFIG.getApiUrl(`/analytics/activity?days=${days}`), { headers }),
        fetch(API_CONFIG.getApiUrl('/analytics/posts?limit=10'), { headers }),
        fetch(API_CONFIG.getApiUrl('/analytics/reels?limit=10'), { headers }),
        fetch(API_CONFIG.getApiUrl('/analytics/heatmap'), { headers }),
      ]);

      if (!overviewRes.ok || !activityRes.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const [overviewData, activityData, postsData, reelsData, heatmapData] = await Promise.all([
        overviewRes.json(),
        activityRes.json(),
        postsRes.json(),
        reelsRes.json(),
        heatmapRes.ok ? heatmapRes.json() : Promise.resolve({ heatmap: [] }),
      ]);

      setOverview(overviewData);
      setActivityData(activityData);
      setTopPosts(postsData.posts || []);
      setTopReels(reelsData.reels || []);
      
      // Set real heatmap data from backend
      if (heatmapData?.heatmap) {
        setHeatmapData(heatmapData.heatmap);
      }
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

  const isEnterprise = user?.role === 'enterprise';
  const adAnalytics = overview.advertisements || null;

  // Calculate percentage changes based on recent vs total
  const calculateChange = (recent, total) => {
    if (!total || total === 0) return { value: '0%', trend: 'neutral' };
    const recentPercent = (recent / total) * 100;
    if (recentPercent > 15) return { value: `+${recentPercent.toFixed(1)}%`, trend: 'up' };
    if (recentPercent < 5) return { value: `${recentPercent.toFixed(1)}%`, trend: 'down' };
    return { value: `${recentPercent.toFixed(1)}%`, trend: 'neutral' };
  };

  const postsChange = calculateChange(overview.recent?.posts || 0, overview.overview?.totalPosts || 0);
  const reelsChange = calculateChange(overview.recent?.reels || 0, overview.overview?.totalReels || 0);
  const likesChange = calculateChange(overview.recent?.likes || 0, overview.overview?.totalLikes || 0);
  const commentsChange = calculateChange(overview.recent?.comments || 0, overview.overview?.totalComments || 0);
  const followersChange = calculateChange(overview.recent?.followers || 0, overview.overview?.totalFollowers || 0);

  const stats = [
    {
      label: 'Total Posts',
      value: overview.overview?.totalPosts?.toLocaleString() || '0',
      change: postsChange.value,
      trend: postsChange.trend,
      icon: FileText,
    },
    {
      label: 'Total Reels',
      value: overview.overview?.totalReels?.toLocaleString() || '0',
      change: reelsChange.value,
      trend: reelsChange.trend,
      icon: Video,
    },
    {
      label: 'Total Views',
      value: overview.overview?.totalViews?.toLocaleString() || '0',
      change: 'Reels only',
      trend: 'neutral',
      icon: Eye,
    },
    {
      label: 'Total Likes',
      value: overview.overview?.totalLikes?.toLocaleString() || '0',
      change: likesChange.value,
      trend: likesChange.trend,
      icon: Heart,
    },
    {
      label: 'Total Comments',
      value: overview.overview?.totalComments?.toLocaleString() || '0',
      change: commentsChange.value,
      trend: commentsChange.trend,
      icon: MessageCircle,
    },
    {
      label: 'Total Followers',
      value: overview.overview?.totalFollowers?.toLocaleString() || '0',
      change: followersChange.value,
      trend: followersChange.trend,
      icon: Users,
    },
  ];

  // Add advertisement stats for enterprise users
  if (isEnterprise && adAnalytics) {
    const adCTR = adAnalytics.clickThroughRate || adAnalytics.ctr || 0;
    stats.push(
      {
        label: 'Active Ads',
        value: `${adAnalytics.activeAds || 0} / ${adAnalytics.totalAds || 0}`,
        change: `${adCTR.toFixed(1)}% CTR`,
        trend: adCTR > 2 ? 'up' : 'neutral',
        icon: Target,
      },
      {
        label: 'Ad Views',
        value: adAnalytics.totalViews?.toLocaleString() || '0',
        change: `$${(adAnalytics.costPerView || 0).toFixed(3)}/view`,
        trend: 'neutral',
        icon: Eye,
      },
      {
        label: 'Ad Clicks',
        value: adAnalytics.totalClicks?.toLocaleString() || '0',
        change: `$${(adAnalytics.costPerClick || 0).toFixed(2)}/click`,
        trend: 'neutral',
        icon: MousePointer,
      }
    );
  }

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
                        <ArrowUp className="w-3.5 h-3.5 text-green-600" />
                      ) : stat.trend === 'down' ? (
                        <ArrowDown className="w-3.5 h-3.5 text-red-600" />
                      ) : null}
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

        {/* Activity Heatmap */}
        <div className="bg-black/5 border border-black/10 rounded-2xl p-6 hover:bg-black/10 hover:border-black/20 transition-all duration-300 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-black/5 border border-black/10">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium">Activity Heatmap</h2>
                <p className="text-black/40 text-sm">Your contribution activity over the last year</p>
              </div>
            </div>
            {heatmapData.length > 0 && (
              <div className="text-right">
                <p className="text-2xl font-bold text-black">
                  {heatmapData.reduce((sum, day) => sum + day.count, 0).toLocaleString()}
                </p>
                <p className="text-xs text-black/50">Total activities</p>
              </div>
            )}
          </div>
          
          {heatmapData.length > 0 ? (
            <div className="overflow-x-auto">
              <div className="inline-flex flex-col gap-1 min-w-max">
                {/* Month labels */}
                <div className="flex gap-1 mb-2 ml-8">
                  {Array.from({ length: 12 }, (_, i) => {
                    const monthDate = new Date();
                    monthDate.setMonth(monthDate.getMonth() - (11 - i));
                    return (
                      <div key={i} className="text-xs text-black/50" style={{ width: '60px' }}>
                        {monthDate.toLocaleDateString('en-US', { month: 'short' })}
                      </div>
                    );
                  })}
                </div>
                
                {/* Heatmap grid */}
                <div className="flex gap-1">
                  {/* Day labels */}
                  <div className="flex flex-col gap-1 text-xs text-black/50 justify-around pr-2">
                    <div>Mon</div>
                    <div>Wed</div>
                    <div>Fri</div>
                  </div>
                  
                  {/* Weeks */}
                  <div className="flex gap-1">
                    {Array.from({ length: 53 }, (_, weekIndex) => (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {Array.from({ length: 7 }, (_, dayIndex) => {
                          const dataIndex = weekIndex * 7 + dayIndex;
                          const dayData = heatmapData[dataIndex];
                          
                          if (!dayData) return <div key={dayIndex} className="w-3 h-3" />;
                          
                          const colors = [
                            'bg-black/5',      // level 0 - no activity
                            'bg-green-200',    // level 1 - low
                            'bg-green-400',    // level 2 - medium
                            'bg-green-600',    // level 3 - high
                            'bg-green-800',    // level 4 - very high
                          ];
                          
                          return (
                            <div
                              key={dayIndex}
                              className={`w-3 h-3 rounded-sm ${colors[dayData.level]} border border-black/10 hover:ring-2 hover:ring-black/30 transition-all cursor-pointer`}
                              title={`${dayData.date}: ${dayData.count} activities`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Legend */}
                <div className="flex items-center gap-2 mt-4 text-xs text-black/50">
                  <span>Less</span>
                  {[0, 1, 2, 3, 4].map(level => (
                    <div
                      key={level}
                      className={`w-3 h-3 rounded-sm border border-black/10 ${
                        level === 0 ? 'bg-black/5' :
                        level === 1 ? 'bg-green-200' :
                        level === 2 ? 'bg-green-400' :
                        level === 3 ? 'bg-green-600' :
                        'bg-green-800'
                      }`}
                    />
                  ))}
                  <span>More</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-black/50 text-center py-8">No activity data available</p>
          )}
        </div>

        {/* Advertisement Analytics (Enterprise only) */}
        {isEnterprise && adAnalytics && (
          <div className="bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-6 hover:border-violet-300 transition-all duration-300 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-violet-600 text-white">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-violet-900">Advertisement Analytics</h2>
                <p className="text-violet-600 text-sm">Campaign performance & billing</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white/70 rounded-xl p-4 border border-violet-200">
                <p className="text-violet-600 text-sm font-medium mb-1">Total Budget</p>
                <p className="text-2xl font-bold text-violet-900">${adAnalytics.totalBudget?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-white/70 rounded-xl p-4 border border-violet-200">
                <p className="text-violet-600 text-sm font-medium mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-violet-900">${adAnalytics.totalSpent?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-white/70 rounded-xl p-4 border border-violet-200">
                <p className="text-violet-600 text-sm font-medium mb-1">Remaining</p>
                <p className="text-2xl font-bold text-green-600">${adAnalytics.remainingBudget?.toFixed(2) || '0.00'}</p>
              </div>
              <div className="bg-white/70 rounded-xl p-4 border border-violet-200">
                <p className="text-violet-600 text-sm font-medium mb-1">CTR</p>
                <p className="text-2xl font-bold text-violet-900">{adAnalytics.ctr?.toFixed(2) || '0.00'}%</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/70 rounded-xl p-4 border border-violet-200">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-4 h-4 text-violet-600" />
                  <p className="text-violet-600 text-sm font-medium">Total Views</p>
                </div>
                <p className="text-xl font-bold text-violet-900">{adAnalytics.totalViews?.toLocaleString() || '0'}</p>
                <p className="text-xs text-violet-500 mt-1">Cost: ${adAnalytics.costPerView?.toFixed(4) || '0.00'}/view</p>
              </div>
              <div className="bg-white/70 rounded-xl p-4 border border-violet-200">
                <div className="flex items-center gap-2 mb-2">
                  <MousePointer className="w-4 h-4 text-violet-600" />
                  <p className="text-violet-600 text-sm font-medium">Total Clicks</p>
                </div>
                <p className="text-xl font-bold text-violet-900">{adAnalytics.totalClicks?.toLocaleString() || '0'}</p>
                <p className="text-xs text-violet-500 mt-1">Cost: ${adAnalytics.costPerClick?.toFixed(4) || '0.00'}/click</p>
              </div>
              <div className="bg-white/70 rounded-xl p-4 border border-violet-200">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-4 h-4 text-violet-600" />
                  <p className="text-violet-600 text-sm font-medium">Total Reactions</p>
                </div>
                <p className="text-xl font-bold text-violet-900">{adAnalytics.totalReactions?.toLocaleString() || '0'}</p>
                <p className="text-xs text-violet-500 mt-1">Engagement boost</p>
              </div>
            </div>
          </div>
        )}

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