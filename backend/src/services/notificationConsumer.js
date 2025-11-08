import {
  initKafkaConsumer,
  KAFKA_TOPICS,
  EVENT_TYPES,
} from "../config/kafka.js";
import Follow from "../models/Follow.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { broadcastNotification } from "../utils/notificationBroadcaster.js";
import { sendPushNotification } from "../routes/push.js";
import { cacheDel } from "../config/redis.js";

/**
 * Notification Consumer Service
 * Processes user events and sends notifications asynchronously
 */
class NotificationConsumerService {
  constructor() {
    this.consumer = null;
    this.isRunning = false;
  }

  /**
   * Start the notification consumer
   */
  async start() {
    if (this.isRunning) {
      console.log("[Notification Consumer] Already running");
      return;
    }

    try {
      // Initialize consumer
      this.consumer = await initKafkaConsumer("notification-consumer-group", [
        KAFKA_TOPICS.USER_EVENTS,
      ]);

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const event = JSON.parse(message.value.toString());
            console.log(
              `[Notification Consumer] Processing event: ${event.eventType}`
            );

            // Route event to appropriate handler
            await this.handleEvent(event);
          } catch (error) {
            console.error(
              "[Notification Consumer] Error processing message:",
              error
            );
            // Don't throw - we don't want to stop the consumer
          }
        },
      });

      this.isRunning = true;
      console.log("[Notification Consumer] ✅ Started successfully");
    } catch (error) {
      console.error("[Notification Consumer] ❌ Failed to start:", error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Handle different event types
   */
  async handleEvent(event) {
    switch (event.eventType) {
      case EVENT_TYPES.POST_CREATED:
        await this.handlePostCreated(event);
        break;
      case EVENT_TYPES.REEL_UPLOADED:
        await this.handleReelUploaded(event);
        break;
      case EVENT_TYPES.USER_FOLLOWED:
        await this.handleUserFollowed(event);
        break;
      default:
        console.log(
          `[Notification Consumer] Unknown event type: ${event.eventType}`
        );
    }
  }

  /**
   * Handle POST_CREATED event
   */
  async handlePostCreated(event) {
    const { userId, postId, username, isAnonymous } = event;

    // Don't send notifications for anonymous posts
    if (isAnonymous) {
      console.log(
        `[Notification Consumer] Skipping notifications for anonymous post ${postId}`
      );
      return;
    }

    try {
      // Get all followers
      const followers = await Follow.find({ followingId: userId }).select(
        "followerId"
      );
      console.log(
        `[Notification Consumer] Found ${followers.length} followers for user ${userId}`
      );

      if (followers.length === 0) {
        return;
      }

      // Create bulk notifications
      const notificationData = followers.map((f) => ({
        recipientId: String(f.followerId),
        type: "new_post",
        message: `${username} posted something new.`,
        relatedUserId: userId,
        relatedUsername: username,
        relatedPostId: postId,
        relatedReelId: "",
      }));

      // Insert notifications in bulk
      const notifications = await Notification.insertMany(notificationData, {
        ordered: false,
      });
      console.log(
        `[Notification Consumer] Created ${notifications.length} notifications`
      );

      // Send WebSocket and push notifications
      await Promise.all(
        followers.map(async (follower, index) => {
          const followerId = String(follower.followerId);
          const notification = notifications[index];

          if (!notification) {
            console.warn(
              `[Notification Consumer] No notification for follower ${followerId}`
            );
            return;
          }

          // Send via WebSocket
          try {
            const notificationObj = notification.toObject
              ? notification.toObject()
              : notification;
            broadcastNotification(followerId, notificationObj);
          } catch (wsError) {
            console.error(
              `[Notification Consumer] WebSocket error for ${followerId}:`,
              wsError
            );
          }

          // Send push notification
          try {
            await sendPushNotification(followerId, {
              title: "New Post",
              body: `${username} posted something new.`,
              icon: "/favicon.ico",
              badge: "/favicon.ico",
              data: {
                url: `/profile`,
                postId: postId,
              },
            });
          } catch (pushError) {
            console.error(
              `[Notification Consumer] Push error for ${followerId}:`,
              pushError
            );
          }
        })
      );

      // Invalidate cache for all followers
      await Promise.all(
        followers.map(async (follower) => {
          const followerId = String(follower.followerId);
          await cacheDel(`posts:following:${followerId}`);
          await cacheDel(`posts:recommended:${followerId}:20`);
        })
      );

      console.log(
        `[Notification Consumer] ✅ Processed POST_CREATED event for post ${postId}`
      );
    } catch (error) {
      console.error(
        `[Notification Consumer] Error handling POST_CREATED:`,
        error
      );
    }
  }

  /**
   * Handle REEL_UPLOADED event
   */
  async handleReelUploaded(event) {
    const { userId, reelId, username } = event;

    try {
      // Get all followers
      const followers = await Follow.find({ followingId: userId }).select(
        "followerId"
      );
      console.log(
        `[Notification Consumer] Found ${followers.length} followers for user ${userId}`
      );

      if (followers.length === 0) {
        return;
      }

      // Create bulk notifications
      const notificationData = followers.map((f) => ({
        recipientId: String(f.followerId),
        type: "new_reel",
        message: `${username} uploaded a new reel.`,
        relatedUserId: userId,
        relatedUsername: username,
        relatedReelId: reelId,
        relatedPostId: "",
      }));

      // Insert notifications in bulk
      const notifications = await Notification.insertMany(notificationData, {
        ordered: false,
      });
      console.log(
        `[Notification Consumer] Created ${notifications.length} notifications`
      );

      // Send WebSocket and push notifications
      await Promise.all(
        followers.map(async (follower, index) => {
          const followerId = String(follower.followerId);
          const notification = notifications[index];

          if (!notification) {
            return;
          }

          // Send via WebSocket
          try {
            const notificationObj = notification.toObject
              ? notification.toObject()
              : notification;
            broadcastNotification(followerId, notificationObj);
          } catch (wsError) {
            console.error(
              `[Notification Consumer] WebSocket error for ${followerId}:`,
              wsError
            );
          }

          // Send push notification
          try {
            await sendPushNotification(followerId, {
              title: "New Reel",
              body: `${username} uploaded a new reel.`,
              icon: "/favicon.ico",
              badge: "/favicon.ico",
              data: {
                url: `/reels`,
                reelId: reelId,
              },
            });
          } catch (pushError) {
            console.error(
              `[Notification Consumer] Push error for ${followerId}:`,
              pushError
            );
          }
        })
      );

      console.log(
        `[Notification Consumer] ✅ Processed REEL_UPLOADED event for reel ${reelId}`
      );
    } catch (error) {
      console.error(
        `[Notification Consumer] Error handling REEL_UPLOADED:`,
        error
      );
    }
  }

  /**
   * Handle USER_FOLLOWED event
   */
  async handleUserFollowed(event) {
    const { followerId, followingId, username } = event;

    try {
      // Create notification
      const notification = await Notification.create({
        recipientId: followingId,
        type: "follow",
        message: `${username} started following you.`,
        relatedUserId: followerId,
        relatedUsername: username,
        relatedPostId: "",
        relatedReelId: "",
      });

      console.log(
        `[Notification Consumer] Created follow notification: ${notification._id}`
      );

      // Send via WebSocket
      try {
        const notificationObj = notification.toObject
          ? notification.toObject()
          : notification;
        broadcastNotification(followingId, notificationObj);
      } catch (wsError) {
        console.error(`[Notification Consumer] WebSocket error:`, wsError);
      }

      // Send push notification
      try {
        await sendPushNotification(followingId, {
          title: "New Follower",
          body: `${username} started following you.`,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
          data: {
            url: `/profile/${followerId}`,
            userId: followerId,
          },
        });
      } catch (pushError) {
        console.error(`[Notification Consumer] Push error:`, pushError);
      }

      // Invalidate cache
      await cacheDel(`follow:stats:${followingId}`);
      await cacheDel(`follow:stats:${followerId}`);

      console.log(`[Notification Consumer] ✅ Processed USER_FOLLOWED event`);
    } catch (error) {
      console.error(
        `[Notification Consumer] Error handling USER_FOLLOWED:`,
        error
      );
    }
  }

  /**
   * Stop the consumer
   */
  async stop() {
    if (this.consumer) {
      await this.consumer.disconnect();
      this.isRunning = false;
      console.log("[Notification Consumer] Stopped");
    }
  }
}

// Export singleton instance
export const notificationConsumer = new NotificationConsumerService();
