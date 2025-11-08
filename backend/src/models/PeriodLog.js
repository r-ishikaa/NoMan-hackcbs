import mongoose from "mongoose";

const periodLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: Date,
      required: true,
      index: true,
    },
    hasPeriod: {
      type: Boolean,
      required: true,
      default: false,
    },
    periodDay: {
      type: Number,
      required: false,
      min: 1,
      max: 7,
    },
    flow: {
      type: String,
      enum: ["light", "medium", "heavy"],
      required: false,
    },
    mood: {
      type: String,
      required: false,
    },
    symptoms: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

// Compound index to ensure one log per user per date
periodLogSchema.index({ userId: 1, date: 1 }, { unique: true });

const PeriodLog = mongoose.models.PeriodLog || mongoose.model("PeriodLog", periodLogSchema);
export default PeriodLog;

