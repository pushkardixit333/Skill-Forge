const express = require("express");
const router = express.Router();
const { getCourses, createCourse, getCourseById } = require("../controllers/courseController");

router.route("/").get(getCourses).post(createCourse);
router.route("/:id").get(getCourseById);

module.exports = router;
