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
      <Route path="/reader/:slug">
        {(params) => <Reader slug={params.slug} />}
      </Route>
      <Route>
        <Home />
      </Route>
    </Switch>
  );
}
