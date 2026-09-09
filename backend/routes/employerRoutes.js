const express = require("express");
const router = express.Router();
const { getEmployers, createEmployer, verifyEmployer } = require("../controllers/employerController");

router.route("/").get(getEmployers).post(createEmployer);
router.route("/:id/verify").put(verifyEmployer);

module.exports = router;
