import React, { useState } from "react";
import { useLocation, useHistory } from "react-router-dom";

import { makeStyles } from "@material-ui/core/styles";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import Drawer from "@material-ui/core/Drawer";
import PollIcon from "@material-ui/icons/Poll";
import WidgetsIcon from "@material-ui/icons/Widgets";

// ========================================

const useStyles = makeStyles((theme) => ({
  menuButton: {
    marginRight: theme.spacing(2),
  },
  list: {
    width: 220,
  },
}));

// ========================================

const ListItemLink = ({ to, icon, text }) => {
  const { pathname } = useLocation();
  const history = useHistory();
  const isMatch = to === pathname;

  const handleOnClick = () => {
    if (!isMatch) {
      history.push(to);
    }
  };

  return (
    <ListItem button onClick={handleOnClick} selected={isMatch}>
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={text} />
    </ListItem>
  );
};

export default function MenuButtonDrawer() {
  const classes = useStyles();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDrawer = (open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setIsOpen(open);
  };

  const MenuList = () => (
    <div
      className={classes.list}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <List>
        <ListItemLink to="/" icon={<PollIcon />} text={"Scoreboard"} />
        <ListItemLink to="/spaces" icon={<WidgetsIcon />} text={"Spaces"} />
      </List>
    </div>
  );

  return (
    <div>
      <IconButton
        edge="start"
        className={classes.menuButton}
        color="inherit"
        aria-label="open drawer"
        onClick={toggleDrawer(true)}
      >
        <MenuIcon />
      </IconButton>
      <Drawer anchor="left" open={isOpen} onClose={toggleDrawer(false)}>
        <MenuList />
      </Drawer>
    </div>
  );
}
