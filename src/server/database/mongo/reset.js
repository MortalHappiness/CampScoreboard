// Reset all data in mongodb

const path = require("path");
const mongoose = require("mongoose");

const model = require("./model");
const players = require("../data/players");

// ========================================

require("dotenv").config({ path: path.resolve(__dirname, "../../../../.env") });

const { MONGO_HOST, MONGO_DB_NAME } = process.env;

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

    // Save all courses
    await Promise.all(
      players.map(async (player) => {
        const playerDocument = new model.Player(player);
        await playerDocument.save();
      })
    );
    console.log("All players are saved.");

    // Disconnect
    await mongoose.disconnect();
  });
};
