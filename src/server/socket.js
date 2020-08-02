const model = require("./database/mongo/model");

function updateScores(socket) {
  model.Player.find({}, { _id: false, __v: false })
    .exec()
    .then((data) => {
      socket.emit("UPDATE_SCORES", data);
    })
    .catch((e) => console.error(e));
}

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`A user connected, id = ${socket.id}`);
    console.log(socket.request.session);
    updateScores(socket);
    socket.on("disconnect", () => {
      console.log(`A user disconnected, id = ${socket.id}`);
    });
  });
};
