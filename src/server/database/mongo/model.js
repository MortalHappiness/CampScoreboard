const mongoose = require("mongoose");

// ========================================

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    immutable: true,
  },
  score: {
    type: Number,
    required: true,
  },
});

const Player = mongoose.model("Player", playerSchema);

// ========================================

module.exports = {
  Player,
};
