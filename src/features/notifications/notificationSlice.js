import {
  createSlice,
  createEntityAdapter,
  createAsyncThunk,
} from "@reduxjs/toolkit";

import { sessionUpdated } from "../session/sessionSlice";

const notificationsAdapter = createEntityAdapter({
  selectId: (notification) => notification._id,
  sortComparer: (a, b) => b.time.localeCompare(a.time),
});

const initialState = notificationsAdapter.getInitialState();

export const allNotificationsRead = createAsyncThunk(
  "notifications/allNotificationsRead",
  async (_, { dispatch, getState }) => {
    // Get latest time stamp
    const allNotifications = selectAllNotifications(getState());
    const [latestNotification] = allNotifications;
    if (!latestNotification) return;
    const readTime = latestNotification.time;

    dispatch(allNotificationsReadUpdateState({ readTime }));

    await fetch("/api/notification-read-time", {
      method: "PUT",
      body: JSON.stringify({
        notificationReadTime: readTime,
      }),
      headers: {
        "content-type": "application/json",
      },
    });
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    notificationsUpdated(state, action) {
      const notifications = action.payload;
      notifications.forEach((notification) => {
        // When state.readTime is undefined, the following comparison
        // resolves to false, so all notification.read is false
        notification.read = notification.time <= state.readTime;
      });
      notificationsAdapter.upsertMany(state, notifications);
    },
    allNotificationsReadUpdateState(state, action) {
      state.readTime = action.payload.readTime;
      Object.values(state.entities).forEach((notification) => {
        notification.read = true;
      });
    },
  },
  extraReducers: {
    [sessionUpdated]: (state, action) => {
      state.readTime = action.payload.notificationReadTime;
    },
  },
});

export const {
  notificationsUpdated,
  allNotificationsReadUpdateState,
} = notificationSlice.actions;

export default notificationSlice.reducer;

export const {
  selectAll: selectAllNotifications,
} = notificationsAdapter.getSelectors((state) => state.notifications);
export const selectNotificationReadTime = (state) =>
  state.notifications.readTime;
