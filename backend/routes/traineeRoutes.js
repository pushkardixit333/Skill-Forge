const express = require("express");
const router = express.Router();
const {
  getTrainees,
  createTrainee,
  getTraineeById,
  updateTrainee,
  updateConsent,
} = require("../controllers/traineeController");

router.route("/").get(getTrainees).post(createTrainee);
router.route("/:id").get(getTraineeById).put(updateTrainee);
router.route("/:id/consent").put(updateConsent);

module.exports = router;
