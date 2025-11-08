import { Calendar, ArrowRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import API_CONFIG from '../../config/api';
import PeriodTracker from './PeriodTracker';

function authHeaders() {
  const token =
    localStorage.getItem('hexagon_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function Dashboard() {
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinedCommunities, setJoinedCommunities] = useState([]);
  const [communitiesLoading, setCommunitiesLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const meRes = await fetch(API_CONFIG.getApiUrl('/users/me'), { headers: { ...authHeaders() } });
        const meJ = meRes.ok ? await meRes.json() : null;
        if (!cancelled) {
          setMe(meJ);
        }
        // try load profile
        try {
          const accountId = meJ?._id || meJ?.id || meJ?.username;
          if (accountId) {
            const prRes = await fetch(API_CONFIG.getApiUrl(`/profiles?accountId=${encodeURIComponent(accountId)}`));
            const arr = prRes.ok ? await prRes.json() : [];
            if (!cancelled) setProfile(arr?.[0] || null);
          }
        } catch {
          // Ignore profile fetch errors
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, []);

  // Fetch joined communities
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(API_CONFIG.getApiUrl('/api/communities/me/joined'), {
          headers: { ...authHeaders() },
        });
        if (res.ok) {
          const communities = await res.json();
          if (!cancelled) {
            setJoinedCommunities(Array.isArray(communities) ? communities : []);
          }
        }
      } catch (error) {
        console.error('Failed to fetch joined communities:', error);
      } finally {
        if (!cancelled) setCommunitiesLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, []);


  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-50 to-white">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {profile?.displayName || me?.username || 'there'}! 👋
          </h1>
          <p className="text-gray-600">Your personal dashboard</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Period Tracker */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Period Tracker</h2>
              <PeriodTracker />
            </div>

            {/* Activity Heat Map */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Activity Heat Map</h2>
              <p className="text-sm text-gray-500 mb-6">Your activity over the past year</p>
              <div className="overflow-x-auto">
                <div className="flex gap-1 mb-2">
                  {Array.from({ length: 53 }, (_, weekIndex) => {
                    const weekData = Array.from({ length: 7 }, (_, dayIndex) => {
                      // Generate random activity levels (0-4) for heat map
                      const activityLevel = Math.floor(Math.random() * 5);
                      return activityLevel;
                    });
                    return (
                      <div key={weekIndex} className="flex flex-col gap-1">
                        {weekData.map((level, dayIndex) => {
                          const intensity = level / 4;
                          const bgColor = intensity === 0 ? '#ebedf0' :
                            intensity <= 0.25 ? '#fecdd3' :
                            intensity <= 0.5 ? '#fda4af' :
                            intensity <= 0.75 ? '#fb7185' : '#f43f5e';
                          return (
                            <div
                              key={dayIndex}
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: bgColor }}
                              title={`Activity level: ${level}`}
                            />
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
                  <span>Less</span>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-sm bg-gray-200"></div>
                    <div className="w-3 h-3 rounded-sm bg-pink-200"></div>
                    <div className="w-3 h-3 rounded-sm bg-pink-400"></div>
                    <div className="w-3 h-3 rounded-sm bg-pink-600"></div>
                    <div className="w-3 h-3 rounded-sm bg-rose-600"></div>
                  </div>
                  <span>More</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Communities */}
          <div className="space-y-6">
            {/* Joined Communities */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">My Communities</h3>
                <Link to="/communities" className="text-sm text-pink-600 hover:text-pink-700 hover:underline font-medium">
                  Explore
                </Link>
              </div>
              {communitiesLoading ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="animate-pulse">Loading communities...</div>
                </div>
              ) : joinedCommunities.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {joinedCommunities.map((community) => {
                    const slugify = (text) => text.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-");
                    const communitySlug = community.slug || slugify(community.name);
                    return (
                      <Link
                        key={community._id}
                        to={`/communities/${communitySlug}`}
                        className="flex items-center gap-3 p-4 rounded-xl border border-zinc-200 hover:bg-pink-50 hover:border-pink-200 transition-all group"
                      >
                        {community.image ? (
                          <img
                            src={community.image}
                            alt={community.name}
                            className="h-14 w-14 rounded-xl object-cover flex-shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className={`h-14 w-14 rounded-xl ${community.bgColor || 'bg-pink-300'} flex-shrink-0 flex items-center justify-center text-white font-bold text-xl shadow-sm`}>
                            {community.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate group-hover:text-pink-700 transition">
                            {community.name}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-600 mt-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>{community.memberCount || 0} members</span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-zinc-400 group-hover:text-pink-600 transition flex-shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-pink-500" />
                  </div>
                  <p className="text-sm text-zinc-600 mb-4">You haven't joined any communities yet</p>
                  <Link
                    to="/communities"
                    className="inline-block px-5 py-2.5 bg-pink-600 text-white rounded-lg text-sm font-medium hover:bg-pink-700 transition shadow-sm"
                  >
                    Explore Communities
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
