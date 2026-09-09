const mongoose = require("mongoose");

const providerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ["training_center", "ngo", "polytechnic", "iti", "other"], default: "training_center" },
    state: { type: String, required: true },
    district: { type: String, required: true },
    accreditationStatus: { type: String, enum: ["accredited", "provisional", "suspended", "not_accredited"], default: "provisional" },
    contactEmail: String,
    contactPhone: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Provider", providerSchema);
