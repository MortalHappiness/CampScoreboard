import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";

import TopBar from "./app/TopBar";
import Scoreboard from "./features/scoreboard";
import NotificationList from "./features/notifications";

import "./App.css";

// ========================================

export default function App() {
  return (
    <Router>
      <div className="App">
        <TopBar />
        <Switch>
          <Route exact path="/">
            <Scoreboard />
          </Route>
          <Route exact path="/information">
            Information page
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
      </div>
    </Router>
  );
}
