const Placement = require("../models/Placement");
const Trainee = require("../models/Trainee");
const asyncHandler = require("../middleware/asyncHandler");
const { scheduleFollowUpsForPlacement } = require("../jobs/followupScheduler");

const getPlacements = asyncHandler(async (req, res) => {
  const { outcomeType, traineeId } = req.query;
  const filter = {};
  if (outcomeType) filter.outcomeType = outcomeType;
  if (traineeId) filter.traineeId = traineeId;

  const placements = await Placement.find(filter)
    .populate("traineeId", "name traineeCode address")
    .populate("employerId", "name verificationStatus")
    .sort({ createdAt: -1 });
  res.json(placements);
});

// @desc  Create a placement/outcome record (wage employment, self-employment,
// apprenticeship, or a documented non-placement) and auto-schedule follow-ups.
const createPlacement = asyncHandler(async (req, res) => {
  const placement = await Placement.create(req.body);

  // Reflect outcome onto the trainee's course status for quick filtering
  if (placement.outcomeType !== "not_placed") {
    await Trainee.findByIdAndUpdate(placement.traineeId, { completionStatus: "completed" });
  }

  const followUps = await scheduleFollowUpsForPlacement(placement);
  res.status(201).json({ placement, scheduledFollowUps: followUps.length });
});

const getPlacementById = asyncHandler(async (req, res) => {
  const placement = await Placement.findById(req.params.id)
    .populate("traineeId")
    .populate("employerId");
  if (!placement) {
    res.status(404);
    throw new Error("Placement not found");
  }
  res.json(placement);
});

const updatePlacement = asyncHandler(async (req, res) => {
  const placement = await Placement.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!placement) {
    res.status(404);
    throw new Error("Placement not found");
  }
  res.json(placement);
});

module.exports = { getPlacements, createPlacement, getPlacementById, updatePlacement };
