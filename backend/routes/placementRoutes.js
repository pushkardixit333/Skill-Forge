const express = require("express");
const router = express.Router();
const {
  getPlacements,
  createPlacement,
  getPlacementById,
  updatePlacement,
} = require("../controllers/placementController");

router.route("/").get(getPlacements).post(createPlacement);
router.route("/:id").get(getPlacementById).put(updatePlacement);

module.exports = router;
