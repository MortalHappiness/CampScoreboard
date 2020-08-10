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
import { selectSessionName } from "./features/session/sessionSlice";
import TopBar from "./app/TopBar";
import Loading from "./app/Loading";
import NoPermission from "./app/NoPermission";
import Scoreboard from "./features/scoreboard";
import SpacesList from "./features/spaces";
import NotificationList from "./features/notifications";
import LoginForm from "./app/Login";

import MoneyControl from "./app/admin/MoneyControl";
import UseCards from "./app/admin/UseCards";
import Broadcast from "./app/admin/Broadcast";

import "./App.css";

// ========================================

const ProtectedRoute = ({ permission, children, ...rest }) => {
  const userName = useSelector(selectSessionName);

  if (userName !== permission) {
    return <NoPermission />;
  }

  return <Route {...rest}>{children}</Route>;
};

export default function App() {
  const isConnected = useSelector(selectIsConnected);
  const userName = useSelector(selectSessionName);

  return (
    <Router>
      <div className="App">
        <TopBar />
        <Box className="AppContent">
          {isConnected && userName ? (
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
              <Route exact path="/login">
                <LoginForm />
              </Route>
              <ProtectedRoute
                exact
                path="/admin/money-control"
                permission="admin"
              >
                <MoneyControl />
              </ProtectedRoute>
              <ProtectedRoute exact path="/admin/broadcast" permission="admin">
                <Broadcast />
              </ProtectedRoute>
              <ProtectedRoute exact path="/admin/use-cards" permission="admin">
                <UseCards />
              </ProtectedRoute>
              <ProtectedRoute exact path="/npc">
                NPC page
              </ProtectedRoute>
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
