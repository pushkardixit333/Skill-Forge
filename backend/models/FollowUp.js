const mongoose = require("mongoose");

const followUpSchema = new mongoose.Schema(
  {
    traineeId: { type: mongoose.Schema.Types.ObjectId, ref: "Trainee", required: true },
    placementId: { type: mongoose.Schema.Types.ObjectId, ref: "Placement" },
    checkpointDay: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    channel: { type: String, enum: ["automated_ivr", "sms", "whatsapp", "assisted_call"], default: "automated_ivr" },
    status: { type: String, enum: ["pending", "attempted", "completed", "no_response", "escalated_to_agent"], default: "pending" },
    attempts: { type: Number, default: 0 },
    response: {
      currentlyEmployed: Boolean,
      currentWage: Number,
      stillWithSameEmployer: Boolean,
      satisfactionScore: { type: Number, min: 1, max: 5 },
      reasonForNonPlacement: String,
      reasonForAttrition: String,
      freeText: String,
    },
    completedAt: Date,
    handledBy: { type: String, enum: ["system", "call_center_agent"], default: "system" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FollowUp", followUpSchema);
