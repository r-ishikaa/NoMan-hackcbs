import mongoose from "mongoose";

const periodSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    cycleLength: {
      type: Number,
      required: true,
      default: 28,
      min: 21,
      max: 35,
    },
    periodLength: {
      type: Number,
      required: true,
      default: 5,
      min: 2,
      max: 7,
    },
    lastPeriodDate: {
      type: Date,
      required: false,
    },
    flow: {
      type: String,
      enum: ["light", "medium", "heavy"],
      default: "medium",
    },
    // Store the first day of current cycle
    currentCycleStartDate: {
      type: Date,
      required: false,
    },
  },
  { timestamps: true }
);

const Period = mongoose.models.Period || mongoose.model("Period", periodSchema);
export default Period;

