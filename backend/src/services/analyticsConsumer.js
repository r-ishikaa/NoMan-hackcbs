import {
  initKafkaConsumer,
  KAFKA_TOPICS,
  EVENT_TYPES,
} from "../config/kafka.js";
import { cacheGet, cacheDel, cacheIncr } from "../config/redis.js";

/**
 * Analytics Consumer Service
 * Processes engagement events and updates real-time analytics
 */
class AnalyticsConsumerService {
  constructor() {
    this.consumer = null;
    this.isRunning = false;
  }

  /**
   * Start the analytics consumer
   */
  async start() {
    if (this.isRunning) {
      console.log("[Analytics Consumer] Already running");
      return;
    }

    try {
      // Initialize consumer
      this.consumer = await initKafkaConsumer("analytics-consumer-group", [
        KAFKA_TOPICS.ENGAGEMENT_EVENTS,
      ]);

      // Start consuming messages
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const event = JSON.parse(message.value.toString());
            console.log(
              `[Analytics Consumer] Processing event: ${event.eventType}`
            );

            // Route event to appropriate handler
            await this.handleEvent(event);
          } catch (error) {
            console.error(
              "[Analytics Consumer] Error processing message:",
              error
            );
          }
        },
      });

      this.isRunning = true;
      console.log("[Analytics Consumer] ✅ Started successfully");
    } catch (error) {
      console.error("[Analytics Consumer] ❌ Failed to start:", error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Handle different event types
   */
  async handleEvent(event) {
    switch (event.eventType) {
      case EVENT_TYPES.POST_LIKED:
      case EVENT_TYPES.REEL_LIKED:
        await this.handleLikeEvent(event);
        break;
      case EVENT_TYPES.COMMENT_CREATED:
        await this.handleCommentEvent(event);
        break;
      case EVENT_TYPES.REEL_VIEWED:
        await this.handleReelViewEvent(event);
        break;
      case EVENT_TYPES.POST_VIEWED:
        await this.handlePostViewEvent(event);
        break;
      default:
        console.log(
          `[Analytics Consumer] Unknown event type: ${event.eventType}`
        );
    }
  }

  /**
   * Handle like events
   */
  async handleLikeEvent(event) {
    const { targetType, targetId, userId } = event;

    try {
      // Increment real-time like counter in Redis
      const cacheKey = `analytics:likes:${targetType}:${targetId}`;
      await cacheIncr(cacheKey);

      // Increment daily like counter
      const today = new Date().toISOString().split("T")[0];
      const dailyKey = `analytics:likes:daily:${today}`;
      await cacheIncr(dailyKey);

      // Track user engagement score
      const userEngagementKey = `analytics:user:${userId}:engagement`;
      await cacheIncr(userEngagementKey);

      console.log(
        `[Analytics Consumer] ✅ Processed like event for ${targetType}:${targetId}`
      );
    } catch (error) {
      console.error(`[Analytics Consumer] Error handling like event:`, error);
    }
  }

  /**
   * Handle comment events
   */
  async handleCommentEvent(event) {
    const { targetType, targetId, userId } = event;

    try {
      // Increment real-time comment counter in Redis
      const cacheKey = `analytics:comments:${targetType}:${targetId}`;
      await cacheIncr(cacheKey);

      // Increment daily comment counter
      const today = new Date().toISOString().split("T")[0];
      const dailyKey = `analytics:comments:daily:${today}`;
      await cacheIncr(dailyKey);

      // Track user engagement score (comments worth more than likes)
      const userEngagementKey = `analytics:user:${userId}:engagement`;
      await cacheIncr(userEngagementKey);
      await cacheIncr(userEngagementKey); // Count twice for comments

      console.log(
        `[Analytics Consumer] ✅ Processed comment event for ${targetType}:${targetId}`
      );
    } catch (error) {
      console.error(
        `[Analytics Consumer] Error handling comment event:`,
        error
      );
    }
  }

  /**
   * Handle reel view events
   */
  async handleReelViewEvent(event) {
    const { reelId, userId, duration, completed } = event;

    try {
      // Increment view counter
      const viewKey = `analytics:views:reel:${reelId}`;
      await cacheIncr(viewKey);

      // Track completion rate
      if (completed) {
        const completionKey = `analytics:completions:reel:${reelId}`;
        await cacheIncr(completionKey);
      }

      // Track daily views
      const today = new Date().toISOString().split("T")[0];
      const dailyKey = `analytics:views:daily:${today}`;
      await cacheIncr(dailyKey);

      // Track average watch time (simplified - store total duration)
      const durationKey = `analytics:duration:reel:${reelId}`;
      await cacheIncr(durationKey);

      console.log(
        `[Analytics Consumer] ✅ Processed reel view event for ${reelId}`
      );
    } catch (error) {
      console.error(
        `[Analytics Consumer] Error handling reel view event:`,
        error
      );
    }
  }

  /**
   * Handle post view events
   */
  async handlePostViewEvent(event) {
    const { postId, userId } = event;

    try {
      // Increment view counter
      const viewKey = `analytics:views:post:${postId}`;
      await cacheIncr(viewKey);

      // Track daily views
      const today = new Date().toISOString().split("T")[0];
      const dailyKey = `analytics:views:daily:${today}`;
      await cacheIncr(dailyKey);

      console.log(
        `[Analytics Consumer] ✅ Processed post view event for ${postId}`
      );
    } catch (error) {
      console.error(
        `[Analytics Consumer] Error handling post view event:`,
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
      console.log("[Analytics Consumer] Stopped");
    }
  }
}

// Export singleton instance
export const analyticsConsumer = new AnalyticsConsumerService();
