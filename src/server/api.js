const express = require("express");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

const model = require("./database/mongo/model");

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
      res.send({ name: req.session.name });
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

      const user = await model.Account.findOne({ name }, "passwordHash").exec();
      if (!user) {
        res.status(400).end();
        return;
      }
      const { passwordHash } = user;

      // Check password with the passwordHash
      const match = await bcrypt.compare(password, passwordHash);
      if (!match) {
        res.status(401).end();
        return;
      }

      req.session.name = name;
      res.status(201).send({ name });
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

module.exports = router;
