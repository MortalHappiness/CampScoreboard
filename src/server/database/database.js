// Database operations cli

const resetMongo = require("./mongo/reset");

// ========================================

require("yargs") // eslint-disable-line
  .usage("Usage: node $0 <command>")
  .command(
    "reset",
    "Reset all data in database.",
    () => {},
    (argv) => {
      resetMongo();
    }
  )
  .epilog("Type 'node database.js <command> --help' for help of each command.")
  .alias("h", "help")
  .version(false)
  .strictCommands(true)
  .demandCommand(1, "No command specified.").argv;
