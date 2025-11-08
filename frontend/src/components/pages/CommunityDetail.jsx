"use client";
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { communityData } from "../../data/CommunityData";
import Navbar from "../Navbar/Navbar";
import { Plus, Users, ArrowLeft, Grid, FileText } from "lucide-react";
import PostCard from "../PostCard.jsx";
import PostComposer from "../PostComposer.jsx";
import API_CONFIG from "../../config/api";

function authHeaders() {
  const token =
    localStorage.getItem('hexagon_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const CommunityDetail = () => {
  const { communityName } = useParams();
  const [isMember, setIsMember] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState(null);
  const [community, setCommunity] = useState(null);
  const [communityLoading, setCommunityLoading] = useState(true);

  // Convert "Health & Wellness" → "health-and-wellness"
  const slugify = (text) =>
    text.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-");

  const toggleMembership = async () => {
    if (!meId || !community) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    try {
      const endpoint = isMember ? 'leave' : 'join';
      const slug = community.slug || communityName;
      
      // Check if community exists in backend (has _id that's a valid MongoDB ObjectId)
      const hasBackendId = community._id && /^[0-9a-fA-F]{24}$/.test(String(community._id));
      
      // Prepare request body - include community data if joining a static/dummy community
      // This allows backend to create the community if it doesn't exist
      const requestBody = !hasBackendId && !isMember ? {
        name: community.communityName || community.name,
        description: community.description || '',
        image: community.image || '',
        tags: community.tags || [],
        bgColor: community.bgColor || 'bg-purple-300',
      } : {};
      
      const res = await fetch(
        API_CONFIG.getApiUrl(`/api/communities/${slug}/${endpoint}`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          ...(Object.keys(requestBody).length > 0 && { body: JSON.stringify(requestBody) }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setIsMember(!isMember);
        
        // Update community state with backend data
        if (data.community) {
          setCommunity((prev) => ({
            ...prev,
            _id: data.community._id || prev._id,
            memberCount: data.community.memberCount || prev.memberCount,
            slug: data.community.slug || prev.slug || slug,
          }));
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Failed to toggle membership:', errorData);
        const errorMessage = errorData.error || errorData.message || 'Failed to update membership';
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Error toggling membership:', error);
      alert(error.message || 'An error occurred. Please try again.');
    }
  };

  // Helper to get color variants from bgColor class
  const getColorVariants = (bgColor) => {
    const colorMap = {
      "bg-emerald-300": {
        bg: "bg-emerald-300",
        bgLight: "bg-emerald-50",
        bgDark: "bg-emerald-600",
        text: "text-emerald-700",
        border: "border-emerald-600",
        borderLight: "border-emerald-300",
        button: "bg-emerald-600 hover:bg-emerald-700",
        buttonLight: "bg-emerald-100 text-emerald-700",
      },
      "bg-pink-300": {
        bg: "bg-pink-300",
        bgLight: "bg-pink-50",
        bgDark: "bg-pink-600",
        text: "text-pink-700",
        border: "border-pink-600",
        borderLight: "border-pink-300",
        button: "bg-pink-600 hover:bg-pink-700",
        buttonLight: "bg-pink-100 text-pink-700",
      },
      "bg-blue-300": {
        bg: "bg-blue-300",
        bgLight: "bg-blue-50",
        bgDark: "bg-blue-600",
        text: "text-blue-700",
        border: "border-blue-600",
        borderLight: "border-blue-300",
        button: "bg-blue-600 hover:bg-blue-700",
        buttonLight: "bg-blue-100 text-blue-700",
      },
      "bg-orange-300": {
        bg: "bg-orange-300",
        bgLight: "bg-orange-50",
        bgDark: "bg-orange-600",
        text: "text-orange-700",
        border: "border-orange-600",
        borderLight: "border-orange-300",
        button: "bg-orange-600 hover:bg-orange-700",
        buttonLight: "bg-orange-100 text-orange-700",
      },
      "bg-purple-300": {
        bg: "bg-purple-300",
        bgLight: "bg-purple-50",
        bgDark: "bg-purple-600",
        text: "text-purple-700",
        border: "border-purple-600",
        borderLight: "border-purple-300",
        button: "bg-purple-600 hover:bg-purple-700",
        buttonLight: "bg-purple-100 text-purple-700",
      },
      "bg-yellow-300": {
        bg: "bg-yellow-300",
        bgLight: "bg-yellow-50",
        bgDark: "bg-yellow-600",
        text: "text-yellow-700",
        border: "border-yellow-600",
        borderLight: "border-yellow-300",
        button: "bg-yellow-600 hover:bg-yellow-700",
        buttonLight: "bg-yellow-100 text-yellow-700",
      },
      "bg-indigo-300": {
        bg: "bg-indigo-300",
        bgLight: "bg-indigo-50",
        bgDark: "bg-indigo-600",
        text: "text-indigo-700",
        border: "border-indigo-600",
        borderLight: "border-indigo-300",
        button: "bg-indigo-600 hover:bg-indigo-700",
        buttonLight: "bg-indigo-100 text-indigo-700",
      },
      "bg-teal-300": {
        bg: "bg-teal-300",
        bgLight: "bg-teal-50",
        bgDark: "bg-teal-600",
        text: "text-teal-700",
        border: "border-teal-600",
        borderLight: "border-teal-300",
        button: "bg-teal-600 hover:bg-teal-700",
        buttonLight: "bg-teal-100 text-teal-700",
      },
      "bg-rose-300": {
        bg: "bg-rose-300",
        bgLight: "bg-rose-50",
        bgDark: "bg-rose-600",
        text: "text-rose-700",
        border: "border-rose-600",
        borderLight: "border-rose-300",
        button: "bg-rose-600 hover:bg-rose-700",
        buttonLight: "bg-rose-100 text-rose-700",
      },
      "bg-cyan-300": {
        bg: "bg-cyan-300",
        bgLight: "bg-cyan-50",
        bgDark: "bg-cyan-600",
        text: "text-cyan-700",
        border: "border-cyan-600",
        borderLight: "border-cyan-300",
        button: "bg-cyan-600 hover:bg-cyan-700",
        buttonLight: "bg-cyan-100 text-cyan-700",
      },
      "bg-lime-300": {
        bg: "bg-lime-300",
        bgLight: "bg-lime-50",
        bgDark: "bg-lime-600",
        text: "text-lime-700",
        border: "border-lime-600",
        borderLight: "border-lime-300",
        button: "bg-lime-600 hover:bg-lime-700",
        buttonLight: "bg-lime-100 text-lime-700",
      },
      "bg-sky-300": {
        bg: "bg-sky-300",
        bgLight: "bg-sky-50",
        bgDark: "bg-sky-600",
        text: "text-sky-700",
        border: "border-sky-600",
        borderLight: "border-sky-300",
        button: "bg-sky-600 hover:bg-sky-700",
        buttonLight: "bg-sky-100 text-sky-700",
      },
    };
    return colorMap[bgColor] || colorMap["bg-purple-300"];
  };

  // Fetch community from backend
  useEffect(() => {
    const fetchCommunity = async () => {
      setCommunityLoading(true);
      try {
        // First try backend
        const res = await fetch(API_CONFIG.getApiUrl(`/api/communities/${communityName}`));
        if (res.ok) {
          const data = await res.json();
          if (data && data.community) {
            // Try to get bgColor from static data if not in backend
            const staticCommunity = communityData.find(
              (c) => slugify(c.communityName) === data.community.name
            );
            setCommunity({
              _id: data.community._id,
              communityName: data.community.name,
              name: data.community.name,
              description: data.community.description || "",
              image: data.community.image || "",
              memberCount: data.community.memberCount || 0,
              tags: data.community.tags || [],
              bgColor: data.community.bgColor || staticCommunity?.bgColor || "bg-purple-300",
              slug: data.community.slug,
            });
            return; // Success, exit early
          }
        } else if (res.status === 404) {
          // Community not found in backend, try static data
          const staticCommunity = communityData.find(
            (c) => slugify(c.communityName) === communityName
          );
          if (staticCommunity) {
            // Set community with proper structure and 0 member count
            setCommunity({
              name: staticCommunity.communityName,
              communityName: staticCommunity.communityName,
              slug: slugify(staticCommunity.communityName),
              description: staticCommunity.description || "",
              image: staticCommunity.image || "",
              tags: staticCommunity.tags || [],
              memberCount: 0, // Always start with 0
              bgColor: staticCommunity.bgColor || "bg-purple-300",
            });
            return;
          }
        }
        
        // If we get here, community not found anywhere
        console.warn(`Community "${communityName}" not found in backend or static data`);
      } catch (error) {
        console.error("Failed to fetch community:", error);
        // Fallback to static data on error
        try {
          const staticCommunity = communityData.find(
            (c) => slugify(c.communityName) === communityName
          );
          if (staticCommunity) {
            // Set community with proper structure and 0 member count
            setCommunity({
              name: staticCommunity.communityName,
              communityName: staticCommunity.communityName,
              slug: slugify(staticCommunity.communityName),
              description: staticCommunity.description || "",
              image: staticCommunity.image || "",
              tags: staticCommunity.tags || [],
              memberCount: 0, // Always start with 0
              bgColor: staticCommunity.bgColor || "bg-purple-300",
            });
          }
        } catch (fallbackError) {
          console.error("Failed to load static community data:", fallbackError);
        }
      } finally {
        setCommunityLoading(false);
      }
    };
    fetchCommunity();
  }, [communityName]);

  // Get current user ID and check membership status
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await fetch(API_CONFIG.getApiUrl('/users/me'), {
          headers: authHeaders(),
        });
        if (res.ok) {
          const me = await res.json();
          const userId = me?._id || null;
          setMeId(userId);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
      }
    };
    fetchMe();
  }, []);

  // Check membership status when community is loaded
  useEffect(() => {
    const checkMembership = async () => {
      if (!meId || !community || !communityName) return;
      
      // Only check if community exists in backend (has valid MongoDB ObjectId)
      const hasBackendId = community._id && /^[0-9a-fA-F]{24}$/.test(String(community._id));
      
      if (hasBackendId) {
        try {
          const memberRes = await fetch(
            API_CONFIG.getApiUrl(`/api/communities/${communityName}/is-member`),
            {
              headers: authHeaders(),
            }
          );
          if (memberRes.ok) {
            const { isMember } = await memberRes.json();
            setIsMember(isMember);
          }
        } catch (error) {
          console.error("Failed to check membership:", error);
        }
      } else {
        // Static community - not a member yet (will be set when they join)
        setIsMember(false);
      }
    };
    
    checkMembership();
  }, [meId, community, communityName]);

  // 🧩 Fetch posts for this community
  useEffect(() => {
    // Only fetch posts if community exists in backend (has valid MongoDB ObjectId)
    if (!community) return;
    const hasBackendId = community._id && /^[0-9a-fA-F]{24}$/.test(String(community._id));
    if (!hasBackendId) {
      // Static community - no posts yet
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const fetchPosts = async () => {
      try {
        const res = await fetch(
          API_CONFIG.getApiUrl(
            `/posts?community=${encodeURIComponent(community._id)}`
          )
        );
        const data = res.ok ? await res.json() : [];
        const normalized = (Array.isArray(data) ? data : []).map((p) => ({
          id: p.id || p._id,
          accountId: p.accountId,
          content: p.content,
          image: null,
          images: (p.images || []).map((u) => API_CONFIG.getApiUrl(u)),
          likes: Number(p.likes || p.likesCount || 0),
          comments: Number(p.comments || p.commentsCount || 0),
          timestamp: new Date(p.createdAt || Date.now()).toLocaleString(),
          author: p.author || {
            name: "Anonymous",
            username: p.accountId,
            avatarUrl: null,
          },
        }));
        setPosts(normalized);
      } catch (error) {
        console.error("Failed to fetch community posts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [community?._id]);

  if (communityLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 pt-20">
          <p className="text-lg text-gray-500">Loading community...</p>
        </div>
      </>
    );
  }

  if (!community) {
    return (
      <>
        <Navbar />
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 pt-20">
        <h2 className="text-2xl font-bold mb-2">Community Not Found</h2>
        <Link to="/communities" className="text-purple-600 underline">
          ← Back to Communities
        </Link>
      </div>
      </>
    );
  }

  const colorVariants = community ? getColorVariants(community.bgColor || "bg-purple-300") : getColorVariants("bg-purple-300");

  return (
    <>
      <Navbar />
      <div
        className={`min-h-screen ${community?.bgColor || "bg-purple-300"} transition-all duration-700 pt-28 px-8 flex flex-col items-center`}
      >
        {/* 🟣 Header Section */}
        <div className={`w-full max-w-7xl rounded-3xl shadow-xl ${colorVariants.bgLight}/90 backdrop-blur-md p-10 relative overflow-hidden border-2 ${colorVariants.border}`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex-1 space-y-5">
              <Link
                to="/communities"
                className={`inline-flex items-center gap-2 text-sm font-semibold ${colorVariants.text} hover:opacity-80 transition-all`}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Communities
              </Link>

              <h1 className={`text-5xl font-black leading-tight ${colorVariants.text} uppercase`}>
                {community.communityName || community.name}
              </h1>
              <p className="text-lg text-gray-800 font-medium">
                {community.description || ""}
              </p>

              <div className="flex items-center gap-6 mt-6 flex-wrap">
                <div className={`flex items-center gap-2 ${colorVariants.text} font-semibold`}>
                  <Users className="w-5 h-5" /> {typeof community.memberCount === 'number' ? community.memberCount : parseInt(community.memberCount) || 0} {typeof community.memberCount === 'number' && community.memberCount === 1 ? 'member' : 'members'}
                </div>

                <button
                  onClick={toggleMembership}
                  className={`px-6 py-2 rounded-full font-semibold shadow-md transition-all 
                  ${
                    isMember
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : `${colorVariants.button} text-white`
                  }`}
                >
                  {isMember ? "Leave Community" : "Join Community"}
                </button>

              </div>
            </div>

            <div className="flex-1 relative flex justify-center">
              {community.image && (
              <img
                src={community.image}
                  alt={community.communityName || community.name}
                className="w-[380px] h-[300px] object-cover shadow-2xl rounded-2xl transform hover:scale-[1.03] transition-all duration-500"
                style={{
                  clipPath: "polygon(10% 0%, 100% 5%, 90% 100%, 0% 95%)",
                }}
              />
              )}
            </div>
          </div>
        </div>

        {/* 💫 Posts Section */}
        <div className="w-full max-w-7xl mt-12">
          {loading ? (
            <div className={`${colorVariants.bgLight} rounded-3xl shadow-lg p-10 border-2 ${colorVariants.border} max-w-3xl w-full mx-auto`}>
              <p className={`text-center ${colorVariants.text} text-lg`}>Loading...</p>
            </div>
          ) : (
            <div className="w-full max-w-3xl mx-auto px-4">
              {/* Instagram-style Posts Header */}
              <div className={`mb-8 pb-6 border-b ${colorVariants.borderLight} border-opacity-30`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${colorVariants.bgDark} bg-opacity-10 backdrop-blur-sm`}>
                    <FileText className={`w-5 h-5 ${colorVariants.text}`} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1">
                    <h2 className={`text-2xl font-bold ${colorVariants.text} tracking-tight mb-1`}>
                      Posts
                    </h2>
                    <p className={`text-sm ${colorVariants.text} opacity-75 font-medium`}>
                      {posts.length} {posts.length === 1 ? 'post' : 'posts'} in this community
                    </p>
                  </div>
                </div>
              </div>

              {/* Post Composer - Show if user is a member */}
              {isMember && meId && (
                <div className="mb-6">
                  <PostComposer 
                    communityId={community?._id}
                    onCreated={async (newPost) => {
                      // Refetch posts to get author information from backend
                      try {
                        const res = await fetch(
                          API_CONFIG.getApiUrl(`/posts?community=${encodeURIComponent(community._id)}`)
                        );
                        if (res.ok) {
                          const data = await res.json();
                          const normalized = (Array.isArray(data) ? data : []).map((p) => ({
                            id: p.id || p._id,
                            accountId: p.accountId,
                            content: p.content,
                            image: null,
                            images: (p.images || []).map((u) => API_CONFIG.getApiUrl(u)),
                            likes: Number(p.likes || p.likesCount || 0),
                            comments: Number(p.comments || p.commentsCount || 0),
                            timestamp: new Date(p.createdAt || Date.now()).toLocaleString(),
                            author: p.author || {
                              name: "Anonymous",
                              username: p.accountId,
                              avatarUrl: null,
                            },
                          }));
                          setPosts(normalized);
                        }
                      } catch (error) {
                        console.error("Failed to refresh posts:", error);
                        // Fallback: add the post with basic info
                        const formattedPost = {
                          id: newPost.id || newPost._id,
                          accountId: newPost.accountId,
                          content: newPost.content,
                          community: newPost.community || community?._id,
                          image: null,
                          images: newPost.images || [],
                          likes: newPost.likes || 0,
                          comments: newPost.comments || 0,
                          timestamp: newPost.timestamp || new Date().toLocaleString(),
                          author: newPost.author || null,
                        };
                        setPosts((arr) => [formattedPost, ...arr]);
                      }
                    }}
                  />
                </div>
              )}
              
              {/* Posts Grid */}
              {posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div key={post.id || post._id} className="w-full">
                      <PostCard
                        post={post}
                        authorName={post.author?.name || "Anonymous"}
                        authorUsername={post.author?.username || post.accountId}
                        authorAvatarUrl={post.author?.avatarUrl}
                        authorAccountId={post.accountId}
                        viewerAccountId={meId}
                        canDelete={meId && post.accountId === meId}
                        onDelete={async () => {
                          try {
                            const res = await fetch(
                              API_CONFIG.getApiUrl(`/posts/${encodeURIComponent(post.id)}`),
                              {
                                method: 'DELETE',
                                headers: authHeaders(),
                              }
                            );
                            if (res.ok) {
                              setPosts((arr) => arr.filter((x) => x.id !== post.id));
                            }
                          } catch {
                            // ignore
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`${colorVariants.bgLight} rounded-3xl shadow-lg p-10 border-2 ${colorVariants.border} text-center`}>
                  <div className={`inline-flex p-4 rounded-full ${colorVariants.bgDark} bg-opacity-10 mb-4`}>
                    <FileText className={`w-8 h-8 ${colorVariants.text} opacity-70`} />
                  </div>
                  <p className={`${colorVariants.text} text-lg font-medium`}>
                    No posts yet in this community
                  </p>
                  <p className={`${colorVariants.text} text-sm opacity-70 mt-2`}>
                    {isMember ? "Be the first to share something!" : "Join the community to start posting!"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CommunityDetail;

