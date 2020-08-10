const model = require("./database/mongo/model");

function updateSession(socket) {
  const { session } = socket.request;
  if (!session.name) {
    session.name = "guest";
  }
  const { name, spaces } = session;
  socket.emit("UPDATE_SESSION", { name, spaces });
}

function updatePlayers(socket) {
  model.Player.find({}, { _id: false, __v: false })
    .exec()
    .then((data) => {
      socket.emit("UPDATE_PLAYERS", data);
    })
    .catch((e) => console.error(e));
}

function updateSpaces(socket) {
  model.Space.find({}, { _id: false, __v: false })
    .exec()
    .then((data) => {
      socket.emit("UPDATE_SPACES", data);
    })
    .catch((e) => console.error(e));
}

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`A user connected, id = ${socket.id}`);
    updateSession(socket);
    updatePlayers(socket);
    updateSpaces(socket);
    socket.on("disconnect", () => {
      console.log(`A user disconnected, id = ${socket.id}`);
    });
  });
};
