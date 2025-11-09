import mongoose from "mongoose";

const liveTunnelSchema = new mongoose.Schema(
  {
    tunnelId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      index: true,
    },
    projectName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    localPort: {
      type: Number,
      required: true,
    },
    remotePort: {
      type: Number,
      required: true,
    },
    publicUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "error", "expired"],
      default: "active",
      index: true,
    },
    // Stats
    stats: {
      viewersCount: {
        type: Number,
        default: 0,
      },
      totalViewers: {
        type: Number,
        default: 0,
      },
      bytesTransferred: {
        type: Number,
        default: 0,
      },
      requestsCount: {
        type: Number,
        default: 0,
      },
      peakViewers: {
        type: Number,
        default: 0,
      },
    },
    // Current viewers
    currentViewers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        username: String,
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Tunnel metadata
    metadata: {
      framework: String, // "react", "vue", "express", "flask", etc.
      language: String, // "javascript", "python", "go", etc.
      category: String, // "web-app", "api", "game", "ai-model", etc.
    },
    // Access control
    isPublic: {
      type: Boolean,
      default: true,
    },
    allowedViewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Tier limits
    tier: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    maxViewers: {
      type: Number,
      default: 10, // Free tier limit
    },
    // Timestamps
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
liveTunnelSchema.index({ username: 1, projectName: 1 });
liveTunnelSchema.index({ status: 1, startedAt: -1 });
liveTunnelSchema.index({ userId: 1, status: 1 });

// Virtual for duration
liveTunnelSchema.virtual("durationSeconds").get(function () {
  const end = this.endedAt || new Date();
  return Math.floor((end - this.startedAt) / 1000);
});

// Method to add viewer
liveTunnelSchema.methods.addViewer = async function (userId, username) {
  // Check if viewer already exists
  const existingViewer = this.currentViewers.find(
    (v) => v.userId && v.userId.toString() === userId.toString()
  );

  if (!existingViewer) {
    this.currentViewers.push({
      userId,
      username,
      joinedAt: new Date(),
    });

    this.stats.viewersCount = this.currentViewers.length;
    this.stats.totalViewers += 1;

    if (this.stats.viewersCount > this.stats.peakViewers) {
      this.stats.peakViewers = this.stats.viewersCount;
    }

    this.lastActivityAt = new Date();
    await this.save();
  }

  return this;
};

// Method to remove viewer
liveTunnelSchema.methods.removeViewer = async function (userId) {
  this.currentViewers = this.currentViewers.filter(
    (v) => v.userId && v.userId.toString() !== userId.toString()
  );

  this.stats.viewersCount = this.currentViewers.length;
  this.lastActivityAt = new Date();
  await this.save();

  return this;
};

// Method to update stats
liveTunnelSchema.methods.updateStats = async function (stats) {
  if (stats.bytesTransferred !== undefined) {
    this.stats.bytesTransferred += stats.bytesTransferred;
  }
  if (stats.requestsCount !== undefined) {
    this.stats.requestsCount += stats.requestsCount;
  }

  this.lastActivityAt = new Date();
  await this.save();

  return this;
};

// Method to end tunnel
liveTunnelSchema.methods.endTunnel = async function () {
  this.status = "inactive";
  this.endedAt = new Date();
  this.currentViewers = [];
  this.stats.viewersCount = 0;
  await this.save();

  return this;
};

// Static method to get active tunnels
liveTunnelSchema.statics.getActiveTunnels = function () {
  return this.find({ status: "active" })
    .populate("userId", "username email profilePicture")
    .sort({ startedAt: -1 });
};

// Static method to get user's active tunnels
liveTunnelSchema.statics.getUserActiveTunnels = function (userId) {
  return this.find({ userId, status: "active" }).sort({ startedAt: -1 });
};

// Static method to find tunnel by username and project
liveTunnelSchema.statics.findByUsernameProject = function (
  username,
  projectName
) {
  return this.findOne({ username, projectName, status: "active" });
};

// Static method to cleanup expired tunnels (older than 8 hours)
liveTunnelSchema.statics.cleanupExpiredTunnels = async function () {
  const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);

  const result = await this.updateMany(
    {
      status: "active",
      startedAt: { $lt: eightHoursAgo },
    },
    {
      $set: {
        status: "expired",
        endedAt: new Date(),
        "stats.viewersCount": 0,
        currentViewers: [],
      },
    }
  );

  return result;
};

const LiveTunnel = mongoose.model("LiveTunnel", liveTunnelSchema);

export default LiveTunnel;
