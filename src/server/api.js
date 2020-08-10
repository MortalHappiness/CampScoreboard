const express = require("express");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

const model = require("./database/mongo/model");

const occupations = require("./database/data/occupations.json");

// ========================================

const router = express.Router();

// ========================================

async function updateMoney(io, { playerId, moneyChange }) {
  const player = await model.Player.findOneAndUpdate(
    { id: playerId },
    { $inc: { money: moneyChange, score: moneyChange } }
  ).exec();

  if (!player) return false;

  // Broadcast player update
  const playerUpdate = await model.Player.findOne(
    { id: playerId },
    { _id: false, __v: false }
  ).exec();
  if (player) {
    io.emit("UPDATE_PLAYERS", [playerUpdate]);
  }

  return true;
}

async function updateOccupation(io, { playerId, occupation }) {
  const player = await model.Player.findOneAndUpdate(
    { id: playerId },
    { $set: { occupation } }
  ).exec();

  if (!player) return false;

  // Broadcast player update
  const playerUpdate = await model.Player.findOne(
    { id: playerId },
    { _id: false, __v: false }
  ).exec();
  if (player) {
    io.emit("UPDATE_PLAYERS", [playerUpdate]);
  }

  return true;
}

// ========================================
// routes

router.get("/", (req, res, next) => {
  res.send("api");
});

router
  .route("/session")
  .get(
    asyncHandler(async (req, res, next) => {
      if (!req.session.name) {
        res.status(403).end();
        return;
      }
      const { name, spaces } = req.session;
      res.send({ name, spaces });
    })
  )
  .post(
    express.urlencoded({ extended: false }),
    asyncHandler(async (req, res, next) => {
      const { name, password } = req.body;

      if (!name || !password) {
        res.status(400).end();
        return;
      }

      const user = await model.Account.findOne(
        { name },
        "spaces passwordHash"
      ).exec();
      if (!user) {
        res.status(400).end();
        return;
      }
      const { spaces, passwordHash } = user;

      // Check password with the passwordHash
      const match = await bcrypt.compare(password, passwordHash);
      if (!match) {
        res.status(401).end();
        return;
      }

      req.session.name = name;
      req.session.spaces = spaces;
      res.status(201).send({ name, spaces });
    })
  )
  .delete(
    asyncHandler(async (req, res, next) => {
      req.session = null;
      res.status(204).end();
    })
  );

router.put(
  "/money",
  express.json({ strict: false }),
  asyncHandler(async (req, res, next) => {
    if (req.session.name !== "admin") {
      res.status(403).end();
      return;
    }

    const { playerId, moneyChange } = req.body;
    if (
      !playerId ||
      !moneyChange ||
      typeof playerId !== "number" ||
      typeof moneyChange !== "number"
    ) {
      res.status(400).end();
      return;
    }

    const { io } = req.app.locals;
    const isSuccess = await updateMoney(io, { playerId, moneyChange });
    if (!isSuccess) {
      res.status(400).end();
      return;
    }

    res.status(204).end();
  })
);

// Get player ids and names
router.get(
  "/players",
  asyncHandler(async (req, res, next) => {
    const players = await model.Player.find(
      {},
      { _id: false, id: true, name: true }
    )
      .sort({ id: 1 })
      .exec();
    res.send(players);
  })
);

// Get all occupations
router.get(
  "/occupations",
  asyncHandler(async (req, res, next) => {
    res.send(occupations);
  })
);

// Set the occupation of one player
router.put(
  "/occupation",
  express.json({ strict: false }),
  asyncHandler(async (req, res, next) => {
    if (req.session.name !== "admin") {
      res.status(403).end();
      return;
    }

    const { playerId, occupation } = req.body;
    if (
      !playerId ||
      !occupation ||
      typeof playerId !== "number" ||
      typeof occupation !== "string" ||
      !occupations.includes(occupation)
    ) {
      res.status(400).end();
      return;
    }

    const { io } = req.app.locals;
    const isSuccess = await updateOccupation(io, { playerId, occupation });
    if (!isSuccess) {
      res.status(400).end();
      return;
    }

    res.status(204).end();
  })
);

module.exports = router;
