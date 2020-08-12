import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";

const notificationsAdapter = createEntityAdapter({
  selectId: (notification) => notification._id,
  sortComparer: (a, b) => b.time.localeCompare(a.time),
});

const initialState = notificationsAdapter.getInitialState();

const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    notificationsUpdated(state, action) {
      const notifications = action.payload;
      notifications.forEach((notification) => (notification.read = false));
      notificationsAdapter.upsertMany(state, notifications);
    },
    allNotificationsRead(state, action) {
      Object.values(state.entities).forEach((notification) => {
        notification.read = true;
      });
    },
  },
});

export const {
  notificationsUpdated,
  allNotificationsRead,
} = notificationSlice.actions;

export default notificationSlice.reducer;

export const {
  selectAll: selectAllNotifications,
} = notificationsAdapter.getSelectors((state) => state.notifications);
