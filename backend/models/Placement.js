const mongoose = require("mongoose");

const placementSchema = new mongoose.Schema(
  {
    traineeId: { type: mongoose.Schema.Types.ObjectId, ref: "Trainee", required: true },
    outcomeType: {
      type: String,
      enum: ["wage_employment", "self_employment", "apprenticeship", "not_placed"],
      required: true,
    },

    // --- wage employment / apprenticeship fields ---
    employerId: { type: mongoose.Schema.Types.ObjectId, ref: "Employer" },
    role: String,
    placementDate: Date,
    initialWage: Number,
    isApprenticeship: { type: Boolean, default: false },
    apprenticeshipStipend: Number,
    apprenticeshipConverted: { type: Boolean, default: false }, // converted to full-time?

    // --- self-employment fields ---
    businessType: String,
    udyamRegistered: { type: Boolean, default: false },
    monthlyIncomeBand: {
      type: String,
      enum: ["below_5k", "5k_10k", "10k_20k", "20k_40k", "above_40k"],
    },
    schemeAvailed: [{ type: String }], // e.g. PMEGP, Mudra

    // --- non-placement fields ---
    nonPlacementReason: {
      type: String,
      enum: [
        "skill_mismatch",
        "low_wage_expectations",
        "location_constraint",
        "personal_family_reason",
        "further_studies",
        "health_reason",
        "no_local_demand",
        "other",
      ],
    },

    source: { type: String, enum: ["campus_placement", "self_effort", "provider_referral", "govt_scheme"], default: "campus_placement" },
    verificationStatus: {
      type: String,
      enum: ["self_reported", "employer_confirmed", "govt_database_verified"],
      default: "self_reported",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Placement", placementSchema);
