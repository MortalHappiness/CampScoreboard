import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";

const playerAdapter = createEntityAdapter({
  selectId: (player) => player.id,
  sortComparer: (a, b) => b.score - a.score,
});

const initialState = playerAdapter.getInitialState();

const playerSlice = createSlice({
  name: "players",
  initialState,
  reducers: {
    playersUpdated(state, action) {
      playerAdapter.upsertMany(state, action.payload);
    },
  },
});

export const { playersUpdated } = playerSlice.actions;

export const {
  selectAll: selectAllPlayers,
  selectById: selectPlayerById,
  selectIds: selectPlayerIds,
} = playerAdapter.getSelectors((state) => state.players);

export default playerSlice.reducer;
