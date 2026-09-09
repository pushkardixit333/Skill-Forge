const Trainee = require("../models/Trainee");
const Placement = require("../models/Placement");
const EmploymentSpell = require("../models/EmploymentSpell");
const asyncHandler = require("../middleware/asyncHandler");

// @desc  Top-line KPIs for the dashboard header
const getSummary = asyncHandler(async (req, res) => {
  const totalTrainees = await Trainee.countDocuments();
  const completed = await Trainee.countDocuments({ completionStatus: "completed" });
  const droppedOut = await Trainee.countDocuments({ completionStatus: "dropped_out" });

  const placementAgg = await Placement.aggregate([
    {
      $group: {
        _id: "$outcomeType",
        count: { $sum: 1 },
        avgWage: { $avg: "$initialWage" },
      },
    },
  ]);

  const placed = placementAgg
    .filter((p) => p._id !== "not_placed")
    .reduce((sum, p) => sum + p.count, 0);
  const notPlaced = placementAgg.find((p) => p._id === "not_placed")?.count || 0;

  const retentionAgg = await EmploymentSpell.aggregate([
    { $match: { checkpointDay: 180 } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
      },
    },
  ]);
  const retention180 = retentionAgg[0]
    ? Math.round((retentionAgg[0].active / retentionAgg[0].total) * 100)
    : null;

  res.json({
    totalTrainees,
    completed,
    droppedOut,
    placed,
    notPlaced,
    placementRate: totalTrainees ? Math.round((placed / totalTrainees) * 100) : 0,
    retentionRate180Day: retention180,
    outcomeBreakdown: placementAgg,
  });
});

// @desc  Placement % and average wage grouped by course
const byCourse = asyncHandler(async (req, res) => {
  const data = await Trainee.aggregate([
    {
      $lookup: {
        from: "placements",
        localField: "_id",
        foreignField: "traineeId",
        as: "placement",
      },
    },
    { $unwind: { path: "$placement", preserveNullAndEmptyArrays: true } },
    {
      $lookup: { from: "courses", localField: "courseId", foreignField: "_id", as: "course" },
    },
    { $unwind: "$course" },
    {
      $group: {
        _id: "$course.name",
        sector: { $first: "$course.sector" },
        totalTrainees: { $sum: 1 },
        placed: {
          $sum: { $cond: [{ $ne: ["$placement.outcomeType", "not_placed"] }, 1, 0] },
        },
        avgWage: { $avg: "$placement.initialWage" },
      },
    },
    {
      $project: {
        course: "$_id",
        sector: 1,
        totalTrainees: 1,
        placed: 1,
        placementRate: { $round: [{ $multiply: [{ $divide: ["$placed", "$totalTrainees"] }, 100] }, 0] },
        avgWage: { $round: ["$avgWage", 0] },
        _id: 0,
      },
    },
    { $sort: { totalTrainees: -1 } },
  ]);
  res.json(data);
});

// @desc  Placement % grouped by district
const byDistrict = asyncHandler(async (req, res) => {
  const data = await Trainee.aggregate([
    {
      $lookup: { from: "placements", localField: "_id", foreignField: "traineeId", as: "placement" },
    },
    { $unwind: { path: "$placement", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$address.district",
        totalTrainees: { $sum: 1 },
        placed: { $sum: { $cond: [{ $ne: ["$placement.outcomeType", "not_placed"] }, 1, 0] } },
      },
    },
    {
      $project: {
        district: "$_id",
        totalTrainees: 1,
        placed: 1,
        placementRate: { $round: [{ $multiply: [{ $divide: ["$placed", "$totalTrainees"] }, 100] }, 0] },
        _id: 0,
      },
    },
    { $sort: { totalTrainees: -1 } },
  ]);
  res.json(data);
});

// @desc  Provider scorecards: placement %, avg wage, retention %, complaint proxy
const byProvider = asyncHandler(async (req, res) => {
  const data = await Trainee.aggregate([
    {
      $lookup: { from: "placements", localField: "_id", foreignField: "traineeId", as: "placement" },
    },
    { $unwind: { path: "$placement", preserveNullAndEmptyArrays: true } },
    {
      $lookup: { from: "providers", localField: "providerId", foreignField: "_id", as: "provider" },
    },
    { $unwind: "$provider" },
    {
      $group: {
        _id: "$provider.name",
        district: { $first: "$provider.district" },
        accreditationStatus: { $first: "$provider.accreditationStatus" },
        totalTrainees: { $sum: 1 },
        placed: { $sum: { $cond: [{ $ne: ["$placement.outcomeType", "not_placed"] }, 1, 0] } },
        avgWage: { $avg: "$placement.initialWage" },
      },
    },
    {
      $project: {
        provider: "$_id",
        district: 1,
        accreditationStatus: 1,
        totalTrainees: 1,
        placed: 1,
        placementRate: { $round: [{ $multiply: [{ $divide: ["$placed", "$totalTrainees"] }, 100] }, 0] },
        avgWage: { $round: ["$avgWage", 0] },
        _id: 0,
      },
    },
    { $sort: { placementRate: -1 } },
  ]);
  res.json(data);
});

// @desc  Demographic cuts - gender & social category placement rates
const byDemographic = asyncHandler(async (req, res) => {
  const byGender = await Trainee.aggregate([
    { $lookup: { from: "placements", localField: "_id", foreignField: "traineeId", as: "placement" } },
    { $unwind: { path: "$placement", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$gender",
        total: { $sum: 1 },
        placed: { $sum: { $cond: [{ $ne: ["$placement.outcomeType", "not_placed"] }, 1, 0] } },
      },
    },
    { $project: { gender: "$_id", total: 1, placed: 1, _id: 0 } },
  ]);

  const byCategory = await Trainee.aggregate([
    { $lookup: { from: "placements", localField: "_id", foreignField: "traineeId", as: "placement" } },
    { $unwind: { path: "$placement", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: "$category",
        total: { $sum: 1 },
        placed: { $sum: { $cond: [{ $ne: ["$placement.outcomeType", "not_placed"] }, 1, 0] } },
      },
    },
    { $project: { category: "$_id", total: 1, placed: 1, _id: 0 } },
  ]);

  res.json({ byGender, byCategory });
});

// @desc  Aggregated reasons for non-placement (feeds remedial-action decisions)
const nonPlacementReasons = asyncHandler(async (req, res) => {
  const data = await Placement.aggregate([
    { $match: { outcomeType: "not_placed" } },
    { $group: { _id: "$nonPlacementReason", count: { $sum: 1 } } },
    { $project: { reason: "$_id", count: 1, _id: 0 } },
    { $sort: { count: -1 } },
  ]);
  res.json(data);
});

// @desc  Aggregated reasons for job attrition, from employment-spell exits
const attritionReasons = asyncHandler(async (req, res) => {
  const data = await EmploymentSpell.aggregate([
    { $match: { status: "exited", exitReason: { $ne: null } } },
    { $group: { _id: "$exitReason", count: { $sum: 1 } } },
    { $project: { reason: "$_id", count: 1, _id: 0 } },
    { $sort: { count: -1 } },
  ]);
  res.json(data);
});

// @desc  Wage progression across follow-up checkpoints (30/90/180/365 days)
const wageProgression = asyncHandler(async (req, res) => {
  const data = await EmploymentSpell.aggregate([
    { $match: { wage: { $ne: null } } },
    {
      $group: {
        _id: "$checkpointDay",
        avgWage: { $avg: "$wage" },
        sampleSize: { $sum: 1 },
      },
    },
    { $project: { checkpointDay: "$_id", avgWage: { $round: ["$avgWage", 0] }, sampleSize: 1, _id: 0 } },
    { $sort: { checkpointDay: 1 } },
  ]);
  res.json(data);
});

// @desc  Retention survival rate at each checkpoint (% still employed)
const retentionCurve = asyncHandler(async (req, res) => {
  const data = await EmploymentSpell.aggregate([
    {
      $group: {
        _id: "$checkpointDay",
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
      },
    },
    {
      $project: {
        checkpointDay: "$_id",
        retentionRate: { $round: [{ $multiply: [{ $divide: ["$active", "$total"] }, 100] }, 0] },
        total: 1,
        _id: 0,
      },
    },
    { $sort: { checkpointDay: 1 } },
  ]);
  res.json(data);
});

// @desc  Skill-gap proxy: courses with the highest non-placement rate due to
// skill_mismatch, so curriculum owners know which trades to revise first.
const skillGaps = asyncHandler(async (req, res) => {
  const data = await Placement.aggregate([
    { $match: { outcomeType: "not_placed", nonPlacementReason: "skill_mismatch" } },
    { $lookup: { from: "trainees", localField: "traineeId", foreignField: "_id", as: "trainee" } },
    { $unwind: "$trainee" },
    { $lookup: { from: "courses", localField: "trainee.courseId", foreignField: "_id", as: "course" } },
    { $unwind: "$course" },
    {
      $group: {
        _id: "$course.name",
        sector: { $first: "$course.sector" },
        curriculumSkills: { $first: "$course.curriculumSkills" },
        skillMismatchCount: { $sum: 1 },
      },
    },
    { $project: { course: "$_id", sector: 1, curriculumSkills: 1, skillMismatchCount: 1, _id: 0 } },
    { $sort: { skillMismatchCount: -1 } },
  ]);
  res.json(data);
});

module.exports = {
  getSummary,
  byCourse,
  byDistrict,
  byProvider,
  byDemographic,
  nonPlacementReasons,
  attritionReasons,
  wageProgression,
  retentionCurve,
  skillGaps,
};
