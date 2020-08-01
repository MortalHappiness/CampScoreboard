import { configureStore } from "@reduxjs/toolkit";

import socketReducer from "../features/socket/socketSlice";

export default configureStore({
  reducer: {
    socket: socketReducer,
  },
});
