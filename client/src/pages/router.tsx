import { Route, Switch } from "wouter";
import Home from "./home";
import Reader from "./reader";
import Login from "./login";

export function Router() {
  return (
    <Switch>
      <Route path="login">
        <Login />
      </Route>
      <Route path="/:server/reader/:novel/:chapter">
        {(params) => (
          <Reader
            server={params.server}
            chapter={params.chapter}
            novel={params.novel}
          />
        )}
      </Route>
      <Route path="/:server">
        {(params) => <Home server={params.server} />}
      </Route>
      <Route>
        <Home server="s1" />
      </Route>
    </Switch>
  );
}
