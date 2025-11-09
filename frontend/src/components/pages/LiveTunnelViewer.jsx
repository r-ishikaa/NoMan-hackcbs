import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Users,
  Activity,
  MessageCircle,
  ThumbsUp,
  Heart,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import API_CONFIG from "../../config/api";
import { io } from "socket.io-client";

const LiveTunnelViewer = () => {
  const { username, projectName } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tunnel, setTunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [viewers, setViewers] = useState([]);
  const [iframeKey, setIframeKey] = useState(0);

  const socketRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    fetchTunnel();
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [username, projectName]);

  const fetchTunnel = async () => {
    try {
      const response = await fetch(
        API_CONFIG.getApiUrl(`/api/tunnels/user/${username}/${projectName}`)
      );
      const data = await response.json();

      if (response.ok) {
        setTunnel(data.tunnel);
        connectToSocket(data.tunnel.tunnelId);
      } else {
        setError(data.error || "Tunnel not found");
      }
    } catch (error) {
      console.error("Error fetching tunnel:", error);
      setError("Failed to load tunnel");
    } finally {
      setLoading(false);
    }
  };

  const connectToSocket = (tunnelId) => {
    const socket = io(`${API_CONFIG.getVRBackendUrl()}/tunnels`, {
      transports: ["websocket", "polling"],
    });

    socket.on("connect", () => {
      console.log("Connected to tunnel socket");
      socket.emit("join-tunnel", {
        tunnelId,
        userId: user?.id,
        username: user?.username || "Anonymous",
      });
    });

    socket.on("tunnel-joined", (data) => {
      console.log("Joined tunnel:", data);
    });

    socket.on("viewer-joined", (data) => {
      console.log("Viewer joined:", data);
      setViewers((prev) => [...prev, data]);
    });

    socket.on("viewer-left", (data) => {
      console.log("Viewer left:", data);
      setViewers((prev) => prev.filter((v) => v.userId !== data.userId));
    });

    socket.on("viewer-comment", (data) => {
      setComments((prev) => [...prev, data]);
    });

    socket.on("viewer-reaction", (data) => {
      // Handle reactions (show floating emoji, etc.)
      console.log("Reaction:", data);
    });

    socket.on("creator-status", (data) => {
      console.log("Creator status:", data);
      // Show status message to viewers
    });

    socket.on("tunnel-closed", (data) => {
      alert(data.message);
      navigate("/live-tunnels");
    });

    socket.on("tunnel-error", (data) => {
      setError(data.error);
    });

    socket.on("error", (data) => {
      console.error("Socket error:", data);
      setError(data.message);
    });

    socketRef.current = socket;
  };

  const handleSendComment = () => {
    if (!newComment.trim() || !socketRef.current) return;

    socketRef.current.emit("viewer-comment", {
      tunnelId: tunnel.tunnelId,
      comment: newComment,
    });

    setNewComment("");
  };

  const handleReaction = (reaction) => {
    if (!socketRef.current) return;

    socketRef.current.emit("viewer-reaction", {
      tunnelId: tunnel.tunnelId,
      reaction,
    });
  };

  const handleRefreshIframe = () => {
    setIframeKey((prev) => prev + 1);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading tunnel...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-state">
          <AlertCircle size={48} />
          <h2>{error}</h2>
          <button onClick={() => navigate("/live-tunnels")} className="btn-primary">
            Back to Tunnels
          </button>
        </div>
      </div>
    );
  }

  if (!tunnel) {
    return null;
  }

  return (
    <div className="live-tunnel-viewer">
      <div className="viewer-header">
        <div className="tunnel-info">
          <div className="live-indicator">
            <span className="live-dot"></span>
            <span>LIVE</span>
          </div>
          <h1>{tunnel.projectName}</h1>
          <span className="creator-name">by {tunnel.username}</span>
        </div>

        <div className="viewer-stats">
          <div className="stat">
            <Users size={20} />
            <span>{tunnel.stats?.viewersCount || 0}</span>
          </div>
          <button
            onClick={handleRefreshIframe}
            className="btn-secondary"
            title="Refresh"
          >
            🔄
          </button>
          <button
            onClick={() => window.open(tunnel.publicUrl, "_blank")}
            className="btn-secondary"
            title="Open in new tab"
          >
            <ExternalLink size={20} />
          </button>
        </div>
      </div>

      <div className="viewer-content">
        <div className="iframe-container">
          <iframe
            key={iframeKey}
            ref={iframeRef}
            src={tunnel.publicUrl}
            title={tunnel.projectName}
            className="tunnel-iframe"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          />
        </div>

        <div className="viewer-sidebar">
          <div className="sidebar-section">
            <h3>About</h3>
            {tunnel.description ? (
              <p>{tunnel.description}</p>
            ) : (
              <p className="text-muted">No description</p>
            )}

            <div className="tunnel-meta">
              {tunnel.metadata?.framework && (
                <span className="badge">{tunnel.metadata.framework}</span>
              )}
              {tunnel.metadata?.language && (
                <span className="badge">{tunnel.metadata.language}</span>
              )}
              {tunnel.metadata?.category && (
                <span className="badge">{tunnel.metadata.category}</span>
              )}
            </div>
          </div>

          <div className="sidebar-section reactions">
            <h3>React</h3>
            <div className="reaction-buttons">
              <button onClick={() => handleReaction("👍")}>👍</button>
              <button onClick={() => handleReaction("❤️")}>❤️</button>
              <button onClick={() => handleReaction("🔥")}>🔥</button>
              <button onClick={() => handleReaction("🎉")}>🎉</button>
              <button onClick={() => handleReaction("🚀")}>🚀</button>
            </div>
          </div>

          <div className="sidebar-section comments">
            <h3>
              <MessageCircle size={16} />
              Chat ({comments.length})
            </h3>

            <div className="comments-list">
              {comments.length === 0 ? (
                <p className="text-muted">No comments yet</p>
              ) : (
                comments.map((comment, index) => (
                  <div key={index} className="comment">
                    <strong>{comment.username}:</strong>
                    <span>{comment.comment}</span>
                  </div>
                ))
              )}
            </div>

            <div className="comment-input">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendComment()}
                placeholder="Type a comment..."
              />
              <button onClick={handleSendComment} className="btn-primary">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTunnelViewer;

