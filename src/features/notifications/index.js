import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import clsx from "clsx";
import { formatDistanceToNow, parseISO } from "date-fns";

import { makeStyles } from "@material-ui/core/styles";

import {
  selectAllNotifications,
  allNotificationsRead,
} from "./notificationSlice";

// ========================================

const useStyles = makeStyles({
  notification: {
    border: "1px solid #ccc",
    padding: "0.5rem",
    borderTop: "none",
  },
  notificationList: {
    textAlign: "left",
  },
  isNew: {
    backgroundColor: "rgba(29, 161, 242, 0.1)",
  },
  timeAgo: {
    color: "#777",
  },
});

// ========================================

const Notification = ({ data }) => {
  const classes = useStyles();

  const { title, content, time, read } = data;
  const timeAgo = formatDistanceToNow(parseISO(time));
  const className = clsx(classes.notification, !read && classes.isNew);

  return (
    <div className={className}>
      <div>
        <b>{title}</b>
      </div>
      <div>{content}</div>
      <div title={time}>
        <i className={classes.timeAgo}>{timeAgo} ago</i>
      </div>
    </div>
  );
};

export default function NotificationList() {
  const classes = useStyles();
  const dispatch = useDispatch();
  const notifications = useSelector(selectAllNotifications);

  useEffect(() => {
    return () => {
      dispatch(allNotificationsRead());
    };
  }, [dispatch]);

  return (
    <section className={classes.notificationList}>
      {notifications.map((notification) => (
        <Notification key={notification._id} data={notification} />
      ))}
    </section>
  );
}
