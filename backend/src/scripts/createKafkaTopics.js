import { Kafka } from "kafkajs";
import { KAFKA_TOPICS } from "../config/kafka.js";

const kafka = new Kafka({
  clientId: "hexagon-admin",
  brokers: ["localhost:9092"],
});

const admin = kafka.admin();

async function createTopics() {
  try {
    console.log("🚀 Connecting to Kafka...");
    await admin.connect();
    console.log("✅ Connected to Kafka");

    const topics = Object.values(KAFKA_TOPICS).map((topic) => ({
      topic,
      numPartitions: 3,
      replicationFactor: 1,
    }));

    console.log("📝 Creating topics:", topics.map((t) => t.topic));

    await admin.createTopics({
      topics,
      waitForLeaders: true,
    });

    console.log("✅ Topics created successfully!");

    // List all topics
    const allTopics = await admin.listTopics();
    console.log("📋 All topics:", allTopics);

    await admin.disconnect();
    console.log("✅ Disconnected from Kafka");
  } catch (error) {
    if (error.message.includes("already exists")) {
      console.log("✅ Topics already exist");
    } else {
      console.error("❌ Error creating topics:", error);
    }
    await admin.disconnect();
  }
}

createTopics();

