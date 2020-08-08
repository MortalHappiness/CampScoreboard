import { configureStore } from "@reduxjs/toolkit";

import socketReducer from "./features/socket/socketSlice";
import spaceReducer from "./features/spaces/spaceSlice";
import playerReducer from "./features/scoreboard/playerSlice";

export default configureStore({
  reducer: {
    socket: socketReducer,
    spaces: spaceReducer,
    players: playerReducer,
  },
});
