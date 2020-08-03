import { configureStore } from "@reduxjs/toolkit";

import socketReducer from "./features/socket/socketSlice";
import spaceReducer from "./features/spaces/spaceSlice";

export default configureStore({
  reducer: {
    socket: socketReducer,
    spaces: spaceReducer,
  },
});
