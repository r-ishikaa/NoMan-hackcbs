import express from "express";
import webpush from "web-push";
import PushSubscription from "../models/PushSubscription.js";
import { authenticateToken } from "../middleware/auth.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Initialize web-push with VAPID keys from environment
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || "mailto:admin@example.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
} else {
  console.warn("⚠️  VAPID keys not set. Web push notifications will not work.");
  console.warn("   Generate keys with: npx web-push generate-vapid-keys");
}

// GET /push/public-key - Get VAPID public key for client subscription
router.get("/public-key", (req, res) => {
  if (!vapidPublicKey) {
    return res.status(503).json({ error: "Push notifications not configured" });
  }
  res.json({ publicKey: vapidPublicKey });
});

// POST /push/subscribe - Subscribe user to push notifications
router.post("/subscribe", authenticateToken, async (req, res) => {
  try {
    const userId = String(req.user._id);
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return res.status(400).json({ error: "Invalid subscription data" });
    }

    // Upsert subscription
    await PushSubscription.findOneAndUpdate(
      { userId, endpoint },
      {
        userId,
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      },
      { upsert: true, new: true }
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("push subscribe error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /push/unsubscribe - Unsubscribe user from push notifications
router.post("/unsubscribe", authenticateToken, async (req, res) => {
  try {
    const userId = String(req.user._id);
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: "Endpoint required" });
    }

    await PushSubscription.deleteOne({ userId, endpoint });
    res.json({ ok: true });
  } catch (err) {
    console.error("push unsubscribe error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Helper function to send push notification (can be imported by other routes)
export const sendPushNotification = async (userId, payload) => {
  try {
    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn(
        `[Push Notification] VAPID keys not configured, skipping push notification for user ${userId}`
      );
      return { sent: false, reason: "VAPID keys not configured" };
    }

    const subscriptions = await PushSubscription.find({ userId });

    if (subscriptions.length === 0) {
      console.log(
        `[Push Notification] No subscriptions found for user ${userId}`
      );
      return { sent: false, reason: "No subscriptions found" };
    }

    console.log(
      `[Push Notification] Sending to ${subscriptions.length} subscription(s) for user ${userId}`
    );

    const results = [];
    const promises = subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          JSON.stringify(payload)
        );
        console.log(
          `[Push Notification] Successfully sent to subscription ${sub._id} for user ${userId}`
        );
        results.push({ success: true, subscriptionId: sub._id });
      } catch (err) {
        // If subscription is invalid, remove it
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(
            `[Push Notification] Removing invalid subscription ${sub._id} for user ${userId}`
          );
          await PushSubscription.deleteOne({ _id: sub._id });
          results.push({
            success: false,
            subscriptionId: sub._id,
            error: "Invalid subscription removed",
          });
        } else {
          console.error(
            `[Push Notification] Error sending to subscription ${sub._id}:`,
            err.message
          );
          results.push({
            success: false,
            subscriptionId: sub._id,
            error: err.message,
          });
        }
      }
    });

    await Promise.allSettled(promises);

    const successCount = results.filter((r) => r.success).length;
    console.log(
      `[Push Notification] Sent ${successCount}/${subscriptions.length} notifications for user ${userId}`
    );

    return {
      sent: successCount > 0,
      successCount,
      totalCount: subscriptions.length,
      results,
    };
  } catch (err) {
    console.error(`[Push Notification] Error for user ${userId}:`, err);
    return { sent: false, error: err.message };
  }
};

export default router;
