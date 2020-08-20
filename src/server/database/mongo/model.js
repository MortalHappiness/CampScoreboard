const mongoose = require("mongoose");

// ========================================

const pairSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    immutable: true,
  },
  value: {
    type: mongoose.Mixed,
    required: true,
  },
});

const Pair = mongoose.model("Pair", pairSchema);

// ========================================

const playerSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
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

const accountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    immutable: true,
  },
  passwordHash: {
    type: String,
    required: true,
    immutable: true,
  },
  spaces: {
    type: [Number],
    immutable: true,
  },
});

const Account = mongoose.model("Account", accountSchema);

// ========================================

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    immutable: true,
  },
  content: {
    type: String,
    required: true,
    immutable: true,
  },
  time: {
    type: String,
    required: true,
    immutable: true,
  },
  type: {
    type: String,
    required: true,
    immutable: true,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

// ========================================

const eventSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    immutable: true,
  },
  name: {
    type: String,
    required: true,
    immutable: true,
  },
  description: {
    type: String,
    required: true,
    immutable: true,
  },
});

const Event = mongoose.model("Event", eventSchema);

// ========================================

module.exports = {
  Pair,
  Player,
  Space,
  Account,
  Notification,
  Event,
};
