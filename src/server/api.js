const express = require("express");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

const model = require("./database/mongo/model");

const CONSTANTS = require("./database/data/constants.json");

// ========================================

const router = express.Router();

const { OCCUPATIONS, BUILDING_SCORE_RATIO } = CONSTANTS;

// ========================================

async function updateMoney(io, { playerId, moneyChange }) {
  const player = await model.Player.findOne({ id: playerId }).exec();
  if (!player) return false;

  const moneyInc =
    player.money + moneyChange >= 0 ? moneyChange : -player.money;
  await model.Player.findOneAndUpdate(
    { id: playerId },
    { $inc: { money: moneyInc, score: moneyInc } }
  ).exec();

  // Broadcast player update
  const playerUpdate = await model.Player.findOne(
    { id: playerId },
    { _id: false, __v: false }
  ).exec();
  if (playerUpdate) {
    io.emit("UPDATE_PLAYERS", [playerUpdate]);
  }

  return true;
}

async function giveGoMoney(io, { playerId }) {
  const goSpace = await model.Space.findOne({ type: "Go" }).exec();
  const { level, costs } = goSpace;
  const moneyChange = costs[level];

  return await updateMoney(io, { playerId, moneyChange });
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
  if (playerUpdate) {
    io.emit("UPDATE_PLAYERS", [playerUpdate]);
  }

  return true;
}

async function updateHighestScore(io, { spaceNum, highestScore }) {
  const space = await model.Space.findOneAndUpdate(
    { num: spaceNum },
    { $set: { highestScore } }
  ).exec();

  if (!space) return false;

  // Broadcast space update
  const spaceUpdate = await model.Space.findOne(
    { num: spaceNum },
    { _id: false, __v: false }
  ).exec();
  if (space) {
    io.emit("UPDATE_SPACES", [spaceUpdate]);
  }

  return true;
}

async function changeOwner(io, { spaceNum, playerId }) {
  // Find owners and update space owner

  const newOwner = await model.Player.findOne(
    { id: playerId },
    { _id: false, __v: false }
  ).exec();
  if (!newOwner) return false;

  const space = await model.Space.findOneAndUpdate(
    { num: spaceNum },
    { $set: { ownedBy: newOwner.name } }
  ).exec();
  if (!space) return false;
  const { type } = space;
  if (type !== "game" && type !== "building" && type !== "special-building") {
    return false;
  }

  const origPlayerName = space.ownedBy;

  let spaceValue;
  if (type === "game") {
    spaceValue = space.costs[0];
  } else if (type === "special-building") {
    spaceValue = space.costs[0] * BUILDING_SCORE_RATIO;
  } else {
    // building
    const currentBuildingValue = space.costs
      .slice(0, space.level)
      .reduce((a, b) => a + b, 0);
    spaceValue = currentBuildingValue * BUILDING_SCORE_RATIO;
  }

  // ========================================
  // Update scores

  await model.Player.findOneAndUpdate(
    { name: origPlayerName },
    { $inc: { score: -spaceValue } }
  ).exec();
  await model.Player.findOneAndUpdate(
    { id: playerId },
    { $inc: { score: spaceValue } }
  ).exec();

  // ========================================
  // Deal with space attributes change

  let updatedSpacesNums = [spaceNum];

  if (type === "building") {
    // Check suite
    const { suite } = space;
    const sameSuiteSpaces = await model.Space.find(
      { suite },
      "num ownedBy"
    ).exec();
    const ownedByFirst = sameSuiteSpaces[0].ownedBy;
    const shouldDouble = sameSuiteSpaces.every(
      (space) => space.ownedBy === ownedByFirst
    );
    await model.Space.updateMany({ suite }, { shouldDouble }).exec();
    updatedSpacesNums = sameSuiteSpaces.map((space) => space.num);
  } else if (type === "special-building") {
    // Update multiple
    const specialBuildingsNewOwner = await model.Space.find(
      { ownedBy: newOwner.name },
      "num"
    ).exec();
    await model.Space.updateMany(
      { ownedBy: newOwner.name },
      { multiple: specialBuildingsNewOwner.length }
    ).exec();
    specialBuildingsNewOwner.forEach((space) => {
      const { num } = space;
      if (!updatedSpacesNums.includes(num)) {
        updatedSpacesNums.push(num);
      }
    });

    const specialBuildingsOrigOwner = await model.Space.find(
      { ownedBy: origPlayerName },
      "num"
    ).exec();
    await model.Space.updateMany(
      { ownedBy: origPlayerName },
      { multiple: specialBuildingsOrigOwner.length }
    ).exec();
    specialBuildingsOrigOwner.forEach((space) => {
      const { num } = space;
      if (!updatedSpacesNums.includes(num)) {
        updatedSpacesNums.push(num);
      }
    });
  }

  // ========================================

  // Broadcast spaces update
  const updatedSpaces = await Promise.all(
    updatedSpacesNums.map(
      async (num) =>
        await model.Space.findOne({ num }, { _id: false, __v: false }).exec()
    )
  );
  if (updatedSpaces) {
    io.emit("UPDATE_SPACES", updatedSpaces);
  }

  // Broadcast players update
  const playersUpdate = [];
  const origOwnerUpdate = await model.Player.findOne(
    { name: origPlayerName },
    { _id: false, __v: false }
  ).exec();
  if (origOwnerUpdate) {
    playersUpdate.push(origOwnerUpdate);
  }
  const newOwnerUpdate = await model.Player.findOne(
    { id: playerId },
    { _id: false, __v: false }
  ).exec();
  if (newOwnerUpdate) {
    playersUpdate.push(newOwnerUpdate);
  }
  if (playersUpdate.length) {
    io.emit("UPDATE_PLAYERS", playersUpdate);
  }

  return true;
}

async function buySpace(io, { spaceNum, playerId }) {
  // Find space and player

  const space = await model.Space.findOne({ num: spaceNum }).exec();
  if (!space) return false;
  const { type } = space;
  if (type !== "building" && type !== "special-building") return false;
  if (space.ownedBy) return false;
  const cost = space.costs[0];

  const player = await model.Player.findOne({ id: playerId }).exec();
  if (!player) return false;

  // ========================================
  // Buy the space

  if (player.money < cost) {
    throw new Error("Do not have enough money!");
  }

  await model.Player.findOneAndUpdate(
    { id: playerId },
    {
      $inc: {
        money: -cost,
        score: Math.floor(cost * (BUILDING_SCORE_RATIO - 1)),
      },
    }
  ).exec();

  // ========================================
  // Deal with space attributes change

  let updatedSpacesNums = [spaceNum];

  if (type === "building") {
    const { suite } = space;
    await model.Space.findOneAndUpdate(
      { num: spaceNum },
      { $set: { level: 1, ownedBy: player.name } }
    ).exec();

    // Check suite
    const sameSuiteSpaces = await model.Space.find(
      { suite },
      "num ownedBy"
    ).exec();
    if (sameSuiteSpaces.every((space) => space.ownedBy === player.name)) {
      await model.Space.updateMany({ suite }, { shouldDouble: true }).exec();
      updatedSpacesNums = sameSuiteSpaces.map((space) => space.num);
    }
  } else {
    // special-building
    await model.Space.findOneAndUpdate(
      { num: spaceNum },
      { $set: { ownedBy: player.name } }
    ).exec();

    // Update multiple
    const specialBuildings = await model.Space.find(
      { ownedBy: player.name },
      "num"
    ).exec();
    await model.Space.updateMany(
      { ownedBy: player.name },
      { multiple: specialBuildings.length }
    ).exec();
    updatedSpacesNums = specialBuildings.map((space) => space.num);
  }

  // ========================================

  // Broadcast spaces update
  const updatedSpaces = await Promise.all(
    updatedSpacesNums.map(
      async (num) =>
        await model.Space.findOne({ num }, { _id: false, __v: false }).exec()
    )
  );
  if (updatedSpaces) {
    io.emit("UPDATE_SPACES", updatedSpaces);
  }

  // Broadcast players update
  const playerUpdate = await model.Player.findOne(
    { id: playerId },
    { _id: false, __v: false }
  ).exec();
  if (playerUpdate) {
    io.emit("UPDATE_PLAYERS", [playerUpdate]);
  }

  return true;
}

// ========================================
// Now we have two permissions: "admin" and "npc"
// All npcs have same permission
function verifyPermission(name, permissions) {
  if (typeof name != "string") return false;

  let hasPermission = false;

  permissions.forEach((permission) => {
    switch (permission) {
      case "admin":
        if (name === permission) {
          hasPermission = true;
        }
        break;
      case "npc":
        if (name.startsWith("npc")) {
          hasPermission = true;
        }
        break;
      default:
        console.error("Invalid permission type");
    }
  });
  return hasPermission;
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
    const { name } = req.session;
    if (!name || typeof name !== "string") {
      res.status(403).end();
      return;
    }
    if (!verifyPermission(name, ["admin", "npc"])) {
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
    res.send(OCCUPATIONS);
  })
);

// Set the occupation of one player
router.put(
  "/occupation",
  express.json({ strict: false }),
  asyncHandler(async (req, res, next) => {
    const { name } = req.session;
    if (!verifyPermission(name, ["admin"])) {
      res.status(403).end();
      return;
    }

    const { playerId, occupation } = req.body;
    if (
      !playerId ||
      !occupation ||
      typeof playerId !== "number" ||
      typeof occupation !== "string" ||
      !OCCUPATIONS.includes(occupation)
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

// Update highest score of game space
router.put(
  "/highestscore",
  express.json({ strict: false }),
  asyncHandler(async (req, res, next) => {
    const { name } = req.session;
    if (!verifyPermission(name, ["admin", "npc"])) {
      res.status(403).end();
      return;
    }

    const { spaceNum, highestScore } = req.body;
    if (
      typeof spaceNum !== "number" ||
      typeof highestScore !== "number" ||
      highestScore < 0
    ) {
      res.status(400).end();
      return;
    }

    const { io } = req.app.locals;
    const isSuccess = await updateHighestScore(io, { spaceNum, highestScore });
    if (!isSuccess) {
      res.status(400).end();
      return;
    }

    res.status(204).end();
  })
);

// Change the owner of space
router.put(
  "/owner",
  express.json({ strict: false }),
  asyncHandler(async (req, res, next) => {
    const { name } = req.session;
    if (!verifyPermission(name, ["admin", "npc"])) {
      res.status(403).end();
      return;
    }

    const { spaceNum, playerId } = req.body;
    if (typeof spaceNum !== "number" || typeof playerId !== "number") {
      res.status(400).end();
      return;
    }

    const { io } = req.app.locals;
    const isSuccess = await changeOwner(io, { spaceNum, playerId });
    if (!isSuccess) {
      res.status(400).end();
      return;
    }

    res.status(204).end();
  })
);

// Give a player "Go" money
router.put(
  "/give-go-money",
  express.json({ strict: false }),
  asyncHandler(async (req, res, next) => {
    const { name } = req.session;
    if (!name || typeof name !== "string") {
      res.status(403).end();
      return;
    }
    if (!verifyPermission(name, ["admin", "npc"])) {
      res.status(403).end();
      return;
    }

    const { playerId } = req.body;
    if (typeof playerId !== "number") {
      res.status(400).end();
      return;
    }

    const { io } = req.app.locals;
    const isSuccess = await giveGoMoney(io, { playerId });
    if (!isSuccess) {
      res.status(400).end();
      return;
    }

    res.status(204).end();
  })
);

// Change the owner of space
router.put(
  "/buy",
  express.json({ strict: false }),
  asyncHandler(async (req, res, next) => {
    const { name } = req.session;
    if (!verifyPermission(name, ["admin", "npc"])) {
      res.status(403).end();
      return;
    }

    const { spaceNum, playerId } = req.body;
    if (typeof spaceNum !== "number" || typeof playerId !== "number") {
      res.status(400).end();
      return;
    }

    const { io } = req.app.locals;
    try {
      const isSuccess = await buySpace(io, { spaceNum, playerId });
      if (!isSuccess) {
        res.status(400).end();
        return;
      }
    } catch (e) {
      const { message } = e;
      res.status(400).send({ message });
      return;
    }

    res.status(204).end();
  })
);

module.exports = router;
