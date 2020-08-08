const mongoose = require("mongoose");

// ========================================

const playerSchema = new mongoose.Schema({
  id: {
    type: Number,
    require: true,
    immutable: true,
  },
  name: {
    type: String,
    required: true,
    immutable: true,
  },
  money: {
    type: Number,
    required: true,
  },
  occupation: {
    type: String,
  },
  score: {
    type: Number,
    required: true,
  },
});

const Player = mongoose.model("Player", playerSchema);

// ========================================

const spaceSchema = new mongoose.Schema({
  num: {
    type: Number,
    required: true,
    immutable: true,
  },
  name: {
    type: String,
    required: true,
    immutable: true,
  },
  type: {
    type: String,
    required: true,
    immutable: true,
  },
  suite: {
    type: Number,
  },
  shouldDouble: {
    type: Boolean,
  },
  level: {
    type: Number,
  },
  costs: {
    type: [Number],
  },
  taxes: {
    type: [Number],
  },
  ownedBy: {
    type: String,
  },
  multiple: {
    type: Number,
  },
  highestScore: {
    type: Number,
  },
});

const Space = mongoose.model("Space", spaceSchema);

// ========================================

module.exports = {
  Player,
  Space,
};
