import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  Link,
} from "react-router-dom";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route
            exact
            path="/"
            component={() => <Link to="/control">to control</Link>}
          />
          <Route exact path="/control" component={() => <div>control</div>} />
          <Redirect to="/" />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
