import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { useSelector } from "react-redux";

import Box from "@material-ui/core/Box";

import { selectIsConnected } from "./features/socket/socketSlice";
import TopBar from "./app/TopBar";
import Loading from "./app/Loading";
import Scoreboard from "./features/scoreboard";
import SpacesList from "./features/spaces";
import NotificationList from "./features/notifications";

import "./App.css";

// ========================================

export default function App() {
  const isConnected = useSelector(selectIsConnected);

  return (
    <Router>
      <div className="App">
        <TopBar />
        <Box className="AppContent">
          {isConnected ? (
            <Switch>
              <Route exact path="/">
                <Scoreboard />
              </Route>
              <Route exact path="/spaces">
                <SpacesList />
              </Route>
              <Route exact path="/notifications">
                <NotificationList />
              </Route>
              <Route exact path="/admin">
                Admin page
              </Route>
              <Route exact path="/npc">
                NPC page
              </Route>
              <Redirect to="/" />
            </Switch>
          ) : (
            <Loading />
          )}
        </Box>
      </div>
    </Router>
  );
}
