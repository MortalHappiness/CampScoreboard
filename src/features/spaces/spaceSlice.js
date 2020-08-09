import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";

const spacesAdapter = createEntityAdapter({
  selectId: (space) => space.num,
  sortComparer: (a, b) => a.num - b.num,
});

const initialState = spacesAdapter.getInitialState();

const spaceSlice = createSlice({
  name: "spaces",
  initialState,
  reducers: {
    spacesUpdated(state, action) {
      spacesAdapter.upsertMany(state, action.payload);
    },
  },
});

export const { spacesUpdated } = spaceSlice.actions;

export const {
  selectAll: selectAllSpaces,
  selectById: selectSpaceByNum,
  selectIds: selectSpaceNums,
} = spacesAdapter.getSelectors((state) => state.spaces);

export default spaceSlice.reducer;
