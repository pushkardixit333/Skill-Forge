const Trainee = require("../models/Trainee");
const asyncHandler = require("../middleware/asyncHandler");

const generateTraineeCode = () => {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TR-${year}-${rand}`;
};

// @desc  List trainees with optional filters (district, course, provider, status)
const getTrainees = asyncHandler(async (req, res) => {
  const { district, courseId, providerId, completionStatus, search } = req.query;
  const filter = {};
  if (district) filter["address.district"] = district;
  if (courseId) filter.courseId = courseId;
  if (providerId) filter.providerId = providerId;
  if (completionStatus) filter.completionStatus = completionStatus;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { traineeCode: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const trainees = await Trainee.find(filter)
    .populate("courseId", "name sector")
    .populate("providerId", "name district state")
    .sort({ createdAt: -1 });
  res.json(trainees);
});

// @desc  Create a trainee. Requires at least one consent grant to be recorded
// at enrollment, so a trainee never exists without an auditable consent event.
const createTrainee = asyncHandler(async (req, res) => {
  const { consentScope, consentChannel, ...traineeData } = req.body;

  if (!consentScope || !Array.isArray(consentScope) || consentScope.length === 0) {
    res.status(400);
    throw new Error("At least one consent scope must be recorded at enrollment");
  }

  const trainee = await Trainee.create({
    ...traineeData,
    traineeCode: traineeData.traineeCode || generateTraineeCode(),
    consentLedger: [
      {
        action: "granted",
        scope: consentScope,
        channel: consentChannel || "portal",
        recordedAt: new Date(),
      },
    ],
  });

  res.status(201).json(trainee);
});

const getTraineeById = asyncHandler(async (req, res) => {
  const trainee = await Trainee.findById(req.params.id)
    .populate("courseId")
    .populate("providerId");
  if (!trainee) {
    res.status(404);
    throw new Error("Trainee not found");
  }
  res.json(trainee);
});

const updateTrainee = asyncHandler(async (req, res) => {
  const { consentScope, consentChannel, consentAction, ...updates } = req.body;
  const trainee = await Trainee.findById(req.params.id);
  if (!trainee) {
    res.status(404);
    throw new Error("Trainee not found");
  }

  Object.assign(trainee, updates);

  // Append a new consent event rather than mutating history, if provided
  if (consentAction && consentScope) {
    trainee.consentLedger.push({
      action: consentAction,
      scope: consentScope,
      channel: consentChannel || "portal",
      recordedAt: new Date(),
    });
  }

  await trainee.save();
  res.json(trainee);
});

// @desc  Record a consent grant/revocation without touching other fields
const updateConsent = asyncHandler(async (req, res) => {
  const { action, scope, channel } = req.body;
  if (!["granted", "revoked"].includes(action)) {
    res.status(400);
    throw new Error("action must be 'granted' or 'revoked'");
  }
  const trainee = await Trainee.findById(req.params.id);
  if (!trainee) {
    res.status(404);
    throw new Error("Trainee not found");
  }
  trainee.consentLedger.push({ action, scope, channel: channel || "portal", recordedAt: new Date() });
  await trainee.save();
  res.json(trainee);
});

module.exports = { getTrainees, createTrainee, getTraineeById, updateTrainee, updateConsent };
