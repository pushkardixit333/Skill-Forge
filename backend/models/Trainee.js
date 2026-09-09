const mongoose = require("mongoose");

// A single consent grant/revocation event - kept as an append-only ledger
// so the system always has an auditable history of what was agreed to.
const consentEventSchema = new mongoose.Schema(
  {
    action: { type: String, enum: ["granted", "revoked"], required: true },
    scope: [
      {
        type: String,
        enum: [
          "share_with_government",
          "share_with_employer",
          "share_with_researcher",
          "followup_contact",
          "wage_verification",
        ],
      },
    ],
    recordedAt: { type: Date, default: Date.now },
    channel: { type: String, enum: ["app", "portal", "field_agent", "sms_reply"], default: "portal" },
  },
  { _id: false }
);

const traineeSchema = new mongoose.Schema(
  {
    traineeCode: { type: String, required: true, unique: true, trim: true }, // human-facing unique ID
    name: { type: String, required: true, trim: true },
    dob: Date,
    gender: { type: String, enum: ["male", "female", "transgender", "prefer_not_to_say"] },
    category: { type: String, enum: ["general", "obc", "sc", "st", "ews", "other"] },
    phone: { type: String, required: true },
    alternatePhone: String,
    address: {
      state: { type: String, required: true },
      district: { type: String, required: true },
      block: String,
      pincode: String,
      areaType: { type: String, enum: ["rural", "urban"] },
    },
    aadhaarLinked: { type: Boolean, default: false }, // presence of linkage, never store the number itself
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider", required: true },
    batchId: { type: String },
    enrollmentDate: { type: Date, required: true },
    completionStatus: {
      type: String,
      enum: ["enrolled", "in_progress", "completed", "dropped_out"],
      default: "enrolled",
    },
    dropoutReason: String,
    certificationDate: Date,
    baselineSkillLevel: { type: String, enum: ["beginner", "intermediate", "advanced"] },
    consentLedger: [consentEventSchema],
  },
  { timestamps: true }
);

// Convenience virtual: is consent currently active for a given scope
traineeSchema.methods.hasActiveConsent = function (scope) {
  const relevant = this.consentLedger.filter((c) => c.scope.includes(scope));
  if (relevant.length === 0) return false;
  const latest = relevant.sort((a, b) => b.recordedAt - a.recordedAt)[0];
  return latest.action === "granted";
};

module.exports = mongoose.model("Trainee", traineeSchema);
