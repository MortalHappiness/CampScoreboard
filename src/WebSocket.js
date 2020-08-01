import React, { createContext } from "react";
import io from "socket.io-client";
import { useDispatch } from "react-redux";

// ========================================

const WebSocketContext = createContext(null);

export { WebSocketContext };

export default ({ children }) => {
  let socket;
  let ws;

  const dispatch = useDispatch();

  if (!socket) {
    switch (process.env.NODE_ENV) {
      case "development":
        socket = io(process.env.REACT_APP_PROXY_TARGET);
        break;
      case "production":
        socket = io();
        break;
      default:
        console.error("Invalid NODE_ENV!");
    }
    console.log(process.env.NODE_ENV);

    socket.on("connect", () => {
      console.log("Connected to server");
    });

    ws = { socket };
  }

  return (
    <WebSocketContext.Provider value={ws}>{children}</WebSocketContext.Provider>
  );
};
