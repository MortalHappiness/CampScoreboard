const path = require("path");
const express = require("express");
const logger = require("morgan");

//const apiRouter = require("./routes/api");

// ========================================

const port = process.env.PORT || 8000;
const app = express();

// ========================================

if (process.env.NODE_ENV === "development") {
  console.log("NODE_ENV=development");
  require("dotenv").config();
}
if (process.env.NODE_ENV === "production") {
  console.log("NODE_ENV=production");
  app.set("trust proxy", 1);
  console.log("Trust proxy is on");
}

app.use(logger("dev"));
app.use(express.static(path.join(process.cwd(), "build")));
//app.use("/api", apiRouter);
app.get("/api", (req, res) => {
  res.send("api");
});
app.get("/*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "build", "index.html"));
});

// ========================================

let server = app;
let protocal = "http";
if (process.env.NODE_ENV === "development" && process.env.HTTPS) {
  console.log("Use https in development");
  protocal = "https";
  const https = require("https");
  const fs = require("fs");
  const { SSL_CRT_FILE, SSL_KEY_FILE } = process.env;
  const key = fs.readFileSync(SSL_KEY_FILE, "utf8");
  const cert = fs.readFileSync(SSL_CRT_FILE, "utf8");
  server = https.createServer({ key, cert }, app);
}

server.listen(port, () =>
  console.log(`App listening at ${protocal}://localhost:${port}`)
);
