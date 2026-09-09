const express = require("express");
const router = express.Router();
const {
  getProviders,
  createProvider,
  getProviderById,
  updateProvider,
} = require("../controllers/providerController");

router.route("/").get(getProviders).post(createProvider);
router.route("/:id").get(getProviderById).put(updateProvider);

module.exports = router;
