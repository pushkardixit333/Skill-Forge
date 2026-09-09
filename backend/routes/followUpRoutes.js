const express = require("express");
const router = express.Router();
const {
  getFollowUps,
  attemptFollowUp,
  completeFollowUp,
  markNoResponse,
} = require("../controllers/followUpController");

router.route("/").get(getFollowUps);
router.route("/:id/attempt").put(attemptFollowUp);
router.route("/:id/complete").put(completeFollowUp);
router.route("/:id/no-response").put(markNoResponse);

module.exports = router;
