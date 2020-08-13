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

import MoneyControl from "./app/control/MoneyControl";
import UseCards from "./app/admin/UseCards";
import SetOccupation from "./app/admin/SetOccupation";
import SpacesControl from "./app/admin/SpacesControl";

import SpaceControl from "./app/npc/SpaceControl";

import "./App.css";

// ========================================

const ProtectedRoute = ({ permission, children, ...rest }) => {
  const userName = useSelector(selectSessionName);

  switch (permission) {
    case "admin":
      if (userName !== "admin") {
        return <NoPermission />;
      }
      break;
    case "npc":
      if (userName !== "admin" && !userName.startsWith("npc")) {
        return <NoPermission />;
      }
      break;
    default:
      break;
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
              <ProtectedRoute
                exact
                path="/admin/set-occupation"
                permission="admin"
              >
                <SetOccupation />
              </ProtectedRoute>
              <ProtectedRoute
                exact
                path="/admin/spaces-control"
                permission="admin"
              >
                <SpacesControl />
              </ProtectedRoute>
              <ProtectedRoute exact path="/admin/use-cards" permission="admin">
                <UseCards />
              </ProtectedRoute>
              <ProtectedRoute
                path="/npc/space-control/:spaceId"
                permission="npc"
              >
                <SpaceControl />
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
