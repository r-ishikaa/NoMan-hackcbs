import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";

dotenv.config();

/**
 * Migration script to convert old roles (student, hr) to new roles (user, creator, enterprise)
 * 
 * Migration mapping:
 * - "student" -> "user" (normal user)
 * - "hr" -> "enterprise" (enterprise account)
 * 
 * This script:
 * 1. Updates all users with old roles to new roles
 * 2. Updates enrollments to use userId field (for backward compatibility)
 * 3. Preserves all existing profile data
 */

const MIGRATION_MAPPING = {
  student: "user",
  hr: "enterprise",
  // admin remains unchanged
};

async function migrateRoles() {
  try {
    console.log("Starting role migration...");

    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/hackomania";
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Migrate user roles
    console.log("\n1. Migrating user roles...");
    const users = await User.find({
      role: { $in: ["student", "hr"] }
    });

    console.log(`Found ${users.length} users to migrate`);

    for (const user of users) {
      const oldRole = user.role;
      const newRole = MIGRATION_MAPPING[oldRole];

      if (newRole) {
        await User.updateOne(
          { _id: user._id },
          { $set: { role: newRole } }
        );
        console.log(`  ✓ Migrated user ${user.username} (${user._id}): ${oldRole} -> ${newRole}`);
      }
    }

    // Migrate enrollments to include userId field
    console.log("\n2. Migrating enrollments...");
    const enrollments = await Enrollment.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });

    console.log(`Found ${enrollments.length} enrollments to migrate`);

    for (const enrollment of enrollments) {
      if (enrollment.studentId && !enrollment.userId) {
        await Enrollment.updateOne(
          { _id: enrollment._id },
          { $set: { userId: enrollment.studentId } }
        );
        console.log(`  ✓ Migrated enrollment ${enrollment._id}: added userId`);
      }
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("\nSummary:");
    console.log(`- Users migrated: ${users.length}`);
    console.log(`- Enrollments migrated: ${enrollments.length}`);

    // Display role statistics
    const roleStats = await User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log("\nCurrent role distribution:");
    roleStats.forEach(stat => {
      console.log(`  - ${stat._id}: ${stat.count} users`);
    });

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB");
  }
}

// Run migration
migrateRoles()
  .then(() => {
    console.log("\n🎉 Migration script completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration script failed:", error);
    process.exit(1);
  });

