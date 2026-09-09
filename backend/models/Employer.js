const mongoose = require("mongoose");

const employerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sector: String,
    gstin: { type: String, trim: true },
    udyamNumber: { type: String, trim: true },
    contactPhone: String,
    contactEmail: String,
    address: {
      state: String,
      district: String,
    },
    verificationStatus: {
      type: String,
      enum: ["unverified", "self_declared", "document_verified", "govt_database_verified"],
      default: "unverified",
    },
    verificationNotes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employer", employerSchema);
