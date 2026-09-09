const Provider = require("../models/Provider");
const asyncHandler = require("../middleware/asyncHandler");

// @desc  List all providers
const getProviders = asyncHandler(async (req, res) => {
  const providers = await Provider.find().sort({ name: 1 });
  res.json(providers);
});

// @desc  Create a provider
const createProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.create(req.body);
  res.status(201).json(provider);
});

// @desc  Get single provider
const getProviderById = asyncHandler(async (req, res) => {
  const provider = await Provider.findById(req.params.id);
  if (!provider) {
    res.status(404);
    throw new Error("Provider not found");
  }
  res.json(provider);
});

// @desc  Update a provider (e.g. accreditation status change)
const updateProvider = asyncHandler(async (req, res) => {
  const provider = await Provider.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!provider) {
    res.status(404);
    throw new Error("Provider not found");
  }
  res.json(provider);
});

module.exports = { getProviders, createProvider, getProviderById, updateProvider };
