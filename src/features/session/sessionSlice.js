import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
  name: null,
};

export const createSession = createAsyncThunk(
  "session/createSession",
  async ({ name, password }) => {
    const res = await fetch("/api/session", {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
      body: `name=${name}&password=${password}`,
      credentials: "include",
    });

    if (res.ok) {
      return await res.json();
    } else {
      throw new Error("Wrong username or password!");
    }
  }
);

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    sessionUpdated(state, action) {
      state.name = action.payload.name;
      state.spaces = action.payload.spaces;
    },
  },
  extraReducers: {
    [createSession.fulfilled]: (state, action) => {
      state.name = action.payload.name;
      state.spaces = action.payload.spaces;
    },
  },
});

export const { sessionUpdated } = sessionSlice.actions;

export const selectSessionName = (state) => state.session.name;
export const selectSessionSpaces = (state) => state.session.spaces;

export default sessionSlice.reducer;
