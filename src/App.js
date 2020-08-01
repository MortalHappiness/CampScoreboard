import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  Link,
} from "react-router-dom";

import TopBar from "./app/TopBar";
import "./App.css";

// ========================================

export default function App() {
  return (
    <Router>
      <div className="App">
        <TopBar />
        <Switch>
          <Route exact path="/">
            <Link to="/admin">
              To Admin page
              <br />
            </Link>
            <Link to="/npc">
              To NPC page
              <br />
            </Link>
            <Link to="/information">
              To information page
              <br />
            </Link>
          </Route>
          <Route exact path="/information">
            Information page
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
