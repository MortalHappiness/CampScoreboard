const express = require("express");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

// ========================================

const router = express.Router();

// ========================================

router.get("/", (req, res, next) => {
  res.send("api");
});

module.exports = router;
