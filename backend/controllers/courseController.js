const Course = require("../models/Course");
const asyncHandler = require("../middleware/asyncHandler");

const getCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find().populate("providerId", "name district state").sort({ name: 1 });
  res.json(courses);
});

const createCourse = asyncHandler(async (req, res) => {
  const course = await Course.create(req.body);
  res.status(201).json(course);
});

const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id).populate("providerId", "name district state");
  if (!course) {
    res.status(404);
    throw new Error("Course not found");
  }
  res.json(course);
});

module.exports = { getCourses, createCourse, getCourseById };
