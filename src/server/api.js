const express = require("express");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

const model = require("./database/mongo/model");

const CONSTANTS = require("./database/data/constants.json");

// ========================================

const router = express.Router();

const { OCCUPATIONS, BUILDING_SCORE_RATIO } = CONSTANTS;

// ========================================

async function recalculateScore(playerId) {
  const player = await model.Player.findOne({ id: playerId }).exec();
  let score = player.money;

  const games = await model.Space.find({
    ownedBy: player.name,
    type: "game",
  }).exec();
  games.forEach((game) => {
    score += game.costs[0];
  });

  const buildings = await model.Space.find({
    ownedBy: player.name,
    type: "building",
  }).exec();
  buildings.forEach((building) => {
    const { costs, level } = building;
    const cost = costs.slice(0, level).reduce((a, b) => a + b, 0);
    score += cost * BUILDING_SCORE_RATIO;
  });

  const specialBuildings = await model.Space.find({
    ownedBy: player.name,
    type: "special-building",
  }).exec();
  specialBuildings.forEach((specialBuilding) => {
    score += specialBuilding.costs[0] * BUILDING_SCORE_RATIO;
  });

  score = Math.floor(score);

  await model.Player.findOneAndUpdate(
    { id: playerId },
    { $set: { score } }
  ).exec();

  // return changed players' Ids
  return [playerId];
}

async function recalculateShouldDouble(spaceNum) {
  const space = await model.Space.findOne({ num: spaceNum }).exec();
  if (!space) return [];
  if (space.type !== "building") return [];
  const { suite, ownedBy, shouldDouble } = space;

  const sameSuiteBuildings = await model.Space.find({ suite }).exec();
  const newShouldDouble = sameSuiteBuildings.every(
    (building) => building.ownedBy === ownedBy
  );

  if (shouldDouble === newShouldDouble) return [];

  await model.Space.updateMany(
    { suite },
    { shouldDouble: newShouldDouble }
  ).exec();

  // return changed spaces' nums
  return sameSuiteBuildings.map((building) => building.num);
}

// Currently update all spacial-buildings no matter they are changed or not
// Maybe can be optimized in the future
async function recalculateMultiple() {
  const ownCounts = await model.Space.aggregate([
    { $match: { type: "special-building" } },
    {
      $group: {
        _id: "$ownedBy",
        count: { $sum: 1 },
      },
    },
  ]).exec();

  await Promise.all(
    ownCounts.map(async (ownCount) => {
      const { _id: ownedBy, count: multiple } = ownCount;
      if (ownedBy === "") return;
      await model.Space.updateMany(
        { type: "special-building", ownedBy },
        { multiple }
      ).exec();
    })
  );

  // return changed spaces' nums
  const spaces = await model.Space.find({
    type: "special-building",
    ownedBy: { $ne: "" },
  }).exec();
  return spaces.map((space) => space.num);
}

async function broadcastPlayersChange(io, playerIds) {
  let playersUpdate = await Promise.all(
    playerIds.map(
      async (id) =>
        await model.Player.findOne({ id }, { _id: false, __v: false }).exec()
    )
  );
  playersUpdate = playersUpdate.filter((x) => Boolean(x));
  if (playersUpdate.length) {
    io.emit("UPDATE_PLAYERS", playersUpdate);
  }
}

async function broadcastSpacesChange(io, spaceNums) {
  let spacesUpdate = await Promise.all(
    spaceNums.map(
      async (num) =>
        await model.Space.findOne({ num }, { _id: false, __v: false }).exec()
    )
  );
  spacesUpdate = spacesUpdate.filter((x) => Boolean(x));
  if (spacesUpdate.length) {
    io.emit("UPDATE_SPACES", spacesUpdate);
  }
}

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

  await broadcastPlayersChange(io, [playerId]);

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

  await broadcastPlayersChange(io, [playerId]);

  return true;
}

async function updateHighestScore(io, { spaceNum, highestScore }) {
  const space = await model.Space.findOneAndUpdate(
    { num: spaceNum },
    { $set: { highestScore } }
  ).exec();

  if (!space) return false;

  await broadcastSpacesChange(io, [spaceNum]);

  return true;
}

async function changeOwner(io, { spaceNum, playerId }) {
  const updatedPlayerIds = new Set([playerId]);
  const updatedSpaceNums = new Set([spaceNum]);

  // Find owners and update space owner
  const newOwner = await model.Player.findOne({ id: playerId }).exec();
  if (!newOwner) return false;

  const space = await model.Space.findOneAndUpdate(
    { num: spaceNum },
    { $set: { ownedBy: newOwner.name } }
  ).exec();
  if (!space) return false;
  if (!["game", "building", "special-building"].includes(space.type))
    return false;

  const oldOwner = await model.Player.findOne({ name: space.ownedBy }).exec();

  // Update scores
  let changedPlayerIds;
  if (oldOwner) {
    changedPlayerIds = await recalculateScore(oldOwner.id);
    changedPlayerIds.forEach((playerId) => {
      updatedPlayerIds.add(playerId);
    });
  }
  if (newOwner) {
    changedPlayerIds = await recalculateScore(newOwner.id);
    changedPlayerIds.forEach((playerId) => {
      updatedPlayerIds.add(playerId);
    });
  }

  // handle space attributes change
  let changedSpaceNums;

  if (space.type === "building") {
    changedSpaceNums = await recalculateShouldDouble(spaceNum);
    changedSpaceNums.forEach((spaceNum) => {
      updatedSpaceNums.add(spaceNum);
    });
  } else if (space.type === "special-building") {
    changedSpaceNums = await recalculateMultiple(spaceNum);
    changedSpaceNums.forEach((spaceNum) => {
      updatedSpaceNums.add(spaceNum);
    });
  }

  // Broadcast players update
  await broadcastPlayersChange(io, [...updatedPlayerIds]);

  // Broadcast spaces update
  await broadcastSpacesChange(io, [...updatedSpaceNums]);

  return true;
}

async function buySpace(io, { spaceNum, playerId }) {
  const updatedSpaceNums = new Set([spaceNum]);

  // Find space and player
  const space = await model.Space.findOne({ num: spaceNum }).exec();
  if (!space) return false;
  if (!["building", "special-building"].includes(space.type)) return false;
  if (space.ownedBy) return false;
  const cost = space.costs[0];

  const player = await model.Player.findOne({ id: playerId }).exec();
  if (!player) return false;

  // Buy the space
  if (player.money < cost) {
    throw new Error("Do not have enough money!");
  }
  await model.Player.findOneAndUpdate(
    { id: playerId },
    { $inc: { money: -cost } }
  ).exec();

  // Handle space attributes change
  let changedSpaceNums;
  if (space.type === "building") {
    await model.Space.findOneAndUpdate(
      { num: spaceNum },
      { $set: { level: 1, ownedBy: player.name } }
    ).exec();
    changedSpaceNums = await recalculateShouldDouble(spaceNum);
    changedSpaceNums.forEach((spaceNum) => {
      updatedSpaceNums.add(spaceNum);
    });
  } else if (space.type === "special-building") {
    await model.Space.findOneAndUpdate(
      { num: spaceNum },
      { $set: { ownedBy: player.name } }
    ).exec();
    changedSpaceNums = await recalculateMultiple(spaceNum);
    changedSpaceNums.forEach((spaceNum) => {
      updatedSpaceNums.add(spaceNum);
    });
  }

  // Update scores
  const updatedPlayerIds = await recalculateScore(playerId);

  // Broadcast spaces update
  await broadcastSpacesChange(io, [...updatedSpaceNums]);

  // Broadcast players update
  await broadcastPlayersChange(io, [...updatedPlayerIds]);

  return true;
}

async function upgradeSpace(io, { spaceNum, shouldPay }) {
  // Find space and owner
  const space = await model.Space.findOne({ num: spaceNum }).exec();
  if (!space) return false;
  const { type, level, ownedBy, costs } = space;
  if (type !== "building") return false;
  if (level !== 1 && level !== 2) return false;
  const cost = costs[level];

  const owner = await model.Player.findOne({ name: ownedBy }).exec();
  if (!owner) return false;

  // Upgrade and pay
  if (shouldPay && owner.money < cost) {
    throw new Error("Do not have enough money!");
  }

  const updatedSpaceNums = [spaceNum];
  await model.Space.findOneAndUpdate(
    { num: spaceNum },
    { $inc: { level: 1 } }
  ).exec();

  if (shouldPay) {
    await model.Player.findOneAndUpdate(
      { id: owner.id },
      { $inc: { money: -cost } }
    ).exec();
  }

  // Update scores
  const updatedPlayerIds = await recalculateScore(owner.id);

  // Broadcast spaces update
  await broadcastSpacesChange(io, [...updatedSpaceNums]);

  // Broadcast players update
  await broadcastPlayersChange(io, [...updatedPlayerIds]);

  return true;
}

async function taxSomeOne(io, { spaceNum, playerId }) {
  // Find space and player
  const playerToBeTaxed = await model.Player.findOne({ id: playerId }).exec();
  if (!playerToBeTaxed) return false;

  const space = await model.Space.findOne({ num: spaceNum }).exec();
  if (!space) return false;
  if (!["building", "special-building"].includes(space.type)) return false;

  const owner = await model.Player.findOne({ name: space.ownedBy }).exec();

  if (owner.id === playerId) {
    throw new Error("You want to tax yourself? skr skr");
  }
  const updatedPlayerIds = [playerId, owner.id];

  // Calculate tax value
  let tax = 0;
  if (space.type === "building") {
    tax = space.taxes[space.level - 1];
    if (space.shouldDouble) {
      tax *= 2;
    }
  } else {
    // special-building
    tax = space.taxes[0] * space.multiple;
  }
  tax = Math.min(tax, playerToBeTaxed.money);

  // Change Money
  await model.Player.findOneAndUpdate(
    { id: owner.id },
    { $inc: { money: tax } }
  ).exec();
  await model.Player.findOneAndUpdate(
    { id: playerId },
    { $inc: { money: -tax } }
  ).exec();

  // Update scores
  await recalculateScore(owner.id);
  await recalculateScore(playerId);

  // Broadcast players update
  await broadcastPlayersChange(io, [...updatedPlayerIds]);

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

// Upgrage the space (building)
router.put(
  "/upgrade",
  express.json({ strict: false }),
  asyncHandler(async (req, res, next) => {
    const { name } = req.session;
    if (!verifyPermission(name, ["admin", "npc"])) {
      res.status(403).end();
      return;
    }

    const { spaceNum, shouldPay } = req.body;
    if (typeof spaceNum !== "number" || typeof shouldPay !== "boolean") {
      res.status(400).end();
      return;
    }

    const { io } = req.app.locals;
    try {
      const isSuccess = await upgradeSpace(io, { spaceNum, shouldPay });
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

// Change the owner of space
router.put(
  "/tax",
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
      const isSuccess = await taxSomeOne(io, { spaceNum, playerId });
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
