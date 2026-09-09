const FollowUp = require("../models/FollowUp");
const EmploymentSpell = require("../models/EmploymentSpell");
const asyncHandler = require("../middleware/asyncHandler");

// @desc  List follow-ups, optionally filtered by status or "due" (dueDate <= now, still pending)
const getFollowUps = asyncHandler(async (req, res) => {
  const { status, due, traineeId } = req.query;
  const filter = {};
  if (traineeId) filter.traineeId = traineeId;

  if (due === "true") {
    filter.status = { $in: ["pending", "attempted"] };
    filter.dueDate = { $lte: new Date() };
  } else if (status) {
    filter.status = status;
  }

  const followUps = await FollowUp.find(filter)
    .populate("traineeId", "name traineeCode phone address")
    .populate("placementId", "outcomeType employerId")
    .sort({ dueDate: 1 });
  res.json(followUps);
});

// @desc  Simulates the automated engine attempting a follow-up (IVR/SMS/WhatsApp).
// In production this would call the telephony/messaging provider's API.
const attemptFollowUp = asyncHandler(async (req, res) => {
  const followUp = await FollowUp.findById(req.params.id);
  if (!followUp) {
    res.status(404);
    throw new Error("Follow-up not found");
  }
  followUp.attempts += 1;
  // After 3 unanswered automated attempts, escalate to an assisted (human) call
  followUp.status = followUp.attempts >= 3 ? "escalated_to_agent" : "attempted";
  await followUp.save();
  res.json(followUp);
});

// @desc  Log a completed follow-up response (from automated capture or an
// assisted call-center agent) and derive an EmploymentSpell checkpoint from it.
const completeFollowUp = asyncHandler(async (req, res) => {
  const { response, handledBy } = req.body;
  const followUp = await FollowUp.findById(req.params.id);
  if (!followUp) {
    res.status(404);
    throw new Error("Follow-up not found");
  }

  followUp.response = response;
  followUp.status = "completed";
  followUp.completedAt = new Date();
  followUp.handledBy = handledBy || "system";
  await followUp.save();

  if (followUp.placementId) {
    await EmploymentSpell.create({
      traineeId: followUp.traineeId,
      placementId: followUp.placementId,
      checkpointDay: followUp.checkpointDay,
      status: response?.currentlyEmployed ? "active" : "exited",
      wage: response?.currentWage,
      exitReason: response?.currentlyEmployed ? null : response?.reasonForAttrition || "other",
      verificationStatus: followUp.handledBy === "call_center_agent" ? "self_reported" : "self_reported",
    });
  }

  res.json(followUp);
});

// @desc  Mark a follow-up as no-response after all channels exhausted
const markNoResponse = asyncHandler(async (req, res) => {
  const followUp = await FollowUp.findByIdAndUpdate(
    req.params.id,
    { status: "no_response" },
    { new: true }
  );
  if (!followUp) {
    res.status(404);
    throw new Error("Follow-up not found");
  }
  res.json(followUp);
});

module.exports = { getFollowUps, attemptFollowUp, completeFollowUp, markNoResponse };
