import React from "react";
import { Switch, Route } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import Typography from "@material-ui/core/Typography";
import Badge from "@material-ui/core/Badge";
import NotificationsIcon from "@material-ui/icons/Notifications";

import MenuButtonDrawer from "./menu";

// ========================================

const useStyles = makeStyles((theme) => ({
  grow: {
    flexGrow: 1,
  },
}));

// ========================================

const BarTitle = () => {
  return (
    <Typography variant="h6">
      <Switch>
        <Route path="/admin">Admin Page</Route>
        <Route path="/npc">NPC Page</Route>
        <Route path="/">Scoreboard</Route>
      </Switch>
    </Typography>
  );
};

const NotificationButtonMenu = () => {
  return (
    <IconButton aria-label="show notifications" color="inherit">
      <Badge badgeContent={7} color="secondary">
        <NotificationsIcon />
      </Badge>
    </IconButton>
  );
};

export default function TopBar() {
  const classes = useStyles();

  return (
    <div className={classes.grow}>
      <AppBar position="static">
        <Toolbar>
          <MenuButtonDrawer />
          <BarTitle />
          <div className={classes.grow} />
          <NotificationButtonMenu />
        </Toolbar>
      </AppBar>
    </div>
  );
}
