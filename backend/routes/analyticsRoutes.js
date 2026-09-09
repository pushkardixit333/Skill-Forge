const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/analyticsController");

router.get("/summary", getSummary);
router.get("/by-course", byCourse);
router.get("/by-district", byDistrict);
router.get("/by-provider", byProvider);
router.get("/by-demographic", byDemographic);
router.get("/non-placement-reasons", nonPlacementReasons);
router.get("/attrition-reasons", attritionReasons);
router.get("/wage-progression", wageProgression);
router.get("/retention-curve", retentionCurve);
router.get("/skill-gaps", skillGaps);

module.exports = router;
