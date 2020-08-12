import React, { createContext } from "react";
import io from "socket.io-client";
import { useDispatch } from "react-redux";

import {
  socketConnected,
  socketDisconnected,
} from "./features/socket/socketSlice";

import { sessionUpdated } from "./features/session/sessionSlice";
import { spacesUpdated } from "./features/spaces/spaceSlice";
import { playersUpdated } from "./features/scoreboard/playerSlice";
import { notificationsUpdated } from "./features/notifications/notificationSlice";

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

    socket.on("connect", () => {
      console.log("Connected to server");
      dispatch(socketConnected());
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from server");
      dispatch(socketDisconnected());
    });

    socket.on("UPDATE_SESSION", (data) => {
      dispatch(sessionUpdated(data));
    });

    socket.on("UPDATE_PLAYERS", (data) => {
      dispatch(playersUpdated(data));
    });

    socket.on("UPDATE_SPACES", (data) => {
      dispatch(spacesUpdated(data));
    });

    socket.on("UPDATE_NOTIFICATIONS", (data) => {
      dispatch(notificationsUpdated(data));
    });

    ws = { socket };
  }

  return (
    <WebSocketContext.Provider value={ws}>{children}</WebSocketContext.Provider>
  );
};
