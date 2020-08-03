const model = require("./database/mongo/model");

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
    console.log(socket.request.session);
    updateMoney(socket);
    updateSpaces(socket);
    socket.on("disconnect", () => {
      console.log(`A user disconnected, id = ${socket.id}`);
    });
  });
};
