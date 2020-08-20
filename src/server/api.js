const express = require("express");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

const model = require("./database/mongo/model");
const utils = require("./utils");

const CONSTANTS = require("./database/data/constants.json");

// ========================================

const router = express.Router();

const { OCCUPATIONS, BUILDING_SCORE_RATIO, CARDS } = CONSTANTS;

// ========================================

async function addNotification(io, { title, content, type }) {
  const time = new Date().toISOString();
  const notification = { title, content, time, type };
  const notificationDocument = new model.Notification(notification);
  await notificationDocument.save();

  io.emit("UPDATE_NOTIFICATIONS", [notificationDocument]);

  return;
}

async function getOwnedBuildingsValue(playerId) {
  const player = await model.Player.findOne({ id: playerId }).exec();

  let buildingsValue = 0;
  const buildings = await model.Space.find({
    ownedBy: player.name,
    type: "building",
  }).exec();
  buildings.forEach((building) => {
    const { costs, level } = building;
    const cost = costs.slice(0, level).reduce((a, b) => a + b, 0);
    buildingsValue += cost;
  });

  const specialBuildings = await model.Space.find({
    ownedBy: player.name,
    type: "special-building",
  }).exec();
  specialBuildings.forEach((specialBuilding) => {
    buildingsValue += specialBuilding.costs[0];
  });
  return buildingsValue;
}

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

  const buildingRatio =
    player.occupation === "雕刻家" ? 1 : BUILDING_SCORE_RATIO;

  const buildingsValue = await getOwnedBuildingsValue(playerId);

  score += buildingsValue * buildingRatio;

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
  const { suite, shouldDouble } = space;

  const sameSuiteBuildings = await model.Space.find({ suite }).exec();
  const firstOwnedBy = sameSuiteBuildings[0].ownedBy;
  const newShouldDouble =
    firstOwnedBy !== "" &&
    sameSuiteBuildings.every((building) => building.ownedBy === firstOwnedBy);

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
      if (ownedBy === "") {
        await model.Space.updateMany(
          { type: "special-building", ownedBy },
          { multiple: 0 }
        ).exec();
      } else {
        await model.Space.updateMany(
          { type: "special-building", ownedBy },
          { multiple }
        ).exec();
      }
    })
  );

  // return changed spaces' nums
  const spaces = await model.Space.find({ type: "special-building" }).exec();
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

  let bankrupt, moneyInc;
  if (player.money + moneyChange > 0) {
    bankrupt = false;
    moneyInc = moneyChange;
  } else {
    if (player.money === 0) return true;
    bankrupt = true;
    moneyInc = -player.money;
  }
  await model.Player.findOneAndUpdate(
    { id: playerId },
    { $inc: { money: moneyInc, score: moneyInc } }
  ).exec();

  if (bankrupt) {
    await addNotification(io, {
      title: "通知：破產",
      content: `${player.name}破產了！`,
      type: "info",
    });
  }

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

  // Recalculate score because 雕刻家's building ratio is different
  await recalculateScore(playerId);

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

async function robCard(io, { spaceNum, playerId }) {
  let success;

  const space = await model.Space.findOne({ num: spaceNum }).exec();
  if (!space) return false;
  if (!["building", "special-building"].includes(space.type)) return false;
  if (!space.ownedBy) return false;
  const oldOwner = await model.Player.findOne({ name: space.ownedBy }).exec();
  if (!oldOwner) return false;
  const newOwner = await model.Player.findOne({ id: playerId }).exec();
  if (!newOwner) return false;

  if (oldOwner.id === newOwner.id) throw new Error("You cannot rob yourself!");

  // compensate
  let buildingValue;
  if (space.type === "building") {
    const { costs, level } = space;
    buildingValue = costs.slice(0, level).reduce((a, b) => a + b, 0);
  } else {
    // special-building
    buildingValue = space.costs[0];
  }

  success = await updateMoney(io, {
    playerId: oldOwner.id,
    moneyChange: buildingValue,
  });
  if (!success) return false;

  success = await changeOwner(io, { spaceNum, playerId });
  if (!success) return false;

  success = await addNotification(io, {
    title: "卡片：搶奪卡",
    content: `${newOwner.name}對第${spaceNum}格使用了搶奪卡，原擁有者${oldOwner.name}返還該房產價值的金錢($${buildingValue})作為補償`,
    type: "card",
  });
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
  await updateMoney(io, { playerId, moneyChange: -cost });

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
    await updateMoney(io, { playerId: owner.id, moneyChange: -cost });
  }

  // Update scores
  const updatedPlayerIds = await recalculateScore(owner.id);

  // Broadcast spaces update
  await broadcastSpacesChange(io, [...updatedSpaceNums]);

  // Broadcast players update
  await broadcastPlayersChange(io, [...updatedPlayerIds]);

  return true;
}

async function destroySpace(io, { spaceNum }) {
  const updatedPlayerIds = new Set();
  const updatedSpaceNums = new Set([spaceNum]);

  // Find space
  const space = await model.Space.findOne({ num: spaceNum }).exec();
  if (!space) return false;
  if (!["building", "special-building"].includes(space.type)) return false;
  if (space.ownedBy === "") return false;

  const origOwner = await model.Player.findOne({ name: space.ownedBy }).exec();
  if (!origOwner) return false;
  updatedPlayerIds.add(origOwner.id);

  // Update owner
  if (space.type === "building") {
    await model.Space.findOneAndUpdate(
      { num: spaceNum },
      { ownedBy: "", level: 0 }
    ).exec();
  } else {
    // special-building
    await model.Space.findOneAndUpdate(
      { num: spaceNum },
      { ownedBy: "" }
    ).exec();
  }

  // Update scores
  await recalculateScore(origOwner.id);

  // handle space attributes change
  let changedSpaceNums;

  if (space.type === "building") {
    changedSpaceNums = await recalculateShouldDouble(spaceNum);
    changedSpaceNums.forEach((spaceNum) => {
      updatedSpaceNums.add(spaceNum);
    });
  } else {
    // special-building
    changedSpaceNums = await recalculateMultiple(spaceNum);
    changedSpaceNums.forEach((spaceNum) => {
      updatedSpaceNums.add(spaceNum);
    });
  }

  // Add notification
  await addNotification(io, {
    title: "通知：房產被拆除",
    content: `第${space.num}格的房產(${space.name})被拆除了！`,
    type: "info",
  });

  // Broadcast players update
  await broadcastPlayersChange(io, [...updatedPlayerIds]);

  // Broadcast spaces update
  await broadcastSpacesChange(io, [...updatedSpaceNums]);

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
  await updateMoney(io, { playerId: owner.id, moneyChange: tax });
  await updateMoney(io, { playerId, moneyChange: -tax });

  // Update scores
  await recalculateScore(owner.id);
  await recalculateScore(playerId);

  // Broadcast players update
  await broadcastPlayersChange(io, [...updatedPlayerIds]);

  return true;
}

async function useCard(io, { playerId, card }) {
  const cardUser = await model.Player.findOne({ id: playerId }).exec();
  if (!cardUser) return false;

  let result;
  let players;
  switch (card) {
    case "均富卡":
      result = await model.Player.aggregate([
        {
          $group: {
            _id: null,
            playerCount: { $sum: 1 },
            totalMoney: { $sum: "$money" },
          },
        },
      ]).exec();
      const { playerCount, totalMoney } = result[0];
      const newMoney = Math.floor(totalMoney / playerCount);
      players = await model.Player.find({}).exec();
      await Promise.all(
        players.map(async (player) => {
          const moneyChange = newMoney - player.money;
          await updateMoney(io, { playerId: player.id, moneyChange });
        })
      );
      await addNotification(io, {
        title: "卡片：均富卡",
        content: `${cardUser.name}使用了均富卡，所有隊伍的現金平分!`,
        type: "card",
      });
      break;

    case "法槌卡":
      result = await model.Player.aggregate([
        {
          $group: {
            _id: null,
            maxMoney: { $max: "$money" },
          },
        },
      ]).exec();
      const { maxMoney } = result[0];
      const maxMoneyPlayers = await model.Player.find({
        money: maxMoney,
      }).exec();
      // Random select a player if multiple maxMoneyPlayers
      const idx = Math.floor(Math.random() * maxMoneyPlayers.length);
      const maxMoneyPlayer = maxMoneyPlayers[idx];
      const moneyToBeSubtracted = Math.floor(maxMoneyPlayer.money / 4);
      const moneyGained = Math.floor(moneyToBeSubtracted / 2);
      await updateMoney(io, {
        playerId: maxMoneyPlayer.id,
        moneyChange: -moneyToBeSubtracted,
      });
      await updateMoney(io, {
        playerId: cardUser.id,
        moneyChange: moneyGained,
      });
      await addNotification(io, {
        title: "卡片：法槌卡",
        content: `${cardUser.name}使用了法槌卡，當前最有錢小隊(${maxMoneyPlayer.name})損失1/4的現金($${moneyToBeSubtracted})，${cardUser.name}獲得其中一半的錢($${moneyGained})`,
        type: "card",
      });
      break;

    case "房稅卡":
      players = await model.Player.find({}).exec();
      await Promise.all(
        players.map(async (player) => {
          if (player.id === cardUser.id) return;
          const buildingsValue = await getOwnedBuildingsValue(player.id);
          await updateMoney(io, {
            playerId: player.id,
            moneyChange: -Math.floor(buildingsValue * 0.2),
          });
        })
      );
      await addNotification(io, {
        title: "卡片：房稅卡",
        content: `${cardUser.name}使用了房稅卡，其他所有隊伍損失持有房產總價值20%的現金`,
        type: "card",
      });
      break;

    default:
      return false;
  }

  return true;
}

async function triggerNextEvent(io, { playerId }) {
  // Get player name
  const player = await model.Player.findOne({ id: playerId }).exec();
  if (!player) return false;

  // Get current index and eventOrder
  const { value: currentEventIndex } = await model.Pair.findOne({
    key: "current-event-index",
  }).exec();
  const { value: eventOrder } = await model.Pair.findOne({
    key: "event-order",
  }).exec();

  // Increase current event index
  await model.Pair.findOneAndUpdate(
    { key: "current-event-index" },
    { $inc: { value: 1 } }
  ).exec();

  // Event 用完都放小夫
  // 小夫的id是10
  const eventId =
    currentEventIndex < eventOrder.length ? eventOrder[currentEventIndex] : 10;

  const eventDocument = await model.Event.findOne({ id: eventId }).exec();
  const { name, description } = eventDocument;

  let addtionalInfo;
  switch (name) {
    case "你們很夠格":
      const goSpace = await model.Space.findOne({ type: "Go" }).exec();
      if (goSpace.level >= goSpace.costs.length - 1) {
        console.error("Go space cannot be upgrade further!");
        return;
      }
      await model.Space.findOneAndUpdate(
        { type: "Go" },
        { $inc: { level: 1 } }
      ).exec();
      await broadcastSpacesChange(io, [goSpace.num]);
      addtionalInfo = `$${goSpace.costs[goSpace.level]} -> $${
        goSpace.costs[goSpace.level + 1]
      }`;
      await addNotification(io, {
        title: `事件：${name}`,
        content: `${player.name}觸發事件：${description}(${addtionalInfo})`,
        type: "event",
      });
      break;
    case "小夫我要進來了":
      await addNotification(io, {
        title: `事件：${name}`,
        content: `${player.name}觸發事件：${description}`,
        type: "event",
      });
      break;
    case "公主號靠岸":
      await addNotification(io, {
        title: `事件：${name}`,
        content: `${player.name}觸發事件：${description}`,
        type: "event",
      });
      break;
    case "武漢肺炎":
      const hospitalSpace = await model.Space.findOne({ name: "醫院" }).exec();
      if (hospitalSpace.ownedBy === "") {
        addtionalInfo = `目前無人擁有醫院`;
      } else {
        const hospitalOwner = await model.Player.findOne({
          name: hospitalSpace.ownedBy,
        }).exec();
        const otherPlayers = await model.Player.find({
          id: { $ne: hospitalOwner.id },
        }).exec();
        let moneyGain = 0;
        await Promise.all(
          otherPlayers.map(async (player) => {
            moneyGain += Math.min(player.money, 3000);
            await updateMoney(io, {
              playerId: player.id,
              moneyChange: -3000,
            });
          })
        );
        await updateMoney(io, {
          playerId: hospitalOwner.id,
          moneyChange: moneyGain,
        });
        addtionalInfo = `${hospitalOwner.name}獲得了$${moneyGain}`;
      }
      await addNotification(io, {
        title: `事件：${name}`,
        content: `${player.name}觸發事件：${description}(${addtionalInfo})`,
        type: "event",
      });
      break;
    case "裂地衝擊":
      await addNotification(io, {
        title: `事件：${name}`,
        content: `${player.name}觸發事件：${description}`,
        type: "event",
      });
      break;
    case "革命":
      const players = await model.Player.find({}).exec();
      await Promise.all(
        players.map(async (player) => {
          if (player.occupation === "農民") {
            await updateMoney(io, {
              playerId: player.id,
              moneyChange: 2 * player.money,
            });
          } else {
            await updateMoney(io, {
              playerId: player.id,
              moneyChange: -Math.floor(player.money / 2),
            });
          }
        })
      );
      await addNotification(io, {
        title: `事件：${name}`,
        content: `${player.name}觸發事件：${description}`,
        type: "event",
      });
      break;
    case "梅圃":
      await addNotification(io, {
        title: `事件：${name}`,
        content: `${player.name}觸發事件：${description}`,
        type: "event",
      });
      break;
    case "流星雨":
      const buildings = await model.Space.find({
        $or: [{ type: "building" }, { type: "special-building" }],
      }).exec();
      const buildingNums = buildings.map((building) => building.num);
      const toBeDestroy = utils.shuffle(buildingNums).slice(0, 5);
      toBeDestroy.sort((a, b) => a - b);
      await addNotification(io, {
        title: `事件：${name}`,
        content: `${player.name}觸發事件：${description}`,
        type: "event",
      });
      await Promise.all(
        toBeDestroy.map(async (spaceNum) => {
          await destroySpace(io, { spaceNum });
        })
      );
      break;
    case "靈堂失火":
      const cemeterySpace = await model.Space.findOne({ name: "墳場" }).exec();
      await destroySpace(io, { spaceNum: cemeterySpace.num - 1 });
      await destroySpace(io, { spaceNum: cemeterySpace.num + 1 });
      await addNotification(io, {
        title: `事件：${name}`,
        content: `${player.name}觸發事件：${description}`,
        type: "event",
      });
      break;
    default:
      return false;
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
      const { name, spaces, notificationReadTime } = req.session;
      res.send({ name, spaces, notificationReadTime });
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
  "/notification-read-time",
  express.json({ strict: false }),
  asyncHandler(async (req, res, next) => {
    const { notificationReadTime } = req.body;

    if (!notificationReadTime || typeof notificationReadTime !== "string") {
      res.status(403).end();
      return;
    }

    req.session.notificationReadTime = notificationReadTime;

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

// Get all cards
router.get(
  "/cards",
  express.json({ strict: false }),
  asyncHandler(async (req, res, next) => {
    const { name } = req.session;
    if (!name || typeof name !== "string") {
      res.status(403).end();
      return;
    }
    if (!verifyPermission(name, ["admin"])) {
      res.status(403).end();
      return;
    }
    res.send(CARDS);
  })
);

// One player use card
router.put(
  "/card",
  express.json({ strict: false }),
  asyncHandler(async (req, res, next) => {
    const { name } = req.session;
    if (!verifyPermission(name, ["admin"])) {
      res.status(403).end();
      return;
    }

    const { playerId, card } = req.body;
    if (
      typeof playerId !== "number" ||
      typeof card !== "string" ||
      !CARDS.includes(card)
    ) {
      res.status(400).end();
      return;
    }

    const { io } = req.app.locals;
    const isSuccess = await useCard(io, { playerId, card });
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

// Use rob card
router.put(
  "/robcard",
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
      const isSuccess = await robCard(io, { spaceNum, playerId });
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

// Buy the space
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

// One player trigger event
router.put(
  "/event",
  express.json({ strict: false }),
  asyncHandler(async (req, res, next) => {
    const { name } = req.session;
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
    const isSuccess = await triggerNextEvent(io, { playerId });
    if (!isSuccess) {
      res.status(400).end();
      return;
    }

    res.status(204).end();
  })
);

// Destroy a space
router.put(
  "/destroy",
  express.json({ strict: false }),
  asyncHandler(async (req, res, next) => {
    const { name } = req.session;
    if (!verifyPermission(name, ["admin", "npc"])) {
      res.status(403).end();
      return;
    }

    const { spaceNum } = req.body;
    if (typeof spaceNum !== "number") {
      res.status(400).end();
      return;
    }

    const { io } = req.app.locals;
    const isSuccess = await destroySpace(io, { spaceNum });
    if (!isSuccess) {
      res.status(400).end();
      return;
    }

    res.status(204).end();
  })
);

module.exports = router;
