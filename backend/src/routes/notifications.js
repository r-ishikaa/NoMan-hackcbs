import express from "express";
import Notification from "../models/Notification.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// GET /notifications - fetch current user's notifications (with userId query param or from token)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.query.userId || String(req.user._id);

    // Security check: users can only fetch their own notifications
    if (userId !== String(req.user._id)) {
      return res
        .status(403)
        .json({ error: "Forbidden: Cannot access other users' notifications" });
    }

    const notifications = await Notification.find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ notifications, count: notifications.length });
  } catch (err) {
    console.error("notifications GET error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /notifications/me - fetch current user's notifications (legacy endpoint)
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const list = await Notification.find({ recipientId: String(req.user._id) })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(list);
  } catch (err) {
    console.error("notifications GET error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /notifications/:id/read - mark as read
router.put("/:id/read", authenticateToken, async (req, res) => {
  try {
    const id = String(req.params.id);
    const n = await Notification.findById(id);
    if (!n || String(n.recipientId) !== String(req.user._id)) {
      return res.status(404).json({ error: "Notification not found" });
    }
    n.read = true; // Changed from isRead to read to match frontend
    await n.save();
    res.json({ ok: true, notification: n });
  } catch (err) {
    console.error("notifications PUT error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PUT /notifications/read-all - mark all as read
router.put("/read-all", authenticateToken, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: String(req.user._id), read: false },
      { $set: { read: true } }
    );

    res.json({
      ok: true,
      modifiedCount: result.modifiedCount,
      message: `Marked ${result.modifiedCount} notifications as read`,
    });
  } catch (err) {
    console.error("notifications mark all read error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /notifications/:id - delete a notification
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const id = String(req.params.id);
    const n = await Notification.findById(id);

    if (!n || String(n.recipientId) !== String(req.user._id)) {
      return res.status(404).json({ error: "Notification not found" });
    }

    await Notification.findByIdAndDelete(id);
    res.json({ ok: true, message: "Notification deleted" });
  } catch (err) {
    console.error("notifications DELETE error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
