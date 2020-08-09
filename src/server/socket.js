const model = require("./database/mongo/model");

function updateSession(socket) {
  const { name } = socket.request.session;
  socket.emit("UPDATE_SESSION", { name });
}

function updateMoney(socket) {
  model.Player.find({}, { _id: false, __v: false })
    .exec()
    .then((data) => {
      socket.emit("UPDATE_MONEY", data);
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
    updateMoney(socket);
    updateSpaces(socket);
    updateSession(socket);
    socket.on("disconnect", () => {
      console.log(`A user disconnected, id = ${socket.id}`);
    });
  });
};
