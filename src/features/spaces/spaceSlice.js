import { createSlice } from "@reduxjs/toolkit";

const initialState = [];

const spaceSlice = createSlice({
  name: "spaces",
  initialState,
  reducers: {
    spacesUpdated(state, action) {
      action.payload.forEach((space) => {
        state[space.num] = space;
      });
    },
  },
});

export const { spacesUpdated } = spaceSlice.actions;

export const selectSpaceByNum = (state, num) => state[num];

export default spaceSlice.reducer;
