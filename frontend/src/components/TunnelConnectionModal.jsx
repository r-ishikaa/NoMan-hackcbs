import { useState } from "react";
import { Copy, Check, Terminal, ExternalLink } from "lucide-react";

const TunnelConnectionModal = ({ tunnel, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setCopiedField(field);
    setTimeout(() => {
      setCopied(false);
      setCopiedField(null);
    }, 2000);
  };

  const { connection } = tunnel;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content tunnel-connection-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>🎉 Tunnel Created Successfully!</h2>
          <button onClick={onClose} className="modal-close">
            ×
          </button>
        </div>

        <div className="tunnel-connection-content">
          <div className="success-message">
            <p>
              Your tunnel is ready! Follow these steps to start sharing your
              localhost:
            </p>
          </div>

          <div className="connection-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Open a Terminal</h3>
                <p>Open a new terminal window on your machine</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Run the SSH Command</h3>
                <div className="code-block">
                  <code>{connection.sshCommand}</code>
                  <button
                    onClick={() =>
                      copyToClipboard(connection.sshCommand, "command")
                    }
                    className="copy-btn"
                  >
                    {copiedField === "command" ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>Enter Password</h3>
                <p>When prompted, paste this password:</p>
                <div className="code-block">
                  <code>{connection.sshPassword}</code>
                  <button
                    onClick={() =>
                      copyToClipboard(connection.sshPassword, "password")
                    }
                    className="copy-btn"
                  >
                    {copiedField === "password" ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Keep Terminal Open</h3>
                <p>
                  Keep the terminal running while you want to share your
                  project
                </p>
              </div>
            </div>
          </div>

          <div className="connection-details">
            <h3>Connection Details</h3>
            <div className="detail-row">
              <span className="detail-label">SSH Host:</span>
              <span className="detail-value">{connection.sshHost}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">SSH Port:</span>
              <span className="detail-value">{connection.sshPort}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Local Port:</span>
              <span className="detail-value">{connection.localPort}</span>
            </div>
          </div>

          <div className="tunnel-info">
            <h3>📡 Your Tunnel</h3>
            <p>
              Once connected, your project will be accessible at:
              <br />
              <strong>
                {tunnel.tunnel?.publicUrl || "Waiting for connection..."}
              </strong>
            </p>
            {tunnel.tunnel?.publicUrl && (
              <button
                onClick={() => window.open(tunnel.tunnel.publicUrl, "_blank")}
                className="btn-primary"
              >
                <ExternalLink size={16} />
                <span>Open Public URL</span>
              </button>
            )}
          </div>

          <div className="important-notes">
            <h4>⚠️ Important Notes:</h4>
            <ul>
              <li>Make sure your local app is running on port {connection.localPort}</li>
              <li>Keep the SSH connection alive while sharing</li>
              <li>
                Free tier: {tunnel.tunnel?.maxViewers || 10} concurrent viewers
              </li>
              <li>Tunnel will auto-close after 8 hours</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn-primary">
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default TunnelConnectionModal;

