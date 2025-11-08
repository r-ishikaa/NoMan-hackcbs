import mongoose from "mongoose";

const EnrollmentSchema = new mongoose.Schema(
  {
    // Keep studentId for backward compatibility
    studentId: { type: String, index: true },
    // New userId field (primary for new enrollments)
    userId: { type: String, index: true },
    courseId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["enrolled", "completed", "dropped"],
      default: "enrolled",
    },
  },
  { timestamps: true }
);

// Ensure at least one of userId or studentId is present
EnrollmentSchema.pre("validate", function (next) {
  if (!this.userId && !this.studentId) {
    this.invalidate("userId", "Either userId or studentId is required");
  }
  // If userId is provided but studentId is not, copy userId to studentId for compatibility
  if (this.userId && !this.studentId) {
    this.studentId = this.userId;
  }
  // If studentId is provided but userId is not, copy studentId to userId
  if (this.studentId && !this.userId) {
    this.userId = this.studentId;
  }
  next();
});

// Indexes for both fields
EnrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
EnrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true, sparse: true });

const Enrollment =
  mongoose.models.Enrollment || mongoose.model("Enrollment", EnrollmentSchema);
export default Enrollment;
