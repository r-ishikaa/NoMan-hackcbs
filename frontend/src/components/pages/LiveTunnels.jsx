import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { Play, Users, Activity, Trash2, ExternalLink, Eye } from "lucide-react";
import API_CONFIG from "../../config/api";
import GoLiveButton from "../GoLiveButton";
import TunnelConnectionModal from "../TunnelConnectionModal";
import { useNavigate } from "react-router-dom";

const LiveTunnels = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myTunnels, setMyTunnels] = useState([]);
  const [publicTunnels, setPublicTunnels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-tunnels");
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedTunnel, setSelectedTunnel] = useState(null);

  useEffect(() => {
    fetchMyTunnels();
    fetchPublicTunnels();
    const interval = setInterval(() => {
      fetchMyTunnels();
      fetchPublicTunnels();
    }, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMyTunnels = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        API_CONFIG.getApiUrl("/api/tunnels/my-tunnels"),
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setMyTunnels(data.tunnels);
      }
    } catch (error) {
      console.error("Error fetching my tunnels:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicTunnels = async () => {
    try {
      const response = await fetch(
        API_CONFIG.getApiUrl("/api/tunnels/discover?limit=20")
      );
      const data = await response.json();
      if (response.ok) {
        setPublicTunnels(data.tunnels);
      }
    } catch (error) {
      console.error("Error fetching public tunnels:", error);
    }
  };

  const handleTunnelCreated = (tunnelData) => {
    setSelectedTunnel(tunnelData);
    setShowConnectionModal(true);
    fetchMyTunnels();
  };

  const handleCloseTunnel = async (tunnelId) => {
    if (!confirm("Are you sure you want to close this tunnel?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        API_CONFIG.getApiUrl(`/api/tunnels/${tunnelId}`),
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        fetchMyTunnels();
      } else {
        alert("Failed to close tunnel");
      }
    } catch (error) {
      console.error("Error closing tunnel:", error);
      alert("Failed to close tunnel");
    }
  };

  const handleViewTunnel = (tunnel) => {
    navigate(`/live/${tunnel.username}/${tunnel.projectName}`);
  };

  const formatDuration = (startedAt) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diff = Math.floor((now - start) / 1000);

    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  };

  const TunnelCard = ({ tunnel, isMine }) => (
    <div className="tunnel-card">
      <div className="tunnel-header">
        <div className="tunnel-title">
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>LIVE</span>
          </div>
          <h3>{tunnel.projectName}</h3>
        </div>
        <div className="tunnel-meta">
          {tunnel.metadata?.framework && (
            <span className="badge">{tunnel.metadata.framework}</span>
          )}
          {tunnel.metadata?.category && (
            <span className="badge">{tunnel.metadata.category}</span>
          )}
        </div>
      </div>

      <div className="tunnel-info">
        {!isMine && tunnel.userId && (
          <div className="tunnel-creator">
            <img
              src={tunnel.userId.profilePicture || "/default-avatar.png"}
              alt={tunnel.userId.username}
              className="creator-avatar"
            />
            <span>{tunnel.userId.username}</span>
          </div>
        )}

        {tunnel.description && (
          <p className="tunnel-description">{tunnel.description}</p>
        )}

        <div className="tunnel-stats">
          <div className="stat">
            <Users size={16} />
            <span>{tunnel.stats?.viewersCount || 0} viewers</span>
          </div>
          <div className="stat">
            <Activity size={16} />
            <span>{formatDuration(tunnel.startedAt)}</span>
          </div>
        </div>

        {tunnel.publicUrl && (
          <div className="tunnel-url">
            <code>{tunnel.publicUrl}</code>
          </div>
        )}
      </div>

      <div className="tunnel-actions">
        <button
          onClick={() => handleViewTunnel(tunnel)}
          className="btn-primary"
        >
          <Eye size={16} />
          <span>View Live</span>
        </button>

        {isMine && (
          <button
            onClick={() => handleCloseTunnel(tunnel.tunnelId)}
            className="btn-danger"
          >
            <Trash2 size={16} />
            <span>Close</span>
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="page-container live-tunnels-page">
      <div className="page-header">
        <div>
          <h1>🚀 LocalHost Social</h1>
          <p>Share your localhost projects live with the world</p>
        </div>
        <GoLiveButton onTunnelCreated={handleTunnelCreated} />
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === "my-tunnels" ? "active" : ""}`}
          onClick={() => setActiveTab("my-tunnels")}
        >
          My Tunnels ({myTunnels.length})
        </button>
        <button
          className={`tab ${activeTab === "discover" ? "active" : ""}`}
          onClick={() => setActiveTab("discover")}
        >
          Discover ({publicTunnels.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === "my-tunnels" && (
          <div className="tunnels-grid">
            {myTunnels.length === 0 ? (
              <div className="empty-state">
                <Play size={48} />
                <h3>No Active Tunnels</h3>
                <p>Click "Go Live" to share your localhost project</p>
              </div>
            ) : (
              myTunnels.map((tunnel) => (
                <TunnelCard
                  key={tunnel.tunnelId}
                  tunnel={tunnel}
                  isMine={true}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "discover" && (
          <div className="tunnels-grid">
            {publicTunnels.length === 0 ? (
              <div className="empty-state">
                <Activity size={48} />
                <h3>No Live Tunnels</h3>
                <p>Be the first to go live!</p>
              </div>
            ) : (
              publicTunnels.map((tunnel) => (
                <TunnelCard
                  key={tunnel.tunnelId}
                  tunnel={tunnel}
                  isMine={false}
                />
              ))
            )}
          </div>
        )}
      </div>

      {showConnectionModal && selectedTunnel && (
        <TunnelConnectionModal
          tunnel={selectedTunnel}
          onClose={() => {
            setShowConnectionModal(false);
            setSelectedTunnel(null);
          }}
        />
      )}
    </div>
  );
};

export default LiveTunnels;

