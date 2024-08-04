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
      <Route path="/reader/:novel/:chapter">
        {(params) => <Reader chapter={params.chapter} novel={params.novel} />}
      </Route>
      <Route>
        <Home />
      </Route>
    </Switch>
  );
}
