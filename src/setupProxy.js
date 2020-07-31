const { createProxyMiddleware } = require("http-proxy-middleware");

const port = process.env.PORT || 8000;
const protocal = process.env.HTTPS ? "https" : "http";

module.exports = (app) => {
  app.use(
    "/api",
    createProxyMiddleware({
      target: `${protocal}://localhost:${port}`,
      changeOrigin: true,
      secure: false,
    })
  );
};
