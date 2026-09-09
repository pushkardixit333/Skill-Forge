const Employer = require("../models/Employer");
const asyncHandler = require("../middleware/asyncHandler");

const getEmployers = asyncHandler(async (req, res) => {
  const employers = await Employer.find().sort({ name: 1 });
  res.json(employers);
});

const createEmployer = asyncHandler(async (req, res) => {
  const employer = await Employer.create(req.body);
  res.status(201).json(employer);
});

// @desc  Mark an employer's verification status
// In production this would call an EPFO/GSTIN/Udyam lookup API before
// setting status to "govt_database_verified". Here it is a manual/admin action.
const verifyEmployer = asyncHandler(async (req, res) => {
  const { verificationStatus, verificationNotes } = req.body;
  const employer = await Employer.findByIdAndUpdate(
    req.params.id,
    { verificationStatus, verificationNotes },
    { new: true, runValidators: true }
  );
  if (!employer) {
    res.status(404);
    throw new Error("Employer not found");
  }
  res.json(employer);
});

module.exports = { getEmployers, createEmployer, verifyEmployer };
