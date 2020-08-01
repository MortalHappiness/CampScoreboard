const { createProxyMiddleware } = require("http-proxy-middleware");

const target = process.env.REACT_APP_PROXY_TARGET;

module.exports = (app) => {
  app.use(
    "/api",
    createProxyMiddleware({
      target,
      changeOrigin: true,
      secure: false,
    })
  );
};
