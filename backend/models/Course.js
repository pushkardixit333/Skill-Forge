const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    sector: { type: String, required: true }, // e.g. IT-ITeS, Healthcare, Retail
    durationWeeks: { type: Number, required: true },
    curriculumSkills: [{ type: String }], // skills the course claims to teach
    providerId: { type: mongoose.Schema.Types.ObjectId, ref: "Provider" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
