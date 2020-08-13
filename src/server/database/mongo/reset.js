// Reset all data in mongodb

const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const model = require("./model");
const players = require("../data/players.json");
const spaces = require("../data/spaces.json");
const accounts = require("../data/accounts.json");
const notifications = require("../data/notifications.json");
const { events, eventOrder } = require("../data/events.json");

const CONSTANTS = require("../data/constants.json");

// ========================================

require("dotenv").config({ path: path.resolve(__dirname, "../../../../.env") });

const { MONGO_HOST, MONGO_DB_NAME } = process.env;

const { INITIAL_MONEY } = CONSTANTS;

const saltRounds = 10;

// ========================================

module.exports = () => {
  mongoose.connect(`mongodb://${MONGO_HOST}/${MONGO_DB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error:"));
  db.once("open", async () => {
    console.log("Successfully connect to MongoDB!");
    console.log(`database = "${MONGO_DB_NAME}"`);

    // Drop the db
    await db.dropDatabase();
    console.log("Database has been cleared.");

    // Save key-value pairs
    console.log("Saving key-value pairs...");
    new model.Pair({ key: "current-event-index", value: 0 }).save();
    new model.Pair({ key: "event-order", value: eventOrder }).save();
    console.log("All key-value pairs are saved.");

    // Save all players
    await Promise.all(
      players.map(async (player) => {
        player.money = INITIAL_MONEY;
        player.score = INITIAL_MONEY;
        const playerDocument = new model.Player(player);
        await playerDocument.save();
      })
    );
    console.log("All players are saved.");

    // Save all notifications
    await Promise.all(
      notifications.map(async (notification) => {
        notification.time = new Date().toISOString();
        const notificationDocument = new model.Notification(notification);
        await notificationDocument.save();
      })
    );
    console.log("All notifications are saved.");

    // Save all spaces
    await Promise.all(
      spaces.map(async (space, index) => {
        space.num = index;
        if (space.type === "building") {
          space.level = 0;
          space.shouldDouble = false;
          space.ownedBy = "";
        }
        if (space.type === "game") {
          space.costs = [space.value];
          delete space.value;
          space.highestScore = 0;
          space.ownedBy = "";
        }
        if (space.type === "Go") {
          space.costs = space.values;
          delete space.values;
          space.level = 0;
        }
        if (space.type === "special-building") {
          space.costs = [space.cost];
          space.taxes = [space["tax-base"]];
          delete space.cost;
          delete space["tax-base"];
          space.ownedBy = "";
          space.multiple = 0;
        }
        const spaceDocument = new model.Space(space);
        await spaceDocument.save();
      })
    );
    console.log("All spaces are saved.");

    // Use bcrypt to hash passwords of all accounts
    console.log("Hashing passwords of all accounts...");
    await Promise.all(
      accounts.map(async (account) => {
        const salt = await bcrypt.genSalt(saltRounds);
        const passwordHash = await bcrypt.hash(account.password, salt);
        account.passwordHash = passwordHash;
        //delete account.password;
      })
    );
    console.log("All passwords are hashed!");

    // Save all accounts
    await Promise.all(
      accounts.map(async (account) => {
        const accountDocument = new model.Account(account);
        await accountDocument.save();
      })
    );
    console.log("All accounts are saved.");

    // Save all events
    await Promise.all(
      events.map(async (data) => {
        const eventDocument = new model.Event(data);
        await eventDocument.save();
      })
    );
    console.log("All events are saved.");

    // Disconnect
    await mongoose.disconnect();
  });
};
