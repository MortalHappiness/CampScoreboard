const fs = require("fs");
const path = require("path");
const uuid = require("node-uuid");
const http = require("http");
const https = require("https");

const express = require("express");
const logger = require("morgan");
const session = require("express-session");
const asyncHandler = require("express-async-handler");
const redis = require("redis");
const connectRedis = require("connect-redis");
const bcrypt = require("bcrypt");

const apiRouter = require("./routes/api");

// ========================================

if (process.env.NODE_ENV === "development") {
  console.log("NODE_ENV = development");
  require("dotenv").config();
}

// ========================================

const { NODE_ENV, HTTPS, PORT, REDIS_HOST, SESSION_PREFIX } = process.env;

const port = PORT || 8000;
const app = express();

let server;
let protocal = "http";
if (NODE_ENV === "development" && HTTPS) {
  console.log("Use https in development");
  protocal = "https";
  const { SSL_CRT_FILE, SSL_KEY_FILE } = process.env;
  const key = fs.readFileSync(SSL_KEY_FILE, "utf8");
  const cert = fs.readFileSync(SSL_CRT_FILE, "utf8");
  server = https.createServer({ key, cert }, app);
} else {
  server = http.createServer(app);
}

const io = require("socket.io")(server);

const redisClient = redis.createClient(6379, REDIS_HOST);
redisClient.on("error", console.error);

// ========================================
// Session middleware

const RedisStore = connectRedis(session);

const sessionOptions = {
  cookie: {
    path: "/",
    httpOnly: true,
    secure: true,
    maxAge: null,
  },
  resave: false,
  saveUninitialized: false,
  secret: uuid.v4(),
  unset: "destroy",
  store: new RedisStore({
    client: redisClient,
    prefix: SESSION_PREFIX,
  }),
};

// clear all sessions in redis
sessionOptions.store.clear();

if (NODE_ENV === "development" && !HTTPS) {
  sessionOptions.cookie.secure = false;
  console.log("Secure cookie is off");
}
if (NODE_ENV === "production") {
  console.log("NODE_ENV = production");
  app.set("trust proxy", 1);
  console.log("Trust proxy is on");
}

const sessionMiddleware = session(sessionOptions);

// Share express session with socket io
io.use((socket, next) => {
  sessionMiddleware(socket.request, socket.request.res || {}, next);
});

app.use(sessionMiddleware);

// ========================================
// Handle requests

app.use(logger("dev"));
app.use(express.static(path.join(process.cwd(), "build")));

app.get("/api", (req, res) => {
  res.send("api");
});

app.get("/*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "build", "index.html"));
});

// ========================================
// Handle socket events

io.on("connection", (socket) => {
  console.log(`A user connected, id = ${socket.id}`);
  console.log(socket.request.session);
  socket.on("disconnect", () => {
    console.log(`A user disconnected, id = ${socket.id}`);
  });
});

// ========================================

server.listen(port, () =>
  console.log(`App listening at ${protocal}://localhost:${port}`)
);
