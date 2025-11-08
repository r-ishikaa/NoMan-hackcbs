import React, { useState, useEffect } from "react";
import { Search, Plus, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CommunityCard from "../ui/CommunityCard";
import { communityData } from "../../data/CommunityData";
import API_CONFIG from "../../config/api";
import Navbar from "../Navbar/Navbar";

function authHeaders() {
  const token =
    localStorage.getItem('hexagon_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('jwt')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const CommunitiesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Form state for creating community
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    tags: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Fetch communities from backend
  const fetchCommunities = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_CONFIG.getApiUrl('/api/communities'));
      if (res.ok) {
        const data = await res.json();
        setCommunities(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch communities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  // ✅ Helper to convert names to slugs for URLs
  const slugify = (text) =>
    text
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");

  // Merge backend communities with static data (prioritize backend)
  const allCommunities = React.useMemo(() => {
    const backendMap = new Map(communities.map(c => [c.slug || slugify(c.name), c]));
    const staticMap = new Map(communityData.map(c => [slugify(c.communityName), c]));
    const merged = [];
    
    // Process backend communities and enrich with static data if available
    communities.forEach(backendComm => {
      const slug = backendComm.slug || slugify(backendComm.name);
      const staticComm = staticMap.get(slug);
      merged.push({
        ...backendComm,
        bgColor: backendComm.bgColor || staticComm?.bgColor || "bg-purple-300",
        tags: backendComm.tags || staticComm?.tags || [],
        image: backendComm.image || staticComm?.image || "",
      });
    });
    
    // Add static communities that don't exist in backend
    communityData.forEach(staticComm => {
      const slug = slugify(staticComm.communityName);
      if (!backendMap.has(slug)) {
        merged.push({
          name: staticComm.communityName,
          slug: slug,
          description: staticComm.description,
          image: staticComm.image,
          tags: staticComm.tags || [],
          memberCount: 0, // Always start with 0 for static communities
          bgColor: staticComm.bgColor || "bg-purple-300",
        });
      }
    });
    
    return merged;
  }, [communities]);

  // Filter communities by search
  const filteredCommunities = allCommunities.filter(
    (card) =>
      (card.name || card.communityName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.tags || []).some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  // Handle create community
  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    setError("");
    setCreating(true);

    try {
      const tags = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await fetch(API_CONFIG.getApiUrl("/api/communities"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          image: formData.image,
          tags: tags,
        }),
      });

      if (res.ok) {
        const newCommunity = await res.json();
        // Refresh communities list from server to ensure all users see new communities
        await fetchCommunities();
        setShowCreateModal(false);
        setFormData({ name: "", description: "", image: "", tags: "" });
        // Navigate to the new community using the slug
        const slug = newCommunity.slug || slugify(newCommunity.name);
        navigate(`/communities/${slug}`);
      } else {
        try {
          const errorData = await res.json();
          setError(errorData.error || "Failed to create community");
        } catch (parseError) {
          setError("Failed to create community. Please try again.");
        }
      }
    } catch (err) {
      setError("Failed to create community. Please try again.");
      console.error("Create community error:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-white flex flex-col items-center">
        {/* Header Section */}
        <div className="w-full bg-white pt-28 pb-16 px-8 flex justify-center">
          <div className="max-w-7xl w-full">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-6">
              <div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 uppercase">
                  EXPLORE COMMUNITIES
                </h1>
                <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-3xl">
                  You've come to the right place. Discover communities to connect with
                  like-minded women.
                </p>
                <p className="text-lg text-gray-600 max-w-2xl">
                  With our platform, you're on the right track.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-full hover:bg-purple-700 transition-all shadow-md"
              >
                <Plus className="w-5 h-5" /> Create Community
              </button>
            </div>
          </div>
        </div>

      {/* Search Section */}
      <div className="w-full bg-gray-50 py-8 px-8 border-t border-b border-gray-200 flex justify-center">
        <div className="max-w-7xl w-full">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search communities, topics, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg border-2 border-black rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {searchQuery && (
            <p className="mt-4 text-gray-600">
              Found {filteredCommunities.length}{" "}
              {filteredCommunities.length === 1 ? "community" : "communities"}
            </p>
          )}
        </div>
      </div>

      {/* Cards Grid Section */}
      <div className="w-full py-20 px-10 bg-gradient-to-br from-purple-50 to-pink-50 flex justify-center">
        <div className="max-w-6xl w-full">
          {filteredCommunities.length > 0 ? (
            <div
              className="
                grid 
                grid-cols-1 
                sm:grid-cols-2 
                lg:grid-cols-3 
                gap-x-10 
                gap-y-16 
                justify-items-center
              "
            >
              {filteredCommunities.map((card, index) => {
                const communityName = card.name || card.communityName || "";
                const slug = card.slug || slugify(communityName);
                // Get bgColor from card, with fallback to static data or default
                const bgColor = card.bgColor || communityData.find(c => slugify(c.communityName) === slug)?.bgColor || "bg-purple-300";
                return (
                  <Link
                    key={card._id || index}
                    to={`/communities/${slug}`}
                    className="w-full h-full flex justify-center items-stretch"
                  >
                    <CommunityCard
                      tags={card.tags || []}
                      image={card.image || ""}
                      communityName={communityName}
                      description={card.description || ""}
                      memberCount={card.memberCount || 0}
                      bgColor={bgColor}
                      imageAlt={`${communityName} community`}
                    />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-2xl font-bold text-gray-500">
                No communities found
              </p>
              <p className="text-gray-400 mt-2">
                Try searching with different keywords
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div className="w-full flex justify-center items-center gap-4 py-12 bg-gradient-to-br from-purple-50 to-pink-50">
        {[1, 2, 3, 4].map((num) => (
          <button
            key={num}
            className={`w-10 h-10 rounded-full border-2 ${
              num === 3
                ? "border-purple-500 bg-purple-500 text-white"
                : "border-gray-300 hover:border-purple-500 hover:bg-purple-50"
            } transition-all`}
          >
            {num}
          </button>
        ))}
      </div>

      {/* Create Community Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Community</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ name: "", description: "", image: "", tags: "" });
                    setError("");
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateCommunity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Community Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Women in Tech"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe what your community is about..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., TECH, CAREER, NETWORKING"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({ name: "", description: "", image: "", tags: "" });
                      setError("");
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-60"
                  >
                    {creating ? "Creating..." : "Create Community"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default CommunitiesPage;

