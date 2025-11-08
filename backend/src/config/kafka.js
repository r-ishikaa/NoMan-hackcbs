import { Kafka, logLevel } from "kafkajs";

// Kafka configuration
const kafkaConfig = {
  clientId: "hexagon-backend",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  retry: {
    initialRetryTime: 100,
    retries: 8,
    maxRetryTime: 30000,
  },
  logLevel:
    process.env.NODE_ENV === "production" ? logLevel.ERROR : logLevel.INFO,
};

// Create Kafka instance
const kafka = new Kafka(kafkaConfig);

// Create producer instance
let producer = null;
let producerConnected = false;

// Create consumer instances (we'll have multiple consumers for different topics)
const consumers = new Map();

/**
 * Initialize Kafka producer
 */
export async function initKafkaProducer() {
  if (producerConnected) {
    console.log("[Kafka Producer] Already connected.");
    return producer;
  }

  try {
    console.log("[Kafka Producer] Connecting...");
    producer = kafka.producer({
      allowAutoTopicCreation: true,
      transactionTimeout: 30000,
    });

    await producer.connect();
    producerConnected = true;
    console.log("[Kafka Producer] ✅ Connected successfully");

    // Handle producer errors
    producer.on("producer.disconnect", () => {
      console.log("[Kafka Producer] Disconnected");
      producerConnected = false;
    });

    producer.on("producer.network.request_timeout", (payload) => {
      console.error("[Kafka Producer] Request timeout:", payload);
    });

    return producer;
  } catch (error) {
    console.error("[Kafka Producer] ❌ Connection failed:", error.message);
    producerConnected = false;
    producer = null;
    throw error;
  }
}

/**
 * Initialize Kafka consumer for a specific group
 */
export async function initKafkaConsumer(groupId, topics) {
  if (consumers.has(groupId)) {
    console.log(`[Kafka Consumer:${groupId}] Already exists.`);
    return consumers.get(groupId);
  }

  try {
    console.log(
      `[Kafka Consumer:${groupId}] Creating consumer for topics:`,
      topics
    );
    const consumer = kafka.consumer({
      groupId,
      sessionTimeout: 30000,
      heartbeatInterval: 3000,
      maxWaitTimeInMs: 100,
    });

    await consumer.connect();
    console.log(`[Kafka Consumer:${groupId}] ✅ Connected`);

    // Subscribe to topics
    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
      console.log(`[Kafka Consumer:${groupId}] Subscribed to topic: ${topic}`);
    }

    consumers.set(groupId, consumer);
    return consumer;
  } catch (error) {
    console.error(
      `[Kafka Consumer:${groupId}] ❌ Connection failed:`,
      error.message
    );
    throw error;
  }
}

/**
 * Send event to Kafka topic
 */
export async function publishEvent(topic, event) {
  if (!producerConnected || !producer) {
    console.warn(
      `[Kafka] Producer not connected. Event not published to ${topic}:`,
      event.eventType
    );
    return false;
  }

  try {
    const message = {
      key: event.userId || event.accountId || String(Date.now()),
      value: JSON.stringify(event),
      timestamp: String(Date.now()),
    };

    await producer.send({
      topic,
      messages: [message],
      compression: 1, // GZIP compression
    });

    console.log(`[Kafka] ✅ Published event to ${topic}:`, event.eventType);
    return true;
  } catch (error) {
    console.error(
      `[Kafka] ❌ Failed to publish event to ${topic}:`,
      error.message
    );
    return false;
  }
}

/**
 * Batch publish multiple events
 */
export async function publishEventBatch(topic, events) {
  if (!producerConnected || !producer) {
    console.warn(
      `[Kafka] Producer not connected. Batch not published to ${topic}`
    );
    return false;
  }

  try {
    const messages = events.map((event) => ({
      key: event.userId || event.accountId || String(Date.now()),
      value: JSON.stringify(event),
      timestamp: String(Date.now()),
    }));

    await producer.send({
      topic,
      messages,
      compression: 1,
    });

    console.log(`[Kafka] ✅ Published ${events.length} events to ${topic}`);
    return true;
  } catch (error) {
    console.error(
      `[Kafka] ❌ Failed to publish batch to ${topic}:`,
      error.message
    );
    return false;
  }
}

/**
 * Close Kafka producer
 */
export async function closeKafkaProducer() {
  if (producer && producerConnected) {
    console.log("[Kafka Producer] Closing connection...");
    await producer.disconnect();
    producerConnected = false;
    producer = null;
    console.log("[Kafka Producer] Connection closed.");
  }
}

/**
 * Close all Kafka consumers
 */
export async function closeKafkaConsumers() {
  console.log("[Kafka Consumers] Closing all consumers...");
  for (const [groupId, consumer] of consumers.entries()) {
    try {
      await consumer.disconnect();
      console.log(`[Kafka Consumer:${groupId}] Disconnected`);
    } catch (error) {
      console.error(
        `[Kafka Consumer:${groupId}] Error disconnecting:`,
        error.message
      );
    }
  }
  consumers.clear();
  console.log("[Kafka Consumers] All consumers closed.");
}

/**
 * Close all Kafka connections
 */
export async function closeKafka() {
  await closeKafkaProducer();
  await closeKafkaConsumers();
}

// Kafka topic names (centralized configuration)
export const KAFKA_TOPICS = {
  USER_EVENTS: "user-events", // Posts, reels, follows
  ENGAGEMENT_EVENTS: "engagement-events", // Likes, comments, views
  CACHE_INVALIDATION: "cache-invalidation", // Cache invalidation events
  NOTIFICATION_EVENTS: "notification-events", // Notification delivery events
  ANALYTICS_EVENTS: "analytics-events", // Analytics tracking
};

// Event types
export const EVENT_TYPES = {
  // User content events
  POST_CREATED: "POST_CREATED",
  POST_UPDATED: "POST_UPDATED",
  POST_DELETED: "POST_DELETED",
  REEL_UPLOADED: "REEL_UPLOADED",
  REEL_DELETED: "REEL_DELETED",

  // Social events
  USER_FOLLOWED: "USER_FOLLOWED",
  USER_UNFOLLOWED: "USER_UNFOLLOWED",

  // Engagement events
  POST_LIKED: "POST_LIKED",
  POST_UNLIKED: "POST_UNLIKED",
  REEL_LIKED: "REEL_LIKED",
  REEL_UNLIKED: "REEL_UNLIKED",
  COMMENT_CREATED: "COMMENT_CREATED",
  COMMENT_DELETED: "COMMENT_DELETED",
  REEL_VIEWED: "REEL_VIEWED",
  POST_VIEWED: "POST_VIEWED",

  // Cache events
  CACHE_INVALIDATE: "CACHE_INVALIDATE",

  // Payment events
  PAYMENT_COMPLETED: "PAYMENT_COMPLETED",
};

export default kafka;
