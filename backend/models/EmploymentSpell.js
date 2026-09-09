const mongoose = require("mongoose");

// One row per wage-check-in, so wage progression and retention duration
// can be reconstructed for any trainee/placement over time.
const employmentSpellSchema = new mongoose.Schema(
  {
    traineeId: { type: mongoose.Schema.Types.ObjectId, ref: "Trainee", required: true },
    placementId: { type: mongoose.Schema.Types.ObjectId, ref: "Placement", required: true },
    checkpointDay: { type: Number, required: true }, // 30, 90, 180, 365...
    recordedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "exited", "unknown"], required: true },
    wage: Number,
    exitReason: {
      type: String,
      enum: [
        "better_opportunity",
        "low_wage",
        "workplace_issue",
        "location_relocation",
        "health_personal",
        "contract_ended",
        "other",
        null,
      ],
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ["self_reported", "employer_confirmed", "govt_database_verified"],
      default: "self_reported",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmploymentSpell", employmentSpellSchema);
