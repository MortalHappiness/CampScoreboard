import { createSlice } from "@reduxjs/toolkit";

const initialState = { isConnected: false };

const socketSlice = createSlice({
  name: "socket",
  initialState,
  reducers: {
    socketConnected(state) {
      state.isConnected = true;
    },
    socketDisconnected(state) {
      state.isConnected = false;
    },
  },
});

export const { socketConnected, socketDisconnected } = socketSlice.actions;

export const selectIsConnected = (state) => state.socket.isConnected;

export default socketSlice.reducer;
