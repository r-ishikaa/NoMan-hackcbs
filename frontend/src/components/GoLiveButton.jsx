import { useState } from "react";
import { Play, Square, Loader2 } from "lucide-react";
import API_CONFIG from "../config/api";

const GoLiveButton = ({ onTunnelCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectName: "",
    localPort: "3000",
    description: "",
    framework: "react",
    language: "javascript",
    category: "web-app",
    isPublic: true,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        API_CONFIG.getApiUrl("/api/tunnels/create"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            localPort: parseInt(formData.localPort),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        onTunnelCreated && onTunnelCreated(data);
        setIsOpen(false);
        setFormData({
          projectName: "",
          localPort: "3000",
          description: "",
          framework: "react",
          language: "javascript",
          category: "web-app",
          isPublic: true,
        });
      } else {
        alert(data.error || "Failed to create tunnel");
      }
    } catch (error) {
      console.error("Error creating tunnel:", error);
      alert("Failed to create tunnel");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="go-live-button"
      >
        <Play size={20} />
        <span>Go Live</span>
      </button>

      {isOpen && (
        <div className="modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚀 Share Your Localhost Live</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="go-live-form">
              <div className="form-group">
                <label>Project Name *</label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) =>
                    setFormData({ ...formData, projectName: e.target.value })
                  }
                  placeholder="my-awesome-project"
                  pattern="[a-zA-Z0-9-_]+"
                  required
                />
                <small>Only letters, numbers, hyphens, and underscores</small>
              </div>

              <div className="form-group">
                <label>Local Port *</label>
                <input
                  type="number"
                  value={formData.localPort}
                  onChange={(e) =>
                    setFormData({ ...formData, localPort: e.target.value })
                  }
                  min="1"
                  max="65535"
                  required
                />
                <small>Port your app is running on (e.g., 3000, 8080)</small>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="What are you building?"
                  rows="3"
                  maxLength="500"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Framework</label>
                  <select
                    value={formData.framework}
                    onChange={(e) =>
                      setFormData({ ...formData, framework: e.target.value })
                    }
                  >
                    <option value="react">React</option>
                    <option value="vue">Vue</option>
                    <option value="angular">Angular</option>
                    <option value="svelte">Svelte</option>
                    <option value="express">Express</option>
                    <option value="flask">Flask</option>
                    <option value="django">Django</option>
                    <option value="nextjs">Next.js</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Language</label>
                  <select
                    value={formData.language}
                    onChange={(e) =>
                      setFormData({ ...formData, language: e.target.value })
                    }
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="typescript">TypeScript</option>
                    <option value="python">Python</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="java">Java</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                >
                  <option value="web-app">Web App</option>
                  <option value="api">API</option>
                  <option value="game">Game</option>
                  <option value="ai-model">AI Model</option>
                  <option value="mobile-app">Mobile App</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="experiment">Experiment</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) =>
                      setFormData({ ...formData, isPublic: e.target.checked })
                    }
                  />
                  <span>Make this tunnel public (anyone can view)</span>
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Play size={20} />
                      <span>Create Tunnel</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default GoLiveButton;

