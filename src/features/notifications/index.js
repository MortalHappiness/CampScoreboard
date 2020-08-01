import React from "react";
import clsx from "clsx";
import { formatDistanceToNow, parseISO } from "date-fns";

// Direct import css for now
// TODO: change it
import "./style.css";

// ========================================

const notifications = [
  {
    id: "1",
    date: "2020-08-01T16:54:10.497Z",
    message: "hi",
    isNew: true,
  },
  {
    id: "2",
    date: "2020-07-21T16:54:10.497Z",
    message: "hello",
    isNew: false,
  },
  {
    id: "3",
    date: "2020-06-12T16:54:10.497Z",
    message: "old",
    isNew: false,
  },
];

export default function NotificationList() {
  const renderedNotifications = notifications.map((notification) => {
    const date = parseISO(notification.date);
    const timeAgo = formatDistanceToNow(date);

    const notificationClassname = clsx(
      "notification",
      notification.isNew && "new"
    );

    return (
      <div key={notification.id} className={notificationClassname}>
        <div>
          <b>{notification.message}</b>
        </div>
        <div title={notification.date}>
          <i>{timeAgo} ago</i>
        </div>
      </div>
    );
  });

  return (
    <section className="notificationsList">{renderedNotifications}</section>
  );
}
