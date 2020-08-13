import React from "react";
import { useSelector } from "react-redux";
import clsx from "clsx";
import {
  Switch,
  Route,
  useLocation,
  useHistory,
  useParams,
} from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import Badge from "@material-ui/core/Badge";
import NotificationsIcon from "@material-ui/icons/Notifications";

import MenuButtonDrawer from "./menu";

import { selectAllNotifications } from "../../features/notifications/notificationSlice";

// ========================================

const useStyles = makeStyles((theme) => ({
  grow: {
    flexGrow: 1,
  },
  selected: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    "&:hover, &.Mui-focusVisible": {
      backgroundColor: "rgba(255, 255, 255, 0.3)",
    },
  },
}));

// ========================================

const SpaceControlTitle = () => {
  const { spaceId } = useParams();
  return `Space ${spaceId}`;
};

const BarTitle = () => {
  return (
    <Typography variant="h6">
      <Switch>
        <Route path="/admin/money-control">Money Control</Route>
        <Route path="/admin/use-cards">Use Cards</Route>
        <Route path="/admin/set-occupation">Set Occupation</Route>
        <Route path="/admin/spaces-control">Spaces Control</Route>
        <Route path="/spaces">Spaces</Route>
        <Route path="/notifications">Notifications</Route>
        <Route path="/login">Login</Route>
        <Route path="/npc/space-control/:spaceId">
          <SpaceControlTitle />
        </Route>
        <Route path="/">Scoreboard</Route>
      </Switch>
    </Typography>
  );
};

const NotificationButtonLink = () => {
  const { pathname } = useLocation();
  const history = useHistory();
  const classes = useStyles();
  const match = pathname === "/notifications";

  const notifications = useSelector(selectAllNotifications);
  const numUnreadNotifications = notifications.filter((n) => !n.read).length;

  const handleOnClick = () => {
    if (!match) {
      history.push("/notifications");
    } else {
      history.goBack();
    }
  };

  return (
    <IconButton
      aria-label="show notifications"
      onClick={handleOnClick}
      color="inherit"
      disableFocusRipple
      disableRipple
      className={clsx(match && classes.selected)}
    >
      <Badge
        invisible={match || !numUnreadNotifications}
        badgeContent={numUnreadNotifications}
        color="secondary"
      >
        <NotificationsIcon />
      </Badge>
    </IconButton>
  );
};

export default function TopBar() {
  const classes = useStyles();

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <MenuButtonDrawer />
          <BarTitle />
          <div className={classes.grow} />
          <NotificationButtonLink />
        </Toolbar>
      </AppBar>
      <Toolbar />
    </>
  );
}
