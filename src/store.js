import { configureStore } from "@reduxjs/toolkit";

import socketReducer from "./features/socket/socketSlice";
import sessionReducer from "./features/session/sessionSlice";
import spaceReducer from "./features/spaces/spaceSlice";
import playerReducer from "./features/scoreboard/playerSlice";
import notificationReducer from "./features/notifications/notificationSlice";

export default configureStore({
  reducer: {
    socket: socketReducer,
    session: sessionReducer,
    spaces: spaceReducer,
    players: playerReducer,
    notifications: notificationReducer,
  },
});
